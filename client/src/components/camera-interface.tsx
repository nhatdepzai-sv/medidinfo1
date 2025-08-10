
import React, { useRef, useCallback, useState, useEffect } from "react";
import { Camera, X, FlipHorizontal, RotateCcw, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useLanguage } from "@/contexts/language-context";
import { createWorker, type Worker } from "tesseract.js";

interface CameraInterfaceProps {
  onCapture: (file: File, extractedText?: string) => void;
  onClose: () => void;
  isProcessing: boolean;
  processingStage: string;
}

export default function CameraInterface({ 
  onCapture, 
  onClose, 
  isProcessing, 
  processingStage 
}: CameraInterfaceProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const workerRef = useRef<Worker | null>(null);
  
  const [isCameraReady, setIsCameraReady] = useState(false);
  const [facingMode, setFacingMode] = useState<"user" | "environment">("environment");
  const [error, setError] = useState<string>("");
  const [isCapturing, setIsCapturing] = useState(false);
  const [processingStageLocal, setProcessingStageLocal] = useState("");
  
  const { t } = useLanguage();

  // Initialize Tesseract worker
  const initializeWorker = useCallback(async () => {
    try {
      if (workerRef.current) {
        await workerRef.current.terminate();
      }

      console.log("Initializing Tesseract worker...");
      const worker = await createWorker({
        logger: (m) => console.log("Tesseract:", m),
        errorHandler: (err) => console.error("Tesseract error:", err)
      });

      // Load language data
      await worker.loadLanguage('eng');
      await worker.initialize('eng');

      // Configure for better medication text recognition
      await worker.setParameters({
        tessedit_char_whitelist: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789 .-()/',
        tessedit_pageseg_mode: 8, // Single word
        preserve_interword_spaces: 1,
        tessedit_do_invert: 0
      });

      workerRef.current = worker;
      console.log("Tesseract worker initialized successfully");
    } catch (error) {
      console.error("Failed to initialize Tesseract worker:", error);
      setError(t("tesseractInitializationError") || "Failed to initialize OCR engine");
    }
  }, [t]);

  // Start camera
  const startCamera = useCallback(async () => {
    try {
      setError("");
      
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }

      const constraints: MediaStreamConstraints = {
        video: {
          facingMode: facingMode,
          width: { ideal: 1920, max: 1920 },
          height: { ideal: 1080, max: 1080 }
        }
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
        setIsCameraReady(true);
      }
    } catch (err) {
      console.error("Error accessing camera:", err);
      setError(t("cameraAccessError") || "Camera access error");
      setIsCameraReady(false);
    }
  }, [facingMode, t]);

  // Initialize on mount
  useEffect(() => {
    initializeWorker();
    startCamera();

    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      if (workerRef.current) {
        workerRef.current.terminate();
      }
    };
  }, [initializeWorker, startCamera]);

  // Restart camera when facing mode changes
  useEffect(() => {
    if (isCameraReady) {
      startCamera();
    }
  }, [facingMode, startCamera, isCameraReady]);

  const processImageWithOCR = async (imageBlob: Blob): Promise<string> => {
    if (!workerRef.current) {
      throw new Error(t("ocrNotReady") || "OCR engine not ready");
    }

    setProcessingStageLocal(t("analyzingImage") || "Analyzing image...");

    try {
      // Convert blob to buffer for Tesseract
      const arrayBuffer = await imageBlob.arrayBuffer();
      const uint8Array = new Uint8Array(arrayBuffer);

      console.log("Starting OCR processing...");
      
      // Multiple OCR attempts with different configurations
      const ocrConfigs = [
        { tessedit_pageseg_mode: 8 }, // Single word
        { tessedit_pageseg_mode: 7 }, // Single text line
        { tessedit_pageseg_mode: 6 }, // Single uniform block
        { tessedit_pageseg_mode: 13 }, // Raw line
      ];

      let bestResult = "";
      let bestConfidence = 0;

      for (const config of ocrConfigs) {
        try {
          await workerRef.current.setParameters(config);
          const result = await workerRef.current.recognize(uint8Array);
          const confidence = result.data.confidence || 0;
          
          console.log(`OCR Config ${config.tessedit_pageseg_mode}: "${result.data.text.trim()}" (confidence: ${confidence})`);
          
          if (confidence > bestConfidence && result.data.text.trim().length > 0) {
            bestResult = result.data.text.trim();
            bestConfidence = confidence;
          }
        } catch (err) {
          console.warn('OCR config failed:', err);
        }
      }

      console.log('Best OCR Result:', bestResult, 'Confidence:', bestConfidence);

      if (!bestResult || bestResult.length < 2 || bestConfidence < 15) {
        throw new Error('No clear text detected. Please ensure good lighting and focus on the medication name.');
      }

      setProcessingStageLocal(t("searchingDatabase") || "Searching database...");

      // Advanced text cleaning for medication names
      const cleanedText = bestResult
        .replace(/[^\w\s.-]/g, ' ') // Remove special chars except dots and hyphens
        .replace(/\s+/g, ' ') // Normalize whitespace
        .replace(/\b\d+mg?\b/gi, '') // Remove dosage information
        .replace(/\b(tablet|capsule|pill|mg|mcg|ml|cap|tab)\b/gi, '') // Remove common medication terms
        .trim();

      // Extract potential drug names with better filtering
      const words = cleanedText.split(' ')
        .filter(word => word.length >= 3) // At least 3 characters
        .filter(word => /^[A-Za-z]/.test(word)) // Starts with a letter
        .filter(word => !/^\d+$/.test(word)); // Not just numbers

      // Create search queries
      const searchQueries = [
        cleanedText,
        ...words,
        bestResult.trim() // Include original text as fallback
      ].filter(query => query.length >= 3);

      console.log("Search queries:", searchQueries);

      return searchQueries[0] || bestResult.trim();

    } catch (error) {
      console.error("OCR processing error:", error);
      throw new Error(error instanceof Error ? error.message : "OCR processing failed");
    }
  };

  const capturePhoto = useCallback(async () => {
    if (!videoRef.current || !canvasRef.current || !isCameraReady || isCapturing) {
      return;
    }

    setIsCapturing(true);
    setError("");

    try {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');

      if (!context) {
        throw new Error("Canvas context not available");
      }

      // Set canvas dimensions to match video
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      // Draw the current video frame to canvas
      context.drawImage(video, 0, 0, canvas.width, canvas.height);

      // Convert to blob
      const blob = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob((blob) => {
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error("Failed to create image blob"));
          }
        }, 'image/jpeg', 0.8);
      });

      // Process with OCR
      let extractedText = "";
      try {
        extractedText = await processImageWithOCR(blob);
      } catch (ocrError) {
        console.warn("OCR failed, continuing without text extraction:", ocrError);
      }

      // Convert blob to File
      const file = new File([blob], `medication-${Date.now()}.jpg`, { type: 'image/jpeg' });
      
      onCapture(file, extractedText);

    } catch (error) {
      console.error("Camera error:", error);
      setError(error instanceof Error ? error.message : "Failed to capture photo");
    } finally {
      setIsCapturing(false);
      setProcessingStageLocal("");
    }
  }, [isCameraReady, isCapturing, onCapture, processImageWithOCR]);

  const toggleCamera = () => {
    setFacingMode(prev => prev === "user" ? "environment" : "user");
  };

  const retryCamera = () => {
    setError("");
    startCamera();
  };

  if (error) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardContent className="pt-6">
          <div className="text-center space-y-4">
            <div className="text-red-500">
              <Camera className="w-12 h-12 mx-auto mb-2" />
              <p className="text-sm">{error}</p>
            </div>
            <div className="flex space-x-2">
              <Button onClick={retryCamera} variant="outline" size="sm">
                <RotateCcw className="w-4 h-4 mr-2" />
                {t("retry") || "Retry"}
              </Button>
              <Button onClick={onClose} variant="outline" size="sm">
                <X className="w-4 h-4 mr-2" />
                {t("close") || "Close"}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="fixed inset-0 bg-black z-50 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 bg-black/80 text-white">
        <h1 className="text-lg font-medium">{t("scanMedication") || "Scan Medication"}</h1>
        <Button
          onClick={onClose}
          variant="ghost"
          size="sm"
          className="text-white hover:bg-white/20"
        >
          <X className="w-5 h-5" />
        </Button>
      </div>

      {/* Camera viewport */}
      <div className="flex-1 relative overflow-hidden">
        <video
          ref={videoRef}
          className="w-full h-full object-cover"
          playsInline
          muted
        />
        
        {/* Overlay guide */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="border-2 border-white/50 rounded-lg w-64 h-32 flex items-center justify-center">
            <p className="text-white text-sm text-center px-4">
              {t("alignDrugBox") || "Align medication label here"}
            </p>
          </div>
        </div>

        {/* Processing overlay */}
        {(isProcessing || isCapturing || processingStageLocal) && (
          <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center text-white">
            <Loader2 className="w-8 h-8 animate-spin mb-4" />
            <p className="text-center px-4">
              {processingStageLocal || processingStage || t("processing") || "Processing..."}
            </p>
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="bg-black/80 p-4 flex items-center justify-center space-x-6">
        <Button
          onClick={toggleCamera}
          variant="ghost"
          size="lg"
          className="text-white hover:bg-white/20"
          disabled={isCapturing || isProcessing}
        >
          <FlipHorizontal className="w-6 h-6" />
        </Button>

        <Button
          onClick={capturePhoto}
          size="lg"
          className="w-16 h-16 rounded-full bg-white hover:bg-gray-200"
          disabled={!isCameraReady || isCapturing || isProcessing}
        >
          {(isCapturing || isProcessing) ? (
            <Loader2 className="w-6 h-6 animate-spin text-black" />
          ) : (
            <Camera className="w-6 h-6 text-black" />
          )}
        </Button>

        <div className="w-6" /> {/* Spacer for symmetry */}
      </div>

      {/* Hidden canvas for capturing */}
      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
}
