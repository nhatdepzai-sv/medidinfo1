
import React, { useState, useRef, useCallback, useEffect, memo } from 'react';
import { Camera, SwitchCamera, Zap, ZapOff, Download, RefreshCw, Settings, X, Check, AlertCircle } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';
import { useLanguage } from '../contexts/language-context';
import { Badge } from './ui/badge';
import { Slider } from './ui/slider';
import { Switch } from './ui/switch';
import { Label } from './ui/label';

interface CameraInterfaceProps {
  onCapture: (imageData: string) => void;
  onClose: () => void;
  onMedicationFound: (medication: any) => void;
  setError: (error: string) => void;
  setProcessingStage: (stage: string) => void;
}

function CameraInterface({ onCapture, onClose, onMedicationFound, setError, setProcessingStage }: CameraInterfaceProps) {
  const { t } = useLanguage();
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [isActive, setIsActive] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);
  const [cameraError, setCameraError] = useState<string>('');
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('environment');
  const [hasFlash, setHasFlash] = useState(false);
  const [flashEnabled, setFlashEnabled] = useState(false);
  const [zoom, setZoom] = useState([1]);
  const [brightness, setBrightness] = useState([100]);
  const [contrast, setContrast] = useState([100]);
  const [showSettings, setShowSettings] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStage, setProcessingStageLocal] = useState('');
  const [ocrProgress, setOcrProgress] = useState(0);
  const [detectedText, setDetectedText] = useState<string>('');
  const [searchResult, setSearchResult] = useState<any>({});

  const getConstraints = useCallback(() => {
    const constraints: MediaStreamConstraints = {
      video: {
        facingMode: facingMode,
        width: { ideal: 1280, min: 640 },
        height: { ideal: 720, min: 480 },
        aspectRatio: { ideal: 16/9 },
      }
    };

    return constraints;
  }, [facingMode]);

  const startCamera = useCallback(async () => {
    try {
      setIsInitializing(true);
      setCameraError('');
      
      // Stop existing stream
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }

      // Check if camera is available
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Camera not supported by this browser');
      }

      const stream = await navigator.mediaDevices.getUserMedia(getConstraints());
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        
        // Wait for video to load
        await new Promise<void>((resolve, reject) => {
          if (!videoRef.current) {
            reject(new Error('Video element not available'));
            return;
          }
          
          videoRef.current.onloadedmetadata = () => resolve();
          videoRef.current.onerror = () => reject(new Error('Video load error'));
          
          // Timeout after 10 seconds
          setTimeout(() => reject(new Error('Camera timeout')), 10000);
        });

        await videoRef.current.play();
        setIsActive(true);

        // Check for flash capability
        const videoTrack = stream.getVideoTracks()[0];
        if (videoTrack) {
          const capabilities = videoTrack.getCapabilities();
          setHasFlash(!!capabilities.torch);
        }
      }
    } catch (error: any) {
      console.error('Camera error:', error);
      let errorMessage = 'Camera access failed';
      
      if (error.name === 'NotAllowedError') {
        errorMessage = 'Camera permission denied. Please allow camera access and refresh the page.';
      } else if (error.name === 'NotFoundError') {
        errorMessage = 'No camera found on this device.';
      } else if (error.name === 'NotReadableError') {
        errorMessage = 'Camera is being used by another application.';
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      setCameraError(errorMessage);
      setError(errorMessage);
    } finally {
      setIsInitializing(false);
    }
  }, [getConstraints, setError]);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setIsActive(false);
    setFlashEnabled(false);
  }, []);

  const switchCamera = useCallback(() => {
    setFacingMode(prev => prev === 'user' ? 'environment' : 'user');
  }, []);

  const toggleFlash = useCallback(async () => {
    if (streamRef.current && hasFlash) {
      const videoTrack = streamRef.current.getVideoTracks()[0];
      try {
        await videoTrack.applyConstraints({
          advanced: [{ torch: !flashEnabled } as any]
        });
        setFlashEnabled(!flashEnabled);
      } catch (error) {
        console.error('Flash toggle error:', error);
      }
    }
  }, [flashEnabled, hasFlash]);

  const capturePhoto = useCallback(() => {
    if (!videoRef.current || !canvasRef.current || !isActive) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      setError("Canvas not available");
      return;
    }

    // Set canvas size to higher resolution for better OCR
    canvas.width = video.videoWidth || 1920;
    canvas.height = video.videoHeight || 1080;

    // Draw video frame
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Enhanced image preprocessing for OCR
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;
    const brightnessValue = brightness[0] / 100;
    const contrastValue = contrast[0] / 100;

    // Apply brightness, contrast and sharpening
    for (let i = 0; i < data.length; i += 4) {
      // Convert to grayscale for better text recognition
      const gray = data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114;
      
      // Apply brightness and contrast
      let newValue = ((gray - 128) * contrastValue + 128) * brightnessValue;
      
      // Enhance contrast for text (make text more black/white)
      if (newValue > 128) {
        newValue = Math.min(255, newValue * 1.2);
      } else {
        newValue = Math.max(0, newValue * 0.8);
      }
      
      data[i] = newValue;     // R
      data[i + 1] = newValue; // G
      data[i + 2] = newValue; // B
      // Alpha channel stays the same
    }

    ctx.putImageData(imageData, 0, 0);

    // Use higher quality for OCR processing
    const imageData64 = canvas.toDataURL('image/png', 1.0);
    setCapturedImage(imageData64);
    onCapture(imageData64);
  }, [brightness, contrast, isActive, setError, onCapture]);

  const processImage = useCallback(async (imageSrc: string) => {
    setIsProcessing(true);
    setDetectedText('');
    setProcessingStageLocal('Initializing OCR...');

    try {
      // Dynamically import Tesseract
      const Tesseract = await import('tesseract.js');
      
      setProcessingStageLocal('Loading OCR engine...');
      
      // Initialize worker with multiple languages for better recognition
      const worker = await Tesseract.createWorker(['eng', 'vie'], 1, {
        logger: m => {
          if (m.status === 'recognizing text') {
            setProcessingStageLocal(`Recognizing text... ${Math.round(m.progress * 100)}%`);
            setOcrProgress(Math.round(m.progress * 100));
          }
        }
      });

      // Enhanced OCR parameters for better medication text recognition
      await worker.setParameters({
        tessedit_char_whitelist: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-.,()/ %',
        tessedit_pageseg_mode: 6, // Uniform block of text
        preserve_interword_spaces: '1',
        tessedit_ocr_engine_mode: 1, // Neural nets LSTM engine
        tessedit_do_invert: '0',
        classify_bln_numeric_mode: '0'
      });

      // First pass with standard recognition
      setProcessingStageLocal('Analyzing image...');
      const { data: { text: rawText, confidence } } = await worker.recognize(imageSrc);
      
      console.log(`OCR confidence: ${confidence}%, raw text: "${rawText}"`);
      
      // If confidence is low, try with different parameters
      if (confidence < 70) {
        setProcessingStageLocal('Enhancing recognition...');
        await worker.setParameters({
          tessedit_pageseg_mode: 8, // Single word
          tessedit_char_blacklist: '|\\~`@#$^&*+=[]{};"<>?'
        });
        
        const { data: { text: enhancedText } } = await worker.recognize(imageSrc);
        const finalText = enhancedText.length > rawText.length ? enhancedText : rawText;
        await worker.terminate();
        
        const cleanText = finalText.trim();
        setDetectedText(cleanText);
        await searchMedications(cleanText);
      } else {
        await worker.terminate();
        const cleanText = rawText.trim();
        setDetectedText(cleanText);
        await searchMedications(cleanText);
      }
    } catch (error) {
      console.error('OCR Error:', error);
      setSearchResult({
        success: false,
        message: 'Error processing image'
      });
      setProcessingStageLocal("Processing error");
    } finally {
      setIsProcessing(false);
      setOcrProgress(0);
    }
  }, [onMedicationFound, onClose]);

  const searchMedications = useCallback(async (text: string) => {
    if (text) {
      setProcessingStageLocal('Searching medications...');
      
      // Enhanced text preprocessing for better medication name extraction
      const preprocessedText = text
        .replace(/[^\w\s.-]/g, ' ') // Remove special characters except word chars, spaces, dots, hyphens
        .replace(/\s+/g, ' ') // Replace multiple spaces with single space
        .trim();

      // Extract potential medication names using multiple strategies
      const words = preprocessedText
        .split(/[\s\n\r,.-]+/)
        .filter(word => word.length > 2)
        .filter(word => /^[A-Za-z][A-Za-z0-9-]*$/.test(word));

      // Also try to extract complete phrases that might be medication names
      const phrases = preprocessedText
        .split(/[,.;:\n\r]+/)
        .map(phrase => phrase.trim())
        .filter(phrase => phrase.length > 3 && phrase.length < 50);

      // Combine words and phrases for searching
      const searchTerms = [...new Set([...words.slice(0, 8), ...phrases.slice(0, 3)])];

      console.log('Search terms extracted:', searchTerms);

      // Search for medications
      const searchPromises = searchTerms.map(async (term) => {
        try {
          const response = await fetch(`/api/search-medications?query=${encodeURIComponent(term)}`);
          return await response.json();
        } catch (error) {
          console.error(`Search error for term "${term}":`, error);
          return { success: false, medications: [] };
        }
      });

      const searchResults = await Promise.all(searchPromises);
      const allMedications = [];
      const medicationIds = new Set();

      for (const result of searchResults) {
        if (result.success && result.medications) {
          for (const med of result.medications) {
            if (!medicationIds.has(med.id)) {
              medicationIds.add(med.id);
              allMedications.push(med);
            }
          }
        }
      }

      if (allMedications.length > 0) {
        setSearchResult({
          success: true,
          medications: allMedications,
          message: `Found ${allMedications.length} medication(s)`
        });
        setProcessingStageLocal("Medication found!");
        
        setTimeout(() => {
          onMedicationFound(allMedications[0]);
          onClose();
        }, 1000);
      } else {
        setSearchResult({
          success: false,
          message: `No medication found for: "${text}"`
        });
        setProcessingStageLocal("No medication found");
      }
    } else {
      setSearchResult({
        success: false,
        message: 'No text detected in image'
      });
      setProcessingStageLocal("No text detected");
    }
  }, [onMedicationFound, onClose]);

  const confirmCapture = useCallback(() => {
    if (capturedImage) {
      processImage(capturedImage);
    }
  }, [capturedImage, processImage]);

  const retakePhoto = useCallback(() => {
    setCapturedImage(null);
    setDetectedText('');
    setSearchResult({});
  }, []);

  const downloadImage = useCallback(() => {
    if (capturedImage) {
      const link = document.createElement('a');
      link.download = `medication-scan-${Date.now()}.jpg`;
      link.href = capturedImage;
      link.click();
    }
  }, [capturedImage]);

  useEffect(() => {
    startCamera();
    return () => stopCamera();
  }, [startCamera, stopCamera]);

  useEffect(() => {
    if (isActive && facingMode) {
      startCamera();
    }
  }, [facingMode, isActive, startCamera]);

  const videoStyle = {
    transform: `scale(${zoom[0]})`,
    filter: `brightness(${brightness[0]}%) contrast(${contrast[0]}%)`,
    transition: 'transform 0.3s ease, filter 0.3s ease'
  };

  return (
    <div className="fixed inset-0 bg-black z-50 flex flex-col">
      {/* Header */}
      <div className="flex justify-between items-center p-4 bg-black/70 backdrop-blur-sm">
        <Button
          onClick={onClose}
          variant="ghost"
          size="icon"
          className="text-white hover:bg-white/20"
        >
          <X className="h-6 w-6" />
        </Button>

        <div className="flex items-center space-x-2">
          {isActive && (
            <Badge variant="secondary" className="bg-green-500/20 text-green-200">
              Camera Active
            </Badge>
          )}
          {flashEnabled && hasFlash && (
            <Badge variant="secondary" className="bg-yellow-500/20 text-yellow-200">
              Flash On
            </Badge>
          )}
        </div>

        <Button
          onClick={() => setShowSettings(!showSettings)}
          variant="ghost"
          size="icon"
          className="text-white hover:bg-white/20"
        >
          <Settings className="h-6 w-6" />
        </Button>
      </div>

      {/* Settings Panel */}
      {showSettings && (
        <Card className="absolute top-16 right-4 w-80 bg-black/90 backdrop-blur-md text-white border-gray-600 z-10">
          <CardContent className="p-4 space-y-4">
            <div className="space-y-2">
              <Label>Zoom: {zoom[0]}x</Label>
              <Slider
                value={zoom}
                onValueChange={setZoom}
                max={3}
                min={1}
                step={0.1}
                className="w-full"
              />
            </div>

            <div className="space-y-2">
              <Label>Brightness: {brightness[0]}%</Label>
              <Slider
                value={brightness}
                onValueChange={setBrightness}
                max={150}
                min={50}
                step={5}
                className="w-full"
              />
            </div>

            <div className="space-y-2">
              <Label>Contrast: {contrast[0]}%</Label>
              <Slider
                value={contrast}
                onValueChange={setContrast}
                max={150}
                min={50}
                step={5}
                className="w-full"
              />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Camera View */}
      <div className="flex-1 relative overflow-hidden">
        {isInitializing ? (
          <div className="w-full h-full flex flex-col items-center justify-center bg-gray-900">
            <div className="animate-spin w-12 h-12 border-4 border-white border-t-transparent rounded-full mb-4"></div>
            <p className="text-white text-lg">Initializing camera...</p>
          </div>
        ) : cameraError ? (
          <div className="w-full h-full flex flex-col items-center justify-center bg-red-900/20 text-white p-8">
            <AlertCircle className="w-16 h-16 mb-4 text-red-400" />
            <h2 className="text-xl font-semibold mb-2">Camera Error</h2>
            <p className="text-center mb-6">{cameraError}</p>
            <Button
              onClick={startCamera}
              className="bg-blue-600 hover:bg-blue-700"
            >
              Try Again
            </Button>
          </div>
        ) : isProcessing ? (
          <div className="w-full h-full flex flex-col items-center justify-center bg-black/90">
            <div className="text-center text-white p-8">
              <div className="animate-spin w-16 h-16 border-4 border-white border-t-transparent rounded-full mx-auto mb-6"></div>
              <h2 className="text-2xl font-semibold mb-2">Processing Image</h2>
              <p className="text-lg opacity-90 mb-4">{processingStage}</p>
              {ocrProgress > 0 && (
                <div className="w-64 bg-gray-700 rounded-full h-2 mx-auto">
                  <div 
                    className="bg-blue-500 h-2 rounded-full transition-all duration-300" 
                    style={{width: `${ocrProgress}%`}}
                  ></div>
                </div>
              )}
            </div>
          </div>
        ) : !capturedImage ? (
          <>
            <video
              ref={videoRef}
              className="w-full h-full object-cover"
              style={videoStyle}
              playsInline
              muted
              autoPlay
            />

            {/* Medication Capture Guide */}
            <div className="absolute inset-0 pointer-events-none">
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-48 border-2 border-yellow-400 bg-yellow-400/10 rounded-lg">
                <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-black/70 text-white text-sm px-3 py-1 rounded-full">
                  Align medication label here
                </div>
                {/* Corner markers */}
                <div className="absolute -top-2 -left-2 w-4 h-4 border-l-2 border-t-2 border-yellow-400"></div>
                <div className="absolute -top-2 -right-2 w-4 h-4 border-r-2 border-t-2 border-yellow-400"></div>
                <div className="absolute -bottom-2 -left-2 w-4 h-4 border-l-2 border-b-2 border-yellow-400"></div>
                <div className="absolute -bottom-2 -right-2 w-4 h-4 border-r-2 border-b-2 border-yellow-400"></div>
              </div>

              <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-black/70 text-white text-sm px-4 py-2 rounded-lg text-center">
                <div className="mb-1">📱 Ensure good lighting and focus</div>
                <div>🔍 Focus on drug name and dosage</div>
              </div>
            </div>
          </>
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-black">
            <img
              src={capturedImage}
              alt="Captured"
              className="max-w-full max-h-full object-contain"
            />
          </div>
        )}

        <canvas ref={canvasRef} className="hidden" />
      </div>

      {/* Bottom Controls */}
      <div className="p-6 bg-black/70 backdrop-blur-sm">
        {isProcessing ? (
          <div className="flex justify-center">
            <Button
              onClick={() => {
                setIsProcessing(false);
                setProcessingStageLocal('');
                setCapturedImage(null);
              }}
              variant="outline"
              size="lg"
              className="text-white border-white hover:bg-white/20"
            >
              Cancel
            </Button>
          </div>
        ) : !capturedImage ? (
          <div className="flex justify-center items-center space-x-8">
            {hasFlash && (
              <Button
                onClick={toggleFlash}
                variant="ghost"
                size="icon"
                className={`text-white hover:bg-white/20 ${flashEnabled ? 'bg-yellow-500/20' : ''}`}
              >
                {flashEnabled ? <Zap className="h-6 w-6" /> : <ZapOff className="h-6 w-6" />}
              </Button>
            )}

            <Button
              onClick={capturePhoto}
              disabled={!isActive || isProcessing}
              size="lg"
              className="w-20 h-20 rounded-full bg-white hover:bg-gray-200 text-black"
            >
              <Camera className="h-8 w-8" />
            </Button>

            <Button
              onClick={switchCamera}
              variant="ghost"
              size="icon"
              className="text-white hover:bg-white/20"
            >
              <SwitchCamera className="h-6 w-6" />
            </Button>
          </div>
        ) : (
          <div className="flex justify-center items-center space-x-4">
            <Button
              onClick={retakePhoto}
              variant="outline"
              size="lg"
              className="flex items-center space-x-2 text-white border-white hover:bg-white/20"
            >
              <RefreshCw className="h-5 w-5" />
              <span>Retake</span>
            </Button>

            <Button
              onClick={downloadImage}
              variant="outline"
              size="lg"
              className="flex items-center space-x-2 text-white border-white hover:bg-white/20"
            >
              <Download className="h-5 w-5" />
              <span>Download</span>
            </Button>

            <Button
              onClick={confirmCapture}
              size="lg"
              className="flex items-center space-x-2 bg-green-600 hover:bg-green-700"
            >
              <Check className="h-5 w-5" />
              <span>Analyze</span>
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

export default memo(CameraInterface);
