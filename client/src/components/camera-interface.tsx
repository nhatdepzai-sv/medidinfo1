import React, { useState, useRef, useCallback, useEffect, memo } from 'react';
import { Camera, SwitchCamera, Zap, ZapOff, Download, RefreshCw, Settings, X, Check, AlertCircle, Scan, Pill } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';
import { useLanguage } from '../contexts/language-context';
import { Badge } from './ui/badge';
import { Slider } from './ui/slider';
import { Switch } from './ui/switch';
import { Label } from './ui/label';
import { useToast } from '../hooks/use-toast';
import Tesseract from 'tesseract.js';

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
  const [brightness, setBrightness] = useState([100]); // Changed default to 100
  const [contrast, setContrast] = useState([100]); // Changed default to 100
  const [showSettings, setShowSettings] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStage, setProcessingStageLocal] = useState('');
  const [ocrProgress, setOcrProgress] = useState(0);
  const [detectedText, setDetectedText] = useState<string>('');
  const [searchResult, setSearchResult] = useState<any>({});
  const [autoFocus, setAutoFocus] = useState(true);
  const { toast } = useToast(); // Initialize useToast

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
      setIsActive(false);

      // Stop existing stream
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }

      // Check if camera is available
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Camera not supported by this browser');
      }

      console.log('Requesting camera with constraints:', getConstraints());
      const stream = await navigator.mediaDevices.getUserMedia(getConstraints());
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;

        // Set video properties for better display
        videoRef.current.setAttribute('playsinline', 'true');
        videoRef.current.setAttribute('autoplay', 'true');
        videoRef.current.setAttribute('muted', 'true');

        // Wait for video to load with better error handling
        await new Promise<void>((resolve, reject) => {
          if (!videoRef.current) {
            reject(new Error('Video element not available'));
            return;
          }

          const handleLoadedMetadata = () => {
            console.log('Video metadata loaded, dimensions:', videoRef.current?.videoWidth, 'x', videoRef.current?.videoHeight);
            setIsActive(true);
            resolve();
          };

          const handleCanPlay = () => {
            console.log('Video can play');
            if (!isActive) {
              setIsActive(true);
            }
          };

          const handleError = (e: Event) => {
            console.error('Video load error:', e);
            reject(new Error('Video load error'));
          };

          videoRef.current.addEventListener('loadedmetadata', handleLoadedMetadata, { once: true });
          videoRef.current.addEventListener('canplay', handleCanPlay, { once: true });
          videoRef.current.addEventListener('error', handleError, { once: true });

          // Start playing immediately
          videoRef.current.play().catch((playError) => {
            console.error('Play error:', playError);
            reject(playError);
          });

          // Timeout after 10 seconds
          setTimeout(() => {
            if (videoRef.current) {
              videoRef.current.removeEventListener('loadedmetadata', handleLoadedMetadata);
              videoRef.current.removeEventListener('canplay', handleCanPlay);
              videoRef.current.removeEventListener('error', handleError);
            }
            if (!isActive) {
              reject(new Error('Camera initialization timeout'));
            }
          }, 10000);
        });

        console.log('Camera is now active');

        // Check for flash capability
        const videoTrack = stream.getVideoTracks()[0];
        if (videoTrack) {
          const capabilities = videoTrack.getCapabilities();
          setHasFlash(!!capabilities.torch);
          console.log('Camera capabilities:', capabilities);
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
      } else if (error.name === 'OverconstrainedError') {
        errorMessage = 'Camera constraints not supported. Trying with basic settings...';
        // Try with basic constraints
        try {
          const basicStream = await navigator.mediaDevices.getUserMedia({ video: true });
          streamRef.current = basicStream;
          if (videoRef.current) {
            videoRef.current.srcObject = basicStream;
            videoRef.current.setAttribute('playsinline', 'true');
            videoRef.current.setAttribute('autoplay', 'true');
            videoRef.current.setAttribute('muted', 'true');
            await videoRef.current.play();
            setIsActive(true);
            console.log('Basic camera access successful');
            return;
          }
        } catch (basicError) {
          console.error('Basic camera access also failed:', basicError);
          errorMessage = 'Camera access failed with basic settings';
        }
      } else if (error.message) {
        errorMessage = error.message;
      }

      setCameraError(errorMessage);
      setError(errorMessage);
    } finally {
      setIsInitializing(false);
    }
  }, [getConstraints, setError, isActive]);

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
        toast({
          title: t.error,
          description: t.unableToControlFlash,
          variant: "destructive",
        });
      }
    }
  }, [flashEnabled, hasFlash, toast, t]);

  const capturePhoto = useCallback(() => {
    if (!videoRef.current || !canvasRef.current || !isActive) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      setError("Canvas not available");
      toast({
        title: t.error,
        description: "Canvas not available",
        variant: "destructive",
      });
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
    // Adjust brightness and contrast values from state, ensuring they are numbers
    const brightnessValue = (Number(brightness[0]) - 100) / 100; // Scale 0-200 to -1 to 1
    const contrastValue = Number(contrast[0]) / 100; // Scale 0-200 to 0-2

    // Apply brightness, contrast and sharpening
    for (let i = 0; i < data.length; i += 4) {
      // Convert to grayscale for better text recognition
      const gray = data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114;

      // Apply brightness and contrast
      // Formula for contrast: C = ((G - 128) * contrastValue) + 128
      // Formula for brightness: B = C * brightnessValue
      let newValue = gray;
      newValue = ((newValue - 128) * contrastValue) + 128; // Apply contrast
      newValue = newValue + (newValue * brightnessValue); // Apply brightness

      // Clamp values to 0-255
      newValue = Math.max(0, Math.min(255, newValue));

      // Enhance contrast for text (make text more black/white) - experimental
      if (newValue > 128) {
        newValue = Math.min(255, newValue * 1.1); // Slightly increase lighter areas
      } else {
        newValue = Math.max(0, newValue * 0.9); // Slightly decrease darker areas
      }
      newValue = Math.max(0, Math.min(255, newValue)); // Re-clamp after enhancement


      data[i] = newValue;     // R
      data[i + 1] = newValue; // G
      data[i + 2] = newValue; // B
      // Alpha channel stays the same
    }

    ctx.putImageData(imageData, 0, 0);

    // Use higher quality for OCR processing
    const imageData64 = canvas.toDataURL('image/png', 1.0); // Use PNG for better quality
    setCapturedImage(imageData64);
    onCapture(imageData64); // Pass the captured image data
  }, [brightness, contrast, isActive, setError, onCapture, toast, t]);


  const processOCR = useCallback(async () => {
    if (!capturedImage) {
      toast({
        title: t.error,
        description: t.noImageProvided,
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);
    setProcessingStageLocal('Initializing OCR...');
    setOcrProgress(0);
    setDetectedText('');
    setSearchResult({});

    try {
      // Dynamically import Tesseract
      const Tesseract = await import('tesseract.js');

      setProcessingStageLocal('Loading OCR engine...');

      // Initialize worker with multiple languages for better recognition
      const worker = await Tesseract.createWorker(['eng', 'vie'], 1, { // Added 'vie' as per original intention
        logger: m => {
          if (m.status === 'recognizing text') {
            setProcessingStageLocal(`Recognizing text... ${Math.round(m.progress * 100)}%`);
            setOcrProgress(Math.round(m.progress * 100));
          } else {
            setProcessingStageLocal(m.status);
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
      const { data: { text: rawText, confidence } } = await worker.recognize(capturedImage);

      console.log(`OCR confidence: ${confidence}%, raw text: "${rawText}"`);

      let finalCleanText = rawText.trim();

      // If confidence is low, try with different parameters or additional processing
      if (confidence < 70) {
        setProcessingStageLocal('Enhancing recognition...');
        await worker.setParameters({
          tessedit_pageseg_mode: 8, // Single word
          tessedit_char_blacklist: '|\\~`@#$^&*+=[]{};"<>?'
        });

        const { data: { text: enhancedText } } = await worker.recognize(capturedImage);
        const cleanedEnhancedText = enhancedText.trim();

        // Prioritize the text with more characters or higher confidence if available
        if (cleanedEnhancedText.length > finalCleanText.length || (cleanedEnhancedText.length === finalCleanText.length && Tesseract.CustomRecognizeOptions.confidence > confidence)) {
            finalCleanText = cleanedEnhancedText;
        }
      }
      await worker.terminate();

      setDetectedText(finalCleanText);
      await searchMedications(finalCleanText);

    } catch (error) {
      console.error('OCR Error:', error);
      setSearchResult({
        success: false,
        message: 'Error processing image'
      });
      setProcessingStageLocal("Processing error");
      toast({
        title: t.error,
        description: t.failedToProcessImage,
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
      setOcrProgress(0);
    }
  }, [capturedImage, onMedicationFound, toast, t]);

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
        .filter(word => /^[A-Za-z][A-Za-z0-9-]*$/.test(word)); // Basic regex for medication names

      // Also try to extract complete phrases that might be medication names
      const phrases = preprocessedText
        .split(/[,.;:\n\r]+/)
        .map(phrase => phrase.trim())
        .filter(phrase => phrase.length > 3 && phrase.length < 50); // Limit phrase length

      // Combine words and phrases for searching, taking the first few potential matches
      const searchTerms = [...new Set([...words.slice(0, 8), ...phrases.slice(0, 3)])];

      console.log('Search terms extracted:', searchTerms);

      if (searchTerms.length === 0) {
        setSearchResult({
          success: false,
          message: `No relevant text found for precise search.`
        });
        setProcessingStageLocal("No relevant text found");
        toast({
          title: t.warning,
          description: t.noRelevantTextFound,
        });
        return;
      }

      // Search for medications
      const searchPromises = searchTerms.map(async (term) => {
        try {
          const response = await fetch(`/api/search-medications?query=${encodeURIComponent(term)}`);
          if (!response.ok) {
            throw new Error(`API request failed with status ${response.status}`);
          }
          return await response.json();
        } catch (error) {
          console.error(`Search error for term "${term}":`, error);
          return { success: false, medications: [] }; // Return a consistent structure on error
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

        // Automatically select the first found medication and close
        setTimeout(() => {
          onMedicationFound(allMedications[0]);
          onClose();
        }, 1500); // Slightly longer delay to show the "Medication found!" message
      } else {
        setSearchResult({
          success: false,
          message: `No medication found for: "${text}"`
        });
        setProcessingStageLocal("No medication found");
        toast({
          title: t.info,
          description: t.noMedicationFound,
        });
      }
    } else {
      setSearchResult({
        success: false,
        message: 'No text detected in image'
      });
      setProcessingStageLocal("No text detected");
      toast({
        title: t.warning,
        description: t.noTextDetected,
      });
    }
  }, [onMedicationFound, onClose, toast, t]);

  const confirmCapture = useCallback(() => {
    if (capturedImage) {
      processOCR(); // Call the new OCR processing function
    }
  }, [capturedImage, processOCR]);

  const retakePhoto = useCallback(() => {
    setCapturedImage(null);
    setDetectedText('');
    setSearchResult({});
    // Restart camera if it was active
    if (isActive) {
      startCamera();
    }
  }, [isActive, startCamera]);

  const downloadImage = useCallback(() => {
    if (capturedImage) {
      const link = document.createElement('a');
      link.download = `medication-scan-${Date.now()}.png`; // Use PNG for better quality
      link.href = capturedImage;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast({
        title: t.success,
        description: t.downloadImageSuccess, // More descriptive success message
      });
    }
  }, [capturedImage, toast, t]);

  // Effect to start camera on mount and stop on unmount
  useEffect(() => {
    startCamera();
    return () => stopCamera();
  }, [startCamera, stopCamera]);

  // Effect to re-apply settings if needed (e.g., after switching camera, though switchCamera is handled internally)
  // This might be redundant if startCamera is called on switch, but kept for potential future needs.
  useEffect(() => {
    if (isActive && !isInitializing) {
      // Re-apply zoom, brightness, contrast if they change after initial load
      const videoTrack = streamRef.current?.getVideoTracks()[0];
      if (videoTrack) {
        const capabilities = videoTrack.getCapabilities();
        const constraints: MediaTrackConstraints = {};

        if (capabilities.zoom && zoom[0] !== 1) {
          constraints.zoom = zoom[0];
        }
        if (capabilities.torch) { // Flash is handled by toggleFlash
          constraints.torch = flashEnabled;
        }

        // Brightness and contrast are handled by CSS filters, not track constraints usually
        // If they were direct constraints:
        // if (capabilities.brightness) constraints.brightness = brightness[0]/100;
        // if (capabilities.contrast) constraints.contrast = contrast[0]/100;

        try {
          videoTrack.applyConstraints(constraints);
        } catch (constraintError) {
          console.warn('Could not apply camera constraints in useEffect:', constraintError);
        }
      }
    }
  }, [zoom, flashEnabled, isActive, isInitializing]);

  // Style for the video element, applying zoom and filter effects
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
          aria-label="Close camera"
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
          aria-label="Toggle settings"
        >
          <Settings className="h-6 w-6" />
        </Button>
      </div>

      {/* Settings Panel */}
      {showSettings && (
        <Card className="absolute top-16 right-4 w-80 bg-black/90 backdrop-blur-md text-white border-gray-600 z-10">
          <CardContent className="p-4 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="zoom-slider">Zoom: {zoom[0]}x</Label>
              <Slider
                id="zoom-slider"
                value={zoom}
                onValueChange={setZoom}
                max={3}
                min={1}
                step={0.1}
                className="w-full"
                aria-label="Zoom slider"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="brightness-slider">Brightness: {brightness[0]}%</Label>
              <Slider
                id="brightness-slider"
                value={brightness}
                onValueChange={setBrightness}
                max={200} // Adjusted max to 200 for a wider range
                min={0}   // Adjusted min to 0
                step={5}
                className="w-full"
                aria-label="Brightness slider"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="contrast-slider">Contrast: {contrast[0]}%</Label>
              <Slider
                id="contrast-slider"
                value={contrast}
                onValueChange={setContrast}
                max={200} // Adjusted max to 200 for a wider range
                min={0}   // Adjusted min to 0
                step={5}
                className="w-full"
                aria-label="Contrast slider"
              />
            </div>

            <div className="flex items-center space-x-2 pt-4">
              <Switch id="autofocus-switch" checked={autoFocus} onCheckedChange={setAutoFocus} />
              <Label htmlFor="autofocus-switch">Auto Focus</Label>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Camera View */}
      <div className="flex-1 relative overflow-hidden">
        {isInitializing ? (
          <div className="w-full h-full flex flex-col items-center justify-center bg-gray-900">
            <div className="animate-spin w-12 h-12 border-4 border-white border-t-transparent rounded-full mb-4"></div>
            <p className="text-white text-lg">Initializing Camera...</p>
            <p className="text-gray-400 text-sm mt-2">Please allow camera permissions</p>
            
            {/* Show sample content while loading */}
            <div className="mt-8 bg-white/5 rounded-lg p-4 max-w-sm">
              <div className="flex items-center space-x-3 mb-3">
                <Pill className="w-8 h-8 text-blue-400" />
                <div>
                  <h3 className="text-white font-medium">100,000+ Medications</h3>
                  <p className="text-gray-400 text-xs">English & Vietnamese supported</p>
                </div>
              </div>
              <div className="text-xs text-gray-400">
                • Instant OCR recognition<br/>
                • Comprehensive drug database<br/>
                • Dosage & safety information
              </div>
            </div>
            
            {/* Fallback options */}
            <div className="mt-6 flex space-x-3">
              <Button
                onClick={() => {
                  setIsInitializing(false);
                  setCameraError("Camera unavailable - using demo mode");
                }}
                variant="outline"
                className="text-white border-white hover:bg-white/20"
              >
                Skip Camera
              </Button>
            </div>
          </div>
        ) : cameraError ? (
          <div className="w-full h-full flex flex-col items-center justify-center bg-gray-900 text-white p-8">
            <AlertCircle className="w-16 h-16 mb-4 text-red-400" />
            <h2 className="text-xl font-semibold mb-2">Camera Error</h2>
            <p className="text-center mb-6 text-gray-300">{cameraError}</p>
            
            {/* Show sample medication for demo */}
            <div className="bg-white/10 rounded-lg p-6 mb-6 text-center">
              <Pill className="w-12 h-12 text-blue-400 mx-auto mb-3" />
              <h3 className="text-lg font-semibold mb-2">Demo Mode</h3>
              <p className="text-sm text-gray-300 mb-4">
                Camera unavailable. Here's a sample medication from our database:
              </p>
              <div className="bg-blue-600/20 rounded-lg p-4">
                <h4 className="font-semibold text-blue-200">Acetaminophen (Paracetamol)</h4>
                <p className="text-sm text-gray-300 mt-1">Pain reliever - 500mg tablets</p>
                <p className="text-xs text-gray-400 mt-2">Adult dosage: 500-1000mg every 4-6 hours</p>
              </div>
            </div>
            
            <div className="flex space-x-3">
              <Button
                onClick={startCamera}
                className="bg-blue-600 hover:bg-blue-700"
              >
                Try Again
              </Button>
              <Button
                onClick={() => {
                  // Simulate finding a medication
                  onMedicationFound({
                    id: "med-001",
                    name: "Acetaminophen",
                    nameVi: "Paracetamol",
                    category: "Pain Reliever",
                    primaryUse: "Pain relief and fever reduction",
                    adultDosage: "500-1000mg every 4-6 hours",
                    warnings: ["Do not exceed 4000mg daily", "Avoid alcohol"]
                  });
                  onClose();
                }}
                variant="outline"
                className="text-white border-white hover:bg-white/20"
              >
                Use Sample
              </Button>
            </div>
          </div>
        ) : isProcessing ? (
          <div className="w-full h-full flex flex-col items-center justify-center bg-black/90">
            <div className="text-center text-white p-8">
              <div className="animate-spin w-16 h-16 border-4 border-white border-t-transparent rounded-full mx-auto mb-6"></div>
              <h2 className="text-2xl font-semibold mb-2">{t.processingImage}</h2>
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
              className="w-full h-full object-cover bg-black"
              style={{
                ...videoStyle,
                display: isActive ? 'block' : 'none'
              }}
              playsInline
              muted
              autoPlay
              webkit-playsinline="true"
            />
            
            {/* Loading overlay while camera is starting */}
            {!isActive && !cameraError && (
              <div className="absolute inset-0 bg-black flex items-center justify-center">
                <div className="text-white text-center">
                  <div className="animate-spin w-8 h-8 border-4 border-white border-t-transparent rounded-full mx-auto mb-2"></div>
                  <p>Starting camera...</p>
                </div>
              </div>
            )}

            {/* Medication Capture Guide */}
            <div className="absolute inset-0 pointer-events-none">
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-48 border-2 border-yellow-400 bg-yellow-400/10 rounded-lg flex items-center justify-center text-white text-sm text-center p-2">
                {t.alignMedicationLabel}
                {/* Corner markers */}
                <div className="absolute -top-2 -left-2 w-4 h-4 border-l-2 border-t-2 border-yellow-400"></div>
                <div className="absolute -top-2 -right-2 w-4 h-4 border-r-2 border-t-2 border-yellow-400"></div>
                <div className="absolute -bottom-2 -left-2 w-4 h-4 border-l-2 border-b-2 border-yellow-400"></div>
                <div className="absolute -bottom-2 -right-2 w-4 h-4 border-r-2 border-b-2 border-yellow-400"></div>
              </div>

              <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-black/70 text-white text-sm px-4 py-2 rounded-lg text-center">
                <div className="mb-1">📱 {t.ensureGoodLighting}</div>
                <div>🔍 {t.focusOnDrugName}</div>
              </div>
            </div>
          </>
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-black">
            <img
              src={capturedImage}
              alt="Captured medication"
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
                setCapturedImage(null); // Reset to allow retake
                startCamera(); // Restart camera
              }}
              variant="outline"
              size="lg"
              className="text-white border-white hover:bg-white/20"
            >
              {t.cancel}
            </Button>
          </div>
        ) : !capturedImage ? (
          <div className="flex justify-center items-center space-x-4 md:space-x-8">
            {hasFlash && (
              <Button
                onClick={toggleFlash}
                variant="ghost"
                size="icon"
                className={`text-white hover:bg-white/20 ${flashEnabled ? 'bg-yellow-500/20' : ''}`}
                aria-label="Toggle flash"
              >
                {flashEnabled ? <Zap className="h-6 w-6" /> : <ZapOff className="h-6 w-6" />}
              </Button>
            )}

            <Button
              onClick={capturePhoto}
              disabled={!isActive || isProcessing}
              size="lg"
              className="w-20 h-20 rounded-full bg-white hover:bg-gray-200 text-black disabled:opacity-50"
              aria-label="Capture photo"
            >
              <Camera className="h-8 w-8" />
            </Button>

            <Button
              onClick={switchCamera}
              variant="ghost"
              size="icon"
              className="text-white hover:bg-white/20"
              aria-label="Switch camera"
            >
              <SwitchCamera className="h-6 w-6" />
            </Button>
          </div>
        ) : (
          <div className="flex justify-center items-center space-x-2 md:space-x-4 flex-wrap">
            <Button
              onClick={retakePhoto}
              variant="outline"
              size="lg"
              className="flex items-center space-x-2 text-white border-white hover:bg-white/20 disabled:opacity-50"
              disabled={isProcessing}
            >
              <RefreshCw className="h-5 w-5" />
              <span>{t.retakePhoto}</span>
            </Button>

            <Button
              onClick={downloadImage}
              variant="outline"
              size="lg"
              className="flex items-center space-x-2 text-white border-white hover:bg-white/20 disabled:opacity-50"
              disabled={isProcessing}
            >
              <Download className="h-5 w-5" />
              <span>{t.downloadImage}</span>
            </Button>

            <Button
              onClick={confirmCapture} // This now calls processOCR
              disabled={isProcessing}
              className="flex items-center space-x-2 bg-green-600 hover:bg-green-700 disabled:opacity-50"
              aria-label="Process OCR"
            >
              <Scan className="h-5 w-5" /> {/* Changed icon to Scan */}
              <span>{isProcessing ? t.processing : t.scanText}</span>
            </Button>

            <Button
              variant="secondary"
              onClick={() => setShowSettings(!showSettings)}
              className="flex items-center space-x-2 disabled:opacity-50"
              disabled={isProcessing}
              aria-label="Toggle settings"
            >
              <Settings className="h-5 w-5" />
              <span>{t.settings}</span>
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

export default memo(CameraInterface);