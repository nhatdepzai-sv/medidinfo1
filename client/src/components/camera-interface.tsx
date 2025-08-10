import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Camera, SwitchCamera, Zap, ZapOff, Download, RefreshCw, Settings, X, Check } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';
import { useLanguage } from '../contexts/language-context';
import { Badge } from './ui/badge';
import { Slider } from './ui/slider';
import { Switch } from './ui/switch';
import { Label } from './ui/label';
import * as Tesseract from 'tesseract.js';

interface CameraInterfaceProps {
  onCapture: (imageData: string) => void;
  onClose: () => void;
  onMedicationFound: (medication: any) => void; // Assuming medication is an object
  setError: (error: string) => void;
  setProcessingStage: (stage: string) => void;
}

export default function CameraInterface({ onCapture, onClose, onMedicationFound, setError, setProcessingStage }: CameraInterfaceProps) {
  const { t } = useLanguage();
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const workerRef = useRef<Tesseract.Worker | null>(null);

  const [isActive, setIsActive] = useState(false);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('environment');
  const [hasFlash, setHasFlash] = useState(false);
  const [flashEnabled, setFlashEnabled] = useState(false);
  const [zoom, setZoom] = useState([1]);
  const [brightness, setBrightness] = useState([100]);
  const [contrast, setContrast] = useState([100]);
  const [showSettings, setShowSettings] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [autoFocus, setAutoFocus] = useState(true);
  const [resolution, setResolution] = useState<'HD' | 'FHD' | '4K'>('FHD');

  // Initialize Tesseract worker
  useEffect(() => {
    const initializeWorker = async () => {
      try {
        workerRef.current = await Tesseract.createWorker('eng');
        await workerRef.current.load();
        await workerRef.current.loadLanguage('eng');
        await workerRef.current.initialize('eng');
      } catch (err) {
        console.error("Failed to initialize Tesseract worker:", err);
        setError(t("tesseractInitializationError") || "Error initializing OCR engine.");
      }
    };
    initializeWorker();

    return () => {
      if (workerRef.current) {
        workerRef.current.terminate();
      }
    };
  }, [setError, t]);

  const getConstraints = useCallback(() => {
    const constraints: MediaStreamConstraints = {
      video: {
        facingMode: facingMode,
        width: { ideal: resolution === '4K' ? 3840 : resolution === 'FHD' ? 1920 : 1280 },
        height: { ideal: resolution === '4K' ? 2160 : resolution === 'FHD' ? 1080 : 720 },
        aspectRatio: { ideal: 16/9 },
      }
    };

    if (autoFocus) {
      (constraints.video as any).focusMode = 'continuous';
    }

    return constraints;
  }, [facingMode, resolution, autoFocus]);

  const startCamera = useCallback(async () => {
    try {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }

      const stream = await navigator.mediaDevices.getUserMedia(getConstraints());
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        setIsActive(true);

        // Check for flash capability
        const videoTrack = stream.getVideoTracks()[0];
        const capabilities = videoTrack.getCapabilities();
        setHasFlash(!!capabilities.torch);
      }
    } catch (error) {
      console.error('Error accessing camera:', error);
      alert(t('cameraAccessError') || 'Camera access error. Please check permissions.');
    }
  }, [getConstraints, t]);

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

  const applyImageFilters = useCallback((ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement) => {
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;

    const brightnessValue = brightness[0] / 100;
    const contrastValue = contrast[0] / 100;

    // Enhanced image preprocessing for better OCR
    for (let i = 0; i < data.length; i += 4) {
      // Convert to grayscale first for better text recognition
      const gray = Math.round(0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2]);

      // Apply brightness
      let processedValue = Math.min(255, gray * brightnessValue);

      // Apply contrast with enhanced text enhancement
      processedValue = Math.min(255, Math.max(0, ((processedValue - 128) * contrastValue) + 128));

      // Sharpen text by increasing contrast for text-like regions
      if (contrastValue > 1.2) {
        processedValue = processedValue > 128 ? Math.min(255, processedValue * 1.1) : Math.max(0, processedValue * 0.9);
      }

      // Apply processed value to all RGB channels
      data[i] = processedValue;     // Red
      data[i + 1] = processedValue; // Green  
      data[i + 2] = processedValue; // Blue
    }

    ctx.putImageData(imageData, 0, 0);
  }, [brightness, contrast]);

  const capturePhoto = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) return;

    setIsProcessing(true);
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    if (!ctx) return;

    // Set canvas dimensions for optimal OCR (higher resolution)
    const optimalWidth = Math.min(video.videoWidth, 1920);
    const optimalHeight = Math.min(video.videoHeight, 1080);
    canvas.width = optimalWidth;
    canvas.height = optimalHeight;

    // Apply zoom with better quality
    const zoomLevel = zoom[0];
    const scaledWidth = canvas.width / zoomLevel;
    const scaledHeight = canvas.height / zoomLevel;
    const offsetX = (canvas.width - scaledWidth) / 2;
    const offsetY = (canvas.height - scaledHeight) / 2;

    // Enable smoothing for better quality
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';

    // Draw video frame with zoom
    ctx.drawImage(video, offsetX, offsetY, scaledWidth, scaledHeight, 0, 0, canvas.width, canvas.height);

    // Apply enhanced image filters for OCR
    applyImageFilters(ctx, canvas);

    // Additional text enhancement
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;

    // Edge enhancement for text clarity
    for (let i = 0; i < data.length; i += 4) {
      const current = data[i];
      if (current > 200 || current < 55) {
        // Enhance high contrast areas (likely text)
        data[i] = data[i + 1] = data[i + 2] = current > 128 ? 255 : 0;
      }
    }

    ctx.putImageData(imageData, 0, 0);

    // Convert to high-quality image with better compression for OCR
    const imageData64 = canvas.toDataURL('image/png');
    setCapturedImage(imageData64);
    setIsProcessing(false);
  }, [zoom, applyImageFilters]);

  const processImage = useCallback(async (imageSrc: string) => {
    if (!workerRef.current) {
      setError(t("ocrNotReady") || "OCR engine is not ready yet.");
      return;
    }

    try {
      setIsProcessing(true);
      setProcessingStage(t("analyzingImage"));

      // Create image element
      const img = new Image();
      img.crossOrigin = "anonymous";

      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
        img.src = imageSrc;
      });

      // Create canvas and preprocess image
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Canvas context not available');

      // Scale image for better OCR results
      const scale = Math.min(1920 / img.width, 1080 / img.height);
      canvas.width = img.width * scale;
      canvas.height = img.height * scale;

      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

      // Apply advanced image preprocessing for better OCR
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;

      // Convert to grayscale with better weights
      for (let i = 0; i < data.length; i += 4) {
        const gray = Math.round(0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2]);

        // Apply adaptive thresholding for better text extraction
        const threshold = 128;
        const enhanced = gray > threshold ? 255 : 0;

        data[i] = enhanced;
        data[i + 1] = enhanced;
        data[i + 2] = enhanced;
      }

      ctx.putImageData(imageData, 0, 0);

      setProcessingStage(t("extractingText"));

      // Perform OCR with multiple configurations for better results
      const ocrConfigs = [
        {
          language: 'eng',
          tessedit_char_whitelist: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789 .,-()/',
          tessedit_pageseg_mode: 6, // Single uniform block
        },
        {
          language: 'eng',
          tessedit_char_whitelist: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789 .,-()/',
          tessedit_pageseg_mode: 8, // Single word
        },
        {
          language: 'eng',
          tessedit_char_whitelist: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789 .,-()/',
          tessedit_pageseg_mode: 7, // Single text line
        }
      ];

      let bestResult = '';
      let bestConfidence = 0;

      for (const config of ocrConfigs) {
        try {
          const result = await workerRef.current.recognize(canvas, config);
          const confidence = result.data.confidence;

          if (confidence > bestConfidence && result.data.text.trim().length > 0) {
            bestResult = result.data.text.trim();
            bestConfidence = confidence;
          }
        } catch (err) {
          console.warn('OCR config failed:', err);
        }
      }

      console.log('Best OCR Result:', bestResult, 'Confidence:', bestConfidence);

      if (!bestResult || bestResult.length < 2) {
        throw new Error('No readable text detected in image. Please ensure the medication name is clearly visible.');
      }

      setProcessingStage(t("searchingDatabase"));

      // Clean and process the extracted text
      const cleanedText = bestResult
        .replace(/[^\w\s.-]/g, ' ') // Remove special chars except dots and hyphens
        .replace(/\s+/g, ' ') // Normalize whitespace
        .trim();

      // Extract potential drug names (words longer than 2 characters)
      const words = cleanedText.split(' ').filter(word => word.length > 2);
      const searchQueries = [cleanedText, ...words];

      // Search for medication with multiple queries
      const response = await fetch('/api/identify-medication', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: cleanedText,
          alternativeQueries: searchQueries,
          searchMethod: 'photo',
          confidence: bestConfidence
        })
      });

      if (!response.ok) {
        throw new Error('Failed to identify medication');
      }

      const responseData = await response.json();

      if (responseData.medication) {
        onMedicationFound(responseData.medication);
      } else {
        setError(t("noMedicationFound") + ` Detected text: "${cleanedText}"`);
      }

    } catch (err) {
      console.error('Error processing image:', err);
      setError(err instanceof Error ? err.message : t("failedToProcessImage"));
    } finally {
      setIsProcessing(false);
    }
  }, [t, onMedicationFound, setError, setProcessingStage]);

  const confirmCapture = useCallback(() => {
    if (capturedImage) {
      processImage(capturedImage);
    }
  }, [capturedImage, processImage]);

  const retakePhoto = useCallback(() => {
    setCapturedImage(null);
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
    if (isActive) {
      startCamera();
    }
  }, [facingMode, resolution, isActive, startCamera]);

  const videoStyle = {
    transform: `scale(${zoom[0]})`,
    filter: `brightness(${brightness[0]}%) contrast(${contrast[0]}%)`,
    transition: 'transform 0.3s ease, filter 0.3s ease'
  };

  return (
    <div className="fixed inset-0 bg-black z-50 flex flex-col">
      {/* Header */}
      <div className="flex justify-between items-center p-4 bg-black/50 backdrop-blur-sm">
        <Button
          onClick={onClose}
          variant="ghost"
          size="icon"
          className="text-white hover:bg-white/20"
        >
          <X className="h-6 w-6" />
        </Button>

        <div className="flex items-center space-x-2">
          <Badge variant="secondary" className="bg-white/20 text-white">
            {resolution}
          </Badge>
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
        <Card className="absolute top-16 right-4 w-80 bg-black/80 backdrop-blur-md text-white border-gray-600 z-10">
          <CardContent className="p-4 space-y-4">
            <div className="flex items-center justify-between">
              <Label>Resolution</Label>
              <select
                value={resolution}
                onChange={(e) => setResolution(e.target.value as 'HD' | 'FHD' | '4K')}
                className="bg-gray-700 border border-gray-600 rounded px-2 py-1"
              >
                <option value="HD">HD (720p)</option>
                <option value="FHD">FHD (1080p)</option>
                <option value="4K">4K (2160p)</option>
              </select>
            </div>

            <div className="flex items-center justify-between">
              <Label>Auto Focus</Label>
              <Switch checked={autoFocus} onCheckedChange={setAutoFocus} />
            </div>

            <div className="space-y-2">
              <Label>Zoom: {zoom[0]}x</Label>
              <Slider
                value={zoom}
                onValueChange={setZoom}
                max={5}
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
                max={200}
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
                max={200}
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
        {!capturedImage ? (
          <>
            <video
              ref={videoRef}
              className="w-full h-full object-cover"
              style={videoStyle}
              playsInline
              muted
            />

            {/* Medication Capture Guide */}
            <div className="absolute inset-0 pointer-events-none">
              {/* Center focus area for medication */}
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-48 border-2 border-yellow-400 bg-yellow-400/10 rounded-lg">
                <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-black/70 text-white text-xs px-3 py-1 rounded-full">
                  {t('alignDrugBox') || 'Align medication label here'}
                </div>
                {/* Corner markers */}
                <div className="absolute -top-2 -left-2 w-4 h-4 border-l-2 border-t-2 border-yellow-400"></div>
                <div className="absolute -top-2 -right-2 w-4 h-4 border-r-2 border-t-2 border-yellow-400"></div>
                <div className="absolute -bottom-2 -left-2 w-4 h-4 border-l-2 border-b-2 border-yellow-400"></div>
                <div className="absolute -bottom-2 -right-2 w-4 h-4 border-r-2 border-b-2 border-yellow-400"></div>
              </div>

              {/* Instructions */}
              <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-black/70 text-white text-xs px-4 py-2 rounded-lg text-center">
                <div className="mb-1">📱 {t('ensureGoodLighting') || 'Ensure good lighting and focus'}</div>
                <div>🔍 Focus on drug name and dosage information</div>
              </div>
            </div>
          </>
        ) : (
          <div className="w-full h-full flex items-center justify-center">
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
      <div className="p-6 bg-black/50 backdrop-blur-sm">
        {!capturedImage ? (
          <div className="flex justify-center items-center space-x-8">
            {/* Flash Toggle */}
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

            {/* Capture Button */}
            <Button
              onClick={capturePhoto}
              disabled={!isActive || isProcessing}
              size="lg"
              className="w-20 h-20 rounded-full bg-white hover:bg-gray-200 text-black"
            >
              {isProcessing ? (
                <RefreshCw className="h-8 w-8 animate-spin" />
              ) : (
                <Camera className="h-8 w-8" />
              )}
            </Button>

            {/* Switch Camera */}
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
              className="flex items-center space-x-2"
            >
              <RefreshCw className="h-5 w-5" />
              <span>{t('retakePhoto') || 'Retake'}</span>
            </Button>

            <Button
              onClick={downloadImage}
              variant="outline"
              size="lg"
              className="flex items-center space-x-2"
            >
              <Download className="h-5 w-5" />
              <span>{t('downloadImage') || 'Download'}</span>
            </Button>

            <Button
              onClick={confirmCapture}
              size="lg"
              className="flex items-center space-x-2 bg-green-600 hover:bg-green-700"
            >
              <Check className="h-5 w-5" />
              <span>{t('confirmCapture') || 'Confirm'}</span>
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}