import React, { useState, useRef, useCallback, useEffect, memo } from 'react';
import { Camera, SwitchCamera, Zap, ZapOff, Download, RefreshCw, Settings, X, Check } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';
import { useLanguage } from '../contexts/language-context';
import { Badge } from './ui/badge';
import { Slider } from './ui/slider';
import { Switch } from './ui/switch';
import { Label } from './ui/label';
// Tesseract is now lazily loaded within processImage

interface CameraInterfaceProps {
  onCapture: (imageData: string) => void;
  onClose: () => void;
  onMedicationFound: (medication: any) => void; // Assuming medication is an object
  setError: (error: string) => void;
  setProcessingStage: (stage: string) => void;
}

// Helper function for Gaussian blur
function applyGaussianBlur(data: Uint8ClampedArray, width: number, height: number, sigma: number): Uint8ClampedArray {
  const kernelSize = Math.ceil(3 * sigma);
  const kernel = new Array(kernelSize * 2 + 1).fill(0);
  let sum = 0;
  for (let i = 0; i < kernel.length; i++) {
    const x = i - kernelSize;
    kernel[i] = Math.exp(-(x * x) / (2 * sigma * sigma));
    sum += kernel[i];
  }
  for (let i = 0; i < kernel.length; i++) {
    kernel[i] /= sum;
  }

  const blurredData = new Uint8ClampedArray(data.length);
  const kernelLen = kernel.length;
  const kernelRadius = Math.floor(kernelLen / 2);

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      let r = 0, g = 0, b = 0, a = 0;
      for (let ky = 0; ky < kernelLen; ky++) {
        const neighborY = y + ky - kernelRadius;
        if (neighborY >= 0 && neighborY < height) {
          const pixelIndex = (neighborY * width + x) * 4;
          const weight = kernel[ky];
          r += data[pixelIndex] * weight;
          g += data[pixelIndex + 1] * weight;
          b += data[pixelIndex + 2] * weight;
          a += data[pixelIndex + 3] * weight;
        }
      }
      const currentIndex = (y * width + x) * 4;
      blurredData[currentIndex] = r;
      blurredData[currentIndex + 1] = g;
      blurredData[currentIndex + 2] = b;
      blurredData[currentIndex + 3] = a;
    }
  }

  // Apply kernel horizontally in a second pass
  const finalBlurredData = new Uint8ClampedArray(data.length);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      let r = 0, g = 0, b = 0, a = 0;
      for (let kx = 0; kx < kernelLen; kx++) {
        const neighborX = x + kx - kernelRadius;
        if (neighborX >= 0 && neighborX < width) {
          const pixelIndex = (y * width + neighborX) * 4;
          const weight = kernel[kx];
          r += blurredData[pixelIndex] * weight;
          g += blurredData[pixelIndex + 1] * weight;
          b += blurredData[pixelIndex + 2] * weight;
          a += blurredData[pixelIndex + 3] * weight;
        }
      }
      const currentIndex = (y * width + x) * 4;
      finalBlurredData[currentIndex] = r;
      finalBlurredData[currentIndex + 1] = g;
      finalBlurredData[currentIndex + 2] = b;
      finalBlurredData[currentIndex + 3] = a;
    }
  }
  return finalBlurredData;
}

// Helper function for adaptive thresholding (Otsu's method simplified)
function applyAdaptiveThreshold(data: Uint8ClampedArray, width: number, height: number, blockSize: number, C: number): Uint8ClampedArray {
  const binaryData = new Uint8ClampedArray(data.length);
  const halfBlock = Math.floor(blockSize / 2);

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      let sum = 0;
      let count = 0;

      // Calculate mean of the block
      for (let ky = -halfBlock; ky <= halfBlock; ky++) {
        for (let kx = -halfBlock; kx <= halfBlock; kx++) {
          const neighborY = y + ky;
          const neighborX = x + kx;
          if (neighborY >= 0 && neighborY < height && neighborX >= 0 && neighborX < width) {
            const pixelIndex = (neighborY * width + neighborX) * 4;
            sum += data[pixelIndex];
            count++;
          }
        }
      }

      const mean = count > 0 ? sum / count : 0;
      const threshold = mean + C;

      const currentIndex = (y * width + x) * 4;
      const value = data[currentIndex] > threshold ? 255 : 0;

      binaryData[currentIndex] = value;
      binaryData[currentIndex + 1] = value;
      binaryData[currentIndex + 2] = value;
      binaryData[currentIndex + 3] = data[currentIndex + 3]; // Keep alpha channel
    }
  }
  return binaryData;
}

// Helper function for morphological operations (Dilation then Erosion for opening)
function applyMorphology(data: Uint8ClampedArray, width: number, height: number): Uint8ClampedArray {
  const dilatedData = new Uint8ClampedArray(data.length);
  const kernel = [[0, 1, 0], [1, 1, 1], [0, 1, 0]]; // Cross kernel
  const kernelRadius = 1;

  // Dilation
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      let maxVal = 0;
      for (let ky = -kernelRadius; ky <= kernelRadius; ky++) {
        for (let kx = -kernelRadius; kx <= kernelRadius; kx++) {
          if (kernel[ky + kernelRadius][kx + kernelRadius] === 1) {
            const neighborY = y + ky;
            const neighborX = x + kx;
            if (neighborY >= 0 && neighborY < height && neighborX >= 0 && neighborX < width) {
              const pixelIndex = (neighborY * width + neighborX) * 4;
              if (data[pixelIndex] > maxVal) {
                maxVal = data[pixelIndex];
              }
            }
          }
        }
      }
      const currentIndex = (y * width + x) * 4;
      dilatedData[currentIndex] = maxVal;
      dilatedData[currentIndex + 1] = maxVal;
      dilatedData[currentIndex + 2] = maxVal;
      dilatedData[currentIndex + 3] = data[currentIndex + 3];
    }
  }

  const cleanedData = new Uint8ClampedArray(data.length);
  // Erosion
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      let minVal = 255;
      for (let ky = -kernelRadius; ky <= kernelRadius; ky++) {
        for (let kx = -kernelRadius; kx <= kernelRadius; kx++) {
          if (kernel[ky + kernelRadius][kx + kernelRadius] === 1) {
            const neighborY = y + ky;
            const neighborX = x + kx;
            if (neighborY >= 0 && neighborY < height && neighborX >= 0 && neighborX < width) {
              const pixelIndex = (neighborY * width + neighborX) * 4;
              if (dilatedData[pixelIndex] < minVal) {
                minVal = dilatedData[pixelIndex];
              }
            }
          }
        }
      }
      const currentIndex = (y * width + x) * 4;
      cleanedData[currentIndex] = minVal;
      cleanedData[currentIndex + 1] = minVal;
      cleanedData[currentIndex + 2] = minVal;
      cleanedData[currentIndex + 3] = dilatedData[currentIndex + 3];
    }
  }
  return cleanedData;
}


function CameraInterface({ onCapture, onClose, onMedicationFound, setError, setProcessingStage }: CameraInterfaceProps) {
  const { t } = useLanguage();
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  // Tesseract worker is now managed within the processImage function due to lazy loading

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
  const [processingStage, setProcessingStageLocal] = useState('');
  const [autoFocus, setAutoFocus] = useState(true);
  const [resolution, setResolution] = useState<'HD' | 'FHD' | '4K'>('FHD');
  const [ocrProgress, setOcrProgress] = useState(0); // State for OCR progress

  // Dummy states for search functionality, assuming they are defined elsewhere or will be defined
  const [detectedText, setDetectedText] = useState<string>('');
  const [searchResult, setSearchResult] = useState<any>({}); // Replace 'any' with a more specific type if available

  // Tesseract worker initialization is removed from here and moved to processImage for lazy loading

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
    } else {
      (constraints.video as any).focusMode = 'manual'; // Or 'off'
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
      setError(t('cameraAccessError') || 'Camera access error. Please check permissions.');
    }
  }, [getConstraints, t, setError]);

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
        setError(t('flashError') || 'Could not toggle flash.');
      }
    }
  }, [flashEnabled, hasFlash, setError, t]);

  const applyImageFilters = useCallback((ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement) => {
    let imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;

    const brightnessValue = brightness[0] / 100;
    const contrastValue = contrast[0] / 100;

    // Enhanced image preprocessing for better OCR
    for (let i = 0; i < data.length; i += 4) {
      // Convert to grayscale with optimized weights for text
      const gray = Math.round(0.3 * data[i] + 0.59 * data[i + 1] + 0.11 * data[i + 2]);

      // Apply brightness
      let processedValue = Math.min(255, Math.max(0, gray * brightnessValue));

      // Apply adaptive contrast enhancement
      processedValue = Math.min(255, Math.max(0, ((processedValue - 128) * contrastValue) + 128));

      // Apply adaptive threshold for text enhancement
      const threshold = 128;
      if (Math.abs(processedValue - threshold) < 30) {
        // Enhance text edges
        processedValue = processedValue > threshold ? Math.min(255, processedValue + 50) : Math.max(0, processedValue - 50);
      }

      // Apply processed value to all RGB channels (grayscale)
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

    if (!ctx) {
      setError(t("canvasError") || "Canvas context not available.");
      setIsProcessing(false);
      return;
    }

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

    // Advanced text enhancement for better OCR
    let imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;
    const width = canvas.width;
    const height = canvas.height;

    // Create a copy for edge detection
    const originalData = new Uint8ClampedArray(data);

    // Apply Sobel edge detection to enhance text boundaries
    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        const idx = (y * width + x) * 4;

        // Get surrounding pixels for edge detection
        const topLeft = originalData[((y-1) * width + (x-1)) * 4];
        const top = originalData[((y-1) * width + x) * 4];
        const topRight = originalData[((y-1) * width + (x+1)) * 4];
        const left = originalData[(y * width + (x-1)) * 4];
        const center = originalData[idx];
        const right = originalData[(y * width + (x+1)) * 4];
        const bottomLeft = originalData[((y+1) * width + (x-1)) * 4];
        const bottom = originalData[((y+1) * width + x) * 4];
        const bottomRight = originalData[((y+1) * width + (x+1)) * 4];

        // Sobel X and Y gradients
        const sobelX = (topRight + 2*right + bottomRight) - (topLeft + 2*left + bottomLeft);
        const sobelY = (bottomLeft + 2*bottom + bottomRight) - (topLeft + 2*top + topRight);
        const magnitude = Math.sqrt(sobelX*sobelX + sobelY*sobelY);

        // Enhance edges (likely text boundaries)
        let enhanced = center;
        if (magnitude > 30) {
          enhanced = center > 128 ? Math.min(255, center + magnitude/4) : Math.max(0, center - magnitude/4);
        }

        // Apply binary threshold for cleaner text
        enhanced = enhanced > 140 ? 255 : enhanced < 115 ? 0 : enhanced;

        data[idx] = data[idx + 1] = data[idx + 2] = enhanced;
      }
    }

    ctx.putImageData(imageData, 0, 0);

    // Convert to high-quality image with better compression for OCR
    const imageData64 = canvas.toDataURL('image/png');
    setCapturedImage(imageData64);
    setIsProcessing(false);
  }, [zoom, applyImageFilters, setError, t]);

  // Lazy-loaded Tesseract processing
  const processImage = useCallback(async (imageSrc: string) => {
    setIsProcessing(true);
    setDetectedText('');

    try {
      // Enhanced OCR Processing with better configuration
      // Dynamically import Tesseract
      const Tesseract = await import('tesseract.js');
      const worker = await Tesseract.createWorker('eng', 1, {
        logger: m => {
          if (m.status === 'loaded') {
            setProcessingStageLocal(t('ocrReady') || 'OCR Engine Ready');
          } else if (m.status === 'initialized') {
            setProcessingStageLocal(t('ocrInitializing') || 'OCR Engine Initializing...');
          } else if (m.status === 'recognizing text') {
            setProcessingStageLocal(t('recognizingText') || `Recognizing text... ${Math.round(m.progress * 100)}%`);
            setOcrProgress(Math.round(m.progress * 100));
          }
        }
      });

      // Configure OCR for better text detection
      await worker.setParameters({
        tessedit_char_whitelist: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-.,() ',
        tessedit_pageseg_mode: 6, // Uniform block of text
        preserve_interword_spaces: '1'
      });

      const { data: { text, words } } = await worker.recognize(imageSrc);
      await worker.terminate();

      const cleanText = text.trim();
      setDetectedText(cleanText);

      if (cleanText) {
        // Extract individual words and filter meaningful ones
        const detectedWords = words
          ?.filter(word => word.confidence > 60 && word.text.length > 2)
          .map(word => word.text.trim())
          .filter(word => /^[A-Za-z][A-Za-z0-9-]*$/.test(word)) || [];

        // Get all unique words from the text
        const textWords = cleanText
          .split(/[\s\n\r,.-]+/)
          .filter(word => word.length > 2 && /^[A-Za-z][A-Za-z0-9-]*$/.test(word))
          .map(word => word.trim());

        // Combine and deduplicate words
        const allWords = [...new Set([...detectedWords, ...textWords])];

        console.log('Detected words:', allWords);

        // Search for each word and combine results
        const searchPromises = allWords.map(async (word) => {
          try {
            const response = await fetch(`/api/search-medications?query=${encodeURIComponent(word)}`);
            return await response.json();
          } catch (error) {
            console.error(`Search error for word "${word}":`, error);
            return { success: false, medications: [] };
          }
        });

        // Also search for the full text
        searchPromises.push(
          fetch(`/api/search-medications?query=${encodeURIComponent(cleanText)}`)
            .then(res => res.json())
            .catch(() => ({ success: false, medications: [] }))
        );

        const searchResults = await Promise.all(searchPromises);

        // Combine all unique medications found
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
            message: `Found ${allMedications.length} medication(s) from detected text: "${cleanText}"`
          });
          setProcessingStageLocal(t("medicationFound") || "Medication found!");
          // Small delay to show success message before closing
          setTimeout(() => {
            onMedicationFound(allMedications[0]); // Pass the first found medication
            onClose(); // Close camera interface and return to home
          }, 1000);
        } else {
          setDetectedText(t('noMedicationFound') || 'No medication found for');
          setSearchResult({
            success: false,
            message: `${t('noMedicationFound') || 'No medication found'} for: "${cleanText}". ${t('tryBetterPhoto') || 'Try taking a clearer photo with better lighting.'}`
          });
          setProcessingStageLocal(t("noMedicationFound") || "No Medication Found");
        }
      } else {
        setDetectedText(t('noTextDetected') || 'No text detected');
        setSearchResult({
          success: false,
          message: t('noTextDetected') || 'No text could be detected in the image. Please ensure good lighting and focus.'
        });
        setProcessingStageLocal(t("noTextDetected") || "No Text Detected");
      }
    } catch (error) {
      console.error('OCR Error:', error);
      setDetectedText(t('ocrError') || 'Error processing image');
      setSearchResult({
        success: false,
        message: t('ocrError') || 'Error processing image. Please try again.'
      });
      setProcessingStageLocal(t("ocrError") || "OCR Error");
    } finally {
      setIsProcessing(false);
      setOcrProgress(0); // Reset progress
    }
  }, [t, onMedicationFound, setError, setProcessingStage, onClose]);


  const confirmCapture = useCallback(() => {
    if (capturedImage) {
      setCapturedImage(null); // Clear captured image to show processing overlay
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
        {isProcessing ? (
          /* Processing Overlay */
          <div className="w-full h-full flex flex-col items-center justify-center bg-black/90">
            <div className="text-center text-white p-8">
              <div className="animate-spin w-16 h-16 border-4 border-white border-t-transparent rounded-full mx-auto mb-6"></div>
              <h2 className="text-2xl font-semibold mb-2">{t("processingImage") || "Processing Image"}</h2>
              <p className="text-lg opacity-90 mb-4">{processingStage}</p>
              <div className="w-64 bg-gray-700 rounded-full h-2 mx-auto">
                <div className="bg-primary h-2 rounded-full animate-pulse" style={{width: `${ocrProgress}%`}}></div>
              </div>
              <p className="text-sm opacity-75 mt-4">{t("pleaseWait") || "Please wait while we analyze your image..."}</p>
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
        {isProcessing ? (
          /* Processing Controls - Show cancel option */
          <div className="flex justify-center">
            <Button
              onClick={() => {
                setIsProcessing(false);
                setProcessingStageLocal('');
                onClose();
              }}
              variant="outline"
              size="lg"
              className="text-white border-white hover:bg-white/20"
            >
              {t("cancel") || "Cancel"}
            </Button>
          </div>
        ) : !capturedImage ? (
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

export default memo(CameraInterface);