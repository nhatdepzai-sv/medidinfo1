import React, { useState, useRef, useCallback, useEffect, memo, lazy, Suspense } from 'react';
import { Camera, SwitchCamera, Zap, ZapOff, Download, RefreshCw, Settings, X, Check, AlertCircle, Scan, Pill } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';
import { useLanguage } from '../contexts/language-context';
import { Badge } from './ui/badge';
import { Slider } from './ui/slider';
import { Switch } from './ui/switch';
import { Label } from './ui/label';
import { useToast } from '../hooks/use-toast';

// Lazy load Tesseract for better initial loading
const lazyLoadTesseract = () => import('tesseract.js');

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
  const [liveDetection, setLiveDetection] = useState<string>('');
  const [isLiveScanning, setIsLiveScanning] = useState(false);
  const [lastScanTime, setLastScanTime] = useState(0);
  const { toast } = useToast(); // Initialize useToast

  const getConstraints = useCallback(() => {
    // Optimized constraints for faster initialization
    const constraints: MediaStreamConstraints = {
      video: {
        facingMode: facingMode,
        width: { ideal: 720, min: 480 }, // Reduced for faster init
        height: { ideal: 480, min: 360 },
        frameRate: { ideal: 15, max: 30 }, // Lower framerate for better performance
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

      console.log('Requesting camera with constraints:', getConstraints());
      const stream = await navigator.mediaDevices.getUserMedia(getConstraints());
      streamRef.current = stream;
      
      // Set active immediately after getting stream
      setIsActive(true);

      if (videoRef.current) {
        videoRef.current.srcObject = stream;

        // Set video properties for better display
        videoRef.current.setAttribute('playsinline', 'true');
        videoRef.current.setAttribute('autoplay', 'true');
        videoRef.current.setAttribute('muted', 'true');

        // Simplified video setup for faster loading
        videoRef.current.srcObject = stream;
        videoRef.current.setAttribute('playsinline', 'true');
        videoRef.current.setAttribute('autoplay', 'true');
        videoRef.current.setAttribute('muted', 'true');
        
        // Start playing and resolve quickly
        try {
          await videoRef.current.play();
          console.log('Camera is now active');
        } catch (playError) {
          console.error('Play error:', playError);
          // Continue anyway as some browsers play automatically
        }

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

    // Show immediate feedback with flash effect
    const flashOverlay = document.createElement('div');
    flashOverlay.className = 'fixed inset-0 bg-white opacity-80 z-50 pointer-events-none';
    document.body.appendChild(flashOverlay);

    setTimeout(() => {
      document.body.removeChild(flashOverlay);
    }, 150);

    // Add capture sound effect (optional)
    try {
      const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmNBCCl+zPLOekYHHWq+8qGOWRAJU6v7vG1fGTNhkfKxjUIJLXzE8dnAFUkPIXfb92OGWAkzU4fgutdBCTFjkfOzgVYKJXfO7+n9CFgQOGu83YFuCAU0e8jT2nyiCgggCG+mEJr2jjsKO3e7xHpOCBA9dtzs2YaLKQQcjVzocxoGJf1u2OwCAMN+zFqGZY+EMQdXlr3C1IRkOA==');
      audio.play().catch(() => {}); // Ignore audio errors
    } catch (e) {}

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

    // Set canvas size to optimal resolution for OCR (balance between quality and processing speed)
    const optimalWidth = Math.min(video.videoWidth || 1920, 2048);
    const optimalHeight = Math.min(video.videoHeight || 1080, 1536);
    
    canvas.width = optimalWidth;
    canvas.height = optimalHeight;

    // Draw video frame with enhanced quality
    ctx.imageSmoothingEnabled = false; // Disable smoothing for sharper text
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Advanced image preprocessing for optimal OCR
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;
    
    // Get brightness and contrast values from state
    const brightnessValue = (Number(brightness[0]) - 100) / 100;
    const contrastValue = Number(contrast[0]) / 100;

    // Advanced preprocessing pipeline
    for (let i = 0; i < data.length; i += 4) {
      // Convert to grayscale with optimal weights for text recognition
      const gray = data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114;

      // Apply brightness and contrast adjustments
      let processedValue = gray;
      
      // Contrast adjustment
      processedValue = ((processedValue - 128) * contrastValue) + 128;
      
      // Brightness adjustment
      processedValue = processedValue + (processedValue * brightnessValue);
      
      // Clamp initial adjustments
      processedValue = Math.max(0, Math.min(255, processedValue));

      // Advanced text enhancement techniques
      
      // 1. Adaptive thresholding for better text separation
      const localThreshold = 128; // Could be made adaptive based on local area
      const thresholdSensitivity = 30;
      
      if (Math.abs(processedValue - localThreshold) > thresholdSensitivity) {
        // Strong contrast areas - enhance further
        if (processedValue > localThreshold) {
          processedValue = Math.min(255, processedValue * 1.15); // Make whites whiter
        } else {
          processedValue = Math.max(0, processedValue * 0.85); // Make blacks blacker
        }
      }
      
      // 2. Noise reduction - smooth very dark or very light values
      if (processedValue < 40 || processedValue > 215) {
        // Apply slight smoothing to reduce noise in extreme values
        const smoothingFactor = 0.9;
        processedValue = processedValue * smoothingFactor + (processedValue > 127 ? 255 : 0) * (1 - smoothingFactor);
      }
      
      // 3. Final edge enhancement for text clarity
      if (processedValue > 100 && processedValue < 155) {
        // Medium gray areas - push towards black or white based on local context
        processedValue = processedValue > 127 ? Math.min(255, processedValue * 1.2) : Math.max(0, processedValue * 0.8);
      }

      // Final clamping
      processedValue = Math.max(0, Math.min(255, Math.round(processedValue)));

      // Apply to all color channels for grayscale
      data[i] = processedValue;     // R
      data[i + 1] = processedValue; // G
      data[i + 2] = processedValue; // B
      // Alpha channel stays unchanged
    }

    // Apply sharpening filter for better text edge definition
    const sharpenKernel = [
      0, -1, 0,
      -1, 5, -1,
      0, -1, 0
    ];
    
    const sharpened = new Uint8ClampedArray(data);
    const width = canvas.width;
    const height = canvas.height;
    
    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        const idx = (y * width + x) * 4;
        let sum = 0;
        
        for (let ky = -1; ky <= 1; ky++) {
          for (let kx = -1; kx <= 1; kx++) {
            const kidx = ((y + ky) * width + (x + kx)) * 4;
            sum += data[kidx] * sharpenKernel[(ky + 1) * 3 + (kx + 1)];
          }
        }
        
        const sharpenedValue = Math.max(0, Math.min(255, sum));
        sharpened[idx] = sharpenedValue;
        sharpened[idx + 1] = sharpenedValue;
        sharpened[idx + 2] = sharpenedValue;
      }
    }
    
    const finalImageData = new ImageData(sharpened, width, height);
    ctx.putImageData(finalImageData, 0, 0);

    // Export as high-quality PNG for OCR processing
    const imageData64 = canvas.toDataURL('image/png', 1.0);
    setCapturedImage(imageData64);
    onCapture(imageData64);
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
    setProcessingStageLocal('Loading OCR engine...');
    setOcrProgress(10);
    setDetectedText('');
    setSearchResult({});

    try {
      // Lazy load Tesseract for better performance
      const Tesseract = await lazyLoadTesseract();

      setProcessingStageLocal('Loading OCR engine...');

      // Initialize worker with multiple languages for better recognition
      const worker = await Tesseract.createWorker(['eng'], 1, {
        logger: m => {
          if (m.status === 'recognizing text') {
            setProcessingStageLocal(`Recognizing text... ${Math.round(m.progress * 100)}%`);
            setOcrProgress(Math.round(m.progress * 100));
          } else {
            setProcessingStageLocal(m.status);
          }
        }
      });

      // Enhanced preprocessing for better medication text recognition
      setProcessingStageLocal('Preprocessing image...');
      
      // Create a temporary canvas for image preprocessing
      const tempCanvas = document.createElement('canvas');
      const tempCtx = tempCanvas.getContext('2d');
      const img = new Image();
      
      await new Promise((resolve) => {
        img.onload = resolve;
        img.src = capturedImage;
      });

      tempCanvas.width = img.width;
      tempCanvas.height = img.height;
      tempCtx.drawImage(img, 0, 0);

      // Advanced image preprocessing for better OCR
      const imageData = tempCtx.getImageData(0, 0, tempCanvas.width, tempCanvas.height);
      const data = imageData.data;

      // Apply multiple preprocessing techniques
      for (let i = 0; i < data.length; i += 4) {
        // Convert to grayscale with optimal weights for text
        const gray = data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114;
        
        // Apply threshold to make text more distinct
        const threshold = 128;
        const binaryValue = gray > threshold ? 255 : 0;
        
        // Apply slight sharpening by increasing contrast
        const sharpenedValue = gray < 100 ? Math.max(0, gray - 20) : 
                              gray > 155 ? Math.min(255, gray + 20) : gray;
        
        // Use binary for very clear text, sharpened for medium contrast
        const finalValue = Math.abs(gray - threshold) > 50 ? binaryValue : sharpenedValue;
        
        data[i] = finalValue;
        data[i + 1] = finalValue;
        data[i + 2] = finalValue;
      }

      tempCtx.putImageData(imageData, 0, 0);
      const preprocessedImage = tempCanvas.toDataURL('image/png', 1.0);

      // Single-pass OCR for faster processing
      setProcessingStageLocal('Recognizing medication text...');
      await worker.setParameters({
        tessedit_char_whitelist: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-.,()/ %',
        tessedit_pageseg_mode: 6, // Uniform block of text
        preserve_interword_spaces: '1',
        tessedit_ocr_engine_mode: 1, // Neural nets LSTM engine
      });

      const ocrResult = await worker.recognize(preprocessedImage);
      const ocrResults = [{ text: ocrResult.data.text, confidence: ocrResult.data.confidence, method: 'optimized' }];

      await worker.terminate();

      // Analyze and combine results
      setProcessingStageLocal('Analyzing results...');
      
      // Sort by confidence and filter meaningful results
      const validResults = ocrResults
        .filter(result => result.text.trim().length > 2 && result.confidence > 30)
        .sort((a, b) => b.confidence - a.confidence);

      console.log('OCR Results:', validResults);

      let finalCleanText = '';
      
      if (validResults.length > 0) {
        // Combine top results intelligently
        const topResult = validResults[0];
        finalCleanText = topResult.text.trim();
        
        // If we have multiple good results, try to extract the best medication name
        if (validResults.length > 1) {
          const allTexts = validResults.map(r => r.text.trim()).join(' ');
          const medicationPattern = /\b[A-Za-z]{3,20}\b/g;
          const potentialMeds = [...new Set(allTexts.match(medicationPattern) || [])];
          
          if (potentialMeds.length > 0) {
            // Prioritize longer, more complete medication names
            const bestMed = potentialMeds.sort((a, b) => b.length - a.length)[0];
            if (bestMed.length > finalCleanText.length) {
              finalCleanText = bestMed;
            }
          }
        }
      }

      if (!finalCleanText) {
        throw new Error('No readable text found in image');
      }

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
    if (!text || text.trim().length < 2) {
      setSearchResult({
        success: false,
        message: 'No readable text detected in image'
      });
      setProcessingStageLocal("No text detected");
      toast({
        title: t.warning,
        description: t.textNotDetected,
      });
      return;
    }

    setProcessingStageLocal('Searching comprehensive database...');

    // Advanced text preprocessing for medication name extraction
    const preprocessedText = text
      .replace(/[^\w\s.-]/g, ' ') // Remove special characters except word chars, spaces, dots, hyphens
      .replace(/\s+/g, ' ') // Replace multiple spaces with single space
      .trim();

    // Extract potential medication names using multiple strategies
    const words = preprocessedText
      .split(/[\s\n\r,.-]+/)
      .filter(word => word.length > 2)
      .filter(word => /^[A-Za-z][A-Za-z0-9-]*$/.test(word)); // Basic regex for medication names

    // Extract complete phrases that might be medication names
    const phrases = preprocessedText
      .split(/[,.;:\n\r]+/)
      .map(phrase => phrase.trim())
      .filter(phrase => phrase.length > 3 && phrase.length < 30); // Optimized phrase length

    // Combine and deduplicate search terms, prioritize longer terms
    const searchTerms = [...new Set([...phrases, ...words])]
      .sort((a, b) => b.length - a.length) // Longer terms first
      .slice(0, 10); // Limit search terms for performance

    console.log('Enhanced search terms extracted:', searchTerms);

    if (searchTerms.length === 0) {
      setSearchResult({
        success: false,
        message: 'No valid medication names found in text'
      });
      setProcessingStageLocal("No valid names found");
      toast({
        title: t.warning,
        description: t.noRelevantTextFound,
      });
      return;
    }

    try {
      // Search using the enhanced API endpoint
      const allMedications = [];
      const medicationIds = new Set();
      let bestMatch = null;
      let highestRelevance = 0;

      for (const term of searchTerms) {
        try {
          const response = await fetch(`/api/search-medications?query=${encodeURIComponent(term)}`);
          if (!response.ok) continue;
          
          const result = await response.json();
          
          if (result.success && result.medications && result.medications.length > 0) {
            // Calculate relevance score for each result
            for (const med of result.medications) {
              if (!medicationIds.has(med.id)) {
                medicationIds.add(med.id);
                allMedications.push(med);
                
                // Calculate relevance based on exact match and term length
                const exactMatch = med.name.toLowerCase() === term.toLowerCase() ||
                                 med.genericName?.toLowerCase() === term.toLowerCase();
                const containsMatch = med.name.toLowerCase().includes(term.toLowerCase());
                
                let relevance = 0;
                if (exactMatch) relevance = 100;
                else if (containsMatch) relevance = 80;
                else relevance = 60;
                
                // Boost relevance for longer search terms (more specific)
                relevance += Math.min(term.length * 2, 20);
                
                if (relevance > highestRelevance) {
                  highestRelevance = relevance;
                  bestMatch = med;
                }
              }
            }
            
            // If we found a very high confidence match, break early
            if (highestRelevance >= 95) break;
          }
        } catch (searchError) {
          console.warn(`Search failed for term "${term}":`, searchError);
          continue;
        }
      }

      if (allMedications.length > 0) {
        // Sort medications by relevance
        const sortedMedications = allMedications.sort((a, b) => {
          const aExact = searchTerms.some(term => 
            a.name.toLowerCase() === term.toLowerCase() ||
            a.genericName?.toLowerCase() === term.toLowerCase()
          );
          const bExact = searchTerms.some(term => 
            b.name.toLowerCase() === term.toLowerCase() ||
            b.genericName?.toLowerCase() === term.toLowerCase()
          );
          
          if (aExact && !bExact) return -1;
          if (!aExact && bExact) return 1;
          
          return a.name.length - b.name.length; // Shorter names often more relevant
        });

        setSearchResult({
          success: true,
          medications: sortedMedications,
          message: `Found ${allMedications.length} medication(s) - Best match: ${bestMatch?.name || sortedMedications[0]?.name}`
        });
        setProcessingStageLocal("✅ Medication found!");

        // Automatically use the best match
        const finalMatch = bestMatch || sortedMedications[0];
        
        toast({
          title: t.success || "Success",
          description: `Found: ${finalMatch.name}`,
        });

        // Auto-select after showing success message
        setTimeout(() => {
          onMedicationFound(finalMatch);
          onClose();
        }, 2000);
        
      } else {
        setSearchResult({
          success: false,
          message: `No medications found matching: "${searchTerms.join(', ')}"`
        });
        setProcessingStageLocal("No matches found");
        toast({
          title: t.info || "Info",
          description: t.noMedicationFound || "No medication found in our database",
        });
      }

    } catch (error) {
      console.error('Search medications error:', error);
      setSearchResult({
        success: false,
        message: 'Search failed - please try again'
      });
      setProcessingStageLocal("Search error");
      toast({
        title: t.error,
        description: t.failedToProcessImage || "Search failed",
        variant: "destructive",
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

  // Live scanning function
  const performLiveScan = useCallback(async () => {
    if (!videoRef.current || !canvasRef.current || !isActive || isProcessing) return;

    const now = Date.now();
    if (now - lastScanTime < 2000) return; // Throttle to every 2 seconds

    setLastScanTime(now);
    setIsLiveScanning(true);

    try {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');

      if (!ctx) return;

      // Set smaller canvas size for live scanning (faster processing)
      canvas.width = 640;
      canvas.height = 480;

      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      // Convert to grayscale for better OCR
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;

      for (let i = 0; i < data.length; i += 4) {
        const gray = data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114;
        data[i] = gray;
        data[i + 1] = gray;
        data[i + 2] = gray;
      }

      ctx.putImageData(imageData, 0, 0);
      const imageDataUrl = canvas.toDataURL('image/jpeg', 0.8);

      // Quick OCR with basic settings
      const Tesseract = await import('tesseract.js');
      const worker = await Tesseract.createWorker(['eng'], 1, {
        logger: () => {} // Disable logging for live scan
      });

      await worker.setParameters({
        tessedit_char_whitelist: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-.',
        tessedit_pageseg_mode: 8, // Single word
        preserve_interword_spaces: '0'
      });

      const { data: { text } } = await worker.recognize(imageDataUrl);
      await worker.terminate();

      const cleanText = text.trim().replace(/[^\w\s-]/g, '').slice(0, 20);
      if (cleanText.length > 2) {
        setLiveDetection(cleanText);
      }
    } catch (error) {
      console.log('Live scan error:', error);
    } finally {
      setIsLiveScanning(false);
    }
  }, [isActive, isProcessing, lastScanTime]);

  // Effect to start camera on mount and stop on unmount
  useEffect(() => {
    startCamera();
    return () => stopCamera();
  }, [startCamera, stopCamera]);

  // Disabled live scanning for better performance - can be re-enabled if needed
  // useEffect(() => {
  //   if (isActive && !capturedImage && !isProcessing) {
  //     const interval = setInterval(performLiveScan, 3000);
  //     return () => clearInterval(interval);
  //   }
  // }, [isActive, capturedImage, isProcessing, performLiveScan]);

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
          <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-blue-900 via-purple-900 to-blue-800">
            <div className="text-center text-white p-8 max-w-sm">
              {/* Enhanced loading animation */}
              <div className="relative mb-8">
                <div className="animate-spin w-20 h-20 border-4 border-white border-t-transparent rounded-full mx-auto"></div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <Pill className="w-8 h-8 text-white animate-pulse" />
                </div>
              </div>

              <h2 className="text-2xl font-bold mb-3">{t.processingImage || 'Processing Image'}</h2>
              <p className="text-lg opacity-90 mb-6">{processingStage}</p>

              {/* Progress bar with percentage */}
              {ocrProgress > 0 && (
                <div className="mb-6">
                  <div className="flex justify-between text-sm mb-2">
                    <span>OCR Progress</span>
                    <span>{ocrProgress}%</span>
                  </div>
                  <div className="w-full bg-white/20 rounded-full h-3">
                    <div
                      className="bg-gradient-to-r from-blue-400 to-green-400 h-3 rounded-full transition-all duration-500 shadow-lg"
                      style={{width: `${ocrProgress}%`}}
                    ></div>
                  </div>
                </div>
              )}

              {/* Processing steps indicator */}
              <div className="bg-white/10 rounded-lg p-4 text-sm">
                <div className="space-y-2">
                  <div className={`flex items-center space-x-2 ${processingStage.includes('Initializing') ? 'text-yellow-300' : 'text-green-300'}`}>
                    <div className="w-2 h-2 rounded-full bg-current animate-pulse"></div>
                    <span>Image preprocessing</span>
                  </div>
                  <div className={`flex items-center space-x-2 ${processingStage.includes('recognizing') ? 'text-yellow-300' : 'text-gray-400'}`}>
                    <div className="w-2 h-2 rounded-full bg-current animate-pulse"></div>
                    <span>Text recognition</span>
                  </div>
                  <div className={`flex items-center space-x-2 ${processingStage.includes('Searching') ? 'text-yellow-300' : 'text-gray-400'}`}>
                    <div className="w-2 h-2 rounded-full bg-current animate-pulse"></div>
                    <span>Database search</span>
                  </div>
                </div>
              </div>

              <p className="text-xs opacity-70 mt-4">
                {t.processingNote || 'Analyzing medication name and searching our comprehensive database...'}
              </p>
            </div>
          </div>
        ) : !capturedImage ? (
          <>
            <video
              ref={videoRef}
              className="w-full h-full object-cover bg-black"
              style={{
                ...videoStyle,
                display: 'block' // Always show video element
              }}
              playsInline
              muted
              autoPlay
              webkit-playsinline="true"
            />

            {/* Loading overlay while camera is starting */}
            {(!isActive || isInitializing) && !cameraError && (
              <div className="absolute inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center">
                <div className="text-white text-center p-8">
                  <div className="animate-spin w-12 h-12 border-4 border-white border-t-transparent rounded-full mx-auto mb-4"></div>
                  <h3 className="text-xl font-semibold mb-2">{t.startingCamera || 'Starting Camera...'}</h3>
                  <p className="text-sm opacity-80">{t.pleaseWait || 'Please wait while we initialize your camera'}</p>

                  {/* Camera setup progress */}
                  <div className="mt-6 bg-white/10 rounded-lg p-4 max-w-sm mx-auto">
                    <div className="flex items-center space-x-3 mb-3">
                      <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                      <span className="text-sm">Requesting camera permissions</span>
                    </div>
                    <div className="flex items-center space-x-3 mb-3">
                      <div className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse"></div>
                      <span className="text-sm">Initializing video stream</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
                      <span className="text-sm">Preparing OCR engine</span>
                    </div>
                  </div>
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

              {/* Live Detection Display */}
              {liveDetection && (
                <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-green-600/90 text-white px-4 py-2 rounded-lg backdrop-blur-sm">
                  <div className="flex items-center space-x-2">
                    {isLiveScanning ? (
                      <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full"></div>
                    ) : (
                      <div className="w-2 h-2 bg-green-300 rounded-full animate-pulse"></div>
                    )}
                    <span className="font-medium">Detecting: {liveDetection}</span>
                  </div>
                </div>
              )}

              <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-black/70 text-white text-sm px-4 py-2 rounded-lg text-center">
                <div className="mb-1">📱 {t.ensureGoodLighting}</div>
                <div>🔍 {t.focusOnDrugName}</div>
                {liveDetection && (
                  <div className="mt-1 text-green-300">✨ Live scanning active</div>
                )}
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