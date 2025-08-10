
import { useState, useRef, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Camera, X, Zap, RotateCcw, Flashlight, Maximize2, Download, Search, CameraOff, Settings, ZoomIn, ZoomOut, Focus, Grid3X3, Timer, Volume2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/contexts/language-context";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface CameraInterfaceProps {
  onPhotoCapture: (file: File) => void;
  onCancel: () => void;
  isLoading: boolean;
}

export default function CameraInterface({ onPhotoCapture, onCancel, isLoading }: CameraInterfaceProps) {
  const [isActive, setIsActive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [facingMode, setFacingMode] = useState<"user" | "environment">("environment");
  const [flashEnabled, setFlashEnabled] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [maxZoom, setMaxZoom] = useState(4);
  const [gridEnabled, setGridEnabled] = useState(true);
  const [timerEnabled, setTimerEnabled] = useState(false);
  const [timerDuration, setTimerDuration] = useState(3);
  const [countdown, setCountdown] = useState(0);
  const [focusPoint, setFocusPoint] = useState<{ x: number; y: number } | null>(null);
  const [resolution, setResolution] = useState("high");
  const [stabilization, setStabilization] = useState(true);
  const [autoFocus, setAutoFocus] = useState(true);
  const [exposureCompensation, setExposureCompensation] = useState(0);
  const [whiteBalance, setWhiteBalance] = useState("auto");
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [captureHistory, setCaptureHistory] = useState<string[]>([]);
  const [deviceCapabilities, setDeviceCapabilities] = useState<any>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);

  const { t } = useLanguage();
  const { toast } = useToast();

  // Initialize audio context for camera sounds
  useEffect(() => {
    if (soundEnabled && !audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
  }, [soundEnabled]);

  const playShutterSound = useCallback(() => {
    if (!soundEnabled || !audioContextRef.current) return;
    
    const context = audioContextRef.current;
    const oscillator = context.createOscillator();
    const gainNode = context.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(context.destination);
    
    oscillator.frequency.setValueAtTime(800, context.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(400, context.currentTime + 0.1);
    
    gainNode.gain.setValueAtTime(0.3, context.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, context.currentTime + 0.1);
    
    oscillator.start(context.currentTime);
    oscillator.stop(context.currentTime + 0.1);
  }, [soundEnabled]);

  useEffect(() => {
    if (isActive) {
      startCamera();
    }
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [facingMode, resolution]);

  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);

  const getResolutionConstraints = (level: string) => {
    switch (level) {
      case "ultra":
        return { width: { min: 1920, ideal: 3840, max: 4096 }, height: { min: 1080, ideal: 2160, max: 2304 } };
      case "high":
        return { width: { min: 1280, ideal: 1920, max: 2560 }, height: { min: 720, ideal: 1080, max: 1440 } };
      case "medium":
        return { width: { min: 854, ideal: 1280, max: 1920 }, height: { min: 480, ideal: 720, max: 1080 } };
      case "low":
        return { width: { min: 640, ideal: 854, max: 1280 }, height: { min: 360, ideal: 480, max: 720 } };
      default:
        return { width: { min: 1280, ideal: 1920, max: 2560 }, height: { min: 720, ideal: 1080, max: 1440 } };
    }
  };

  const startCamera = async () => {
    try {
      setError(null);

      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }

      const resolutionConstraints = getResolutionConstraints(resolution);
      
      const constraints = {
        video: {
          facingMode: facingMode,
          ...resolutionConstraints,
          frameRate: { min: 24, ideal: 30, max: 60 },
          focusMode: autoFocus ? "continuous" : "manual",
          whiteBalanceMode: whiteBalance,
          exposureMode: "continuous",
          zoom: { min: 1, max: maxZoom, ideal: zoom },
          ...(stabilization && { videoStabilization: true })
        }
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);

      // Get device capabilities
      const track = stream.getVideoTracks()[0];
      const capabilities = track.getCapabilities();
      setDeviceCapabilities(capabilities);
      
      if (capabilities.zoom) {
        setMaxZoom(capabilities.zoom.max || 4);
      }

      // Apply advanced settings
      const settings: any = {};
      
      if (capabilities.exposureCompensation && exposureCompensation !== 0) {
        settings.exposureCompensation = exposureCompensation;
      }
      
      if (capabilities.zoom && zoom !== 1) {
        settings.zoom = zoom;
      }

      if (flashEnabled && capabilities.torch) {
        settings.torch = true;
      }

      if (Object.keys(settings).length > 0) {
        await track.applyConstraints({ advanced: [settings] });
      }

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        
        videoRef.current.onloadedmetadata = () => {
          setIsActive(true);
          toast({
            title: t("cameraActivated"),
            description: t("readyToCapture"),
          });
        };
      }
    } catch (err) {
      console.error('Camera access denied:', err);
      let errorMessage = t('cameraAccessDenied');

      if (err instanceof Error) {
        if (err.name === 'NotFoundError') {
          errorMessage = t('cameraNotFound');
        } else if (err.name === 'NotAllowedError') {
          errorMessage = t('cameraPermissionDenied');
        } else if (err.name === 'NotReadableError') {
          errorMessage = t('cameraInUse');
        }
      }

      setError(errorMessage);
      toast({
        variant: "destructive",
        title: t("cameraError"),
        description: errorMessage,
      });
      setIsActive(false);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    setIsActive(false);
    setError(null);
    setCapturedImage(null);
    setIsFullscreen(false);
    setCountdown(0);

    toast({
      title: t("cameraStopped"),
      description: t("cameraDeactivated"),
    });
  };

  const switchCamera = async () => {
    if (!isActive) return;
    
    const newFacingMode = facingMode === "user" ? "environment" : "user";
    
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    
    setFacingMode(newFacingMode);

    toast({
      title: t("cameraSwitched"),
      description: newFacingMode === "environment" ? t("backCamera") : t("frontCamera"),
    });
  };

  const toggleFlash = async () => {
    if (!streamRef.current) return;

    const track = streamRef.current.getVideoTracks()[0];
    const capabilities = track.getCapabilities();

    if (capabilities.torch) {
      try {
        await track.applyConstraints({
          advanced: [{ torch: !flashEnabled }]
        });
        setFlashEnabled(!flashEnabled);

        toast({
          title: flashEnabled ? t("flashOff") : t("flashOn"),
          description: flashEnabled ? t("flashDisabled") : t("flashEnabled"),
        });
      } catch (err) {
        toast({
          variant: "destructive",
          title: t("flashError"),
          description: t("flashNotSupported"),
        });
      }
    } else {
      toast({
        variant: "destructive",
        title: t("flashNotAvailable"),
        description: t("deviceDoesNotSupportFlash"),
      });
    }
  };

  const handleZoomChange = async (value: number[]) => {
    const newZoom = value[0];
    setZoom(newZoom);

    if (streamRef.current && deviceCapabilities?.zoom) {
      const track = streamRef.current.getVideoTracks()[0];
      try {
        await track.applyConstraints({
          advanced: [{ zoom: newZoom }]
        });
      } catch (err) {
        console.error('Zoom adjustment failed:', err);
      }
    }
  };

  const handleExposureChange = async (value: number[]) => {
    const newExposure = value[0];
    setExposureCompensation(newExposure);

    if (streamRef.current && deviceCapabilities?.exposureCompensation) {
      const track = streamRef.current.getVideoTracks()[0];
      try {
        await track.applyConstraints({
          advanced: [{ exposureCompensation: newExposure }]
        });
      } catch (err) {
        console.error('Exposure adjustment failed:', err);
      }
    }
  };

  const handleVideoClick = async (event: React.MouseEvent<HTMLVideoElement>) => {
    if (!streamRef.current || !videoRef.current) return;

    const rect = videoRef.current.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width) * 100;
    const y = ((event.clientY - rect.top) / rect.height) * 100;

    setFocusPoint({ x, y });

    // Attempt to focus at point if supported
    const track = streamRef.current.getVideoTracks()[0];
    if (deviceCapabilities?.focusDistance) {
      try {
        await track.applyConstraints({
          advanced: [{ focusDistance: 0.5 }] // Mid-range focus
        });
      } catch (err) {
        console.error('Manual focus failed:', err);
      }
    }

    // Clear focus point after animation
    setTimeout(() => setFocusPoint(null), 1000);
  };

  const startCountdown = () => {
    setCountdown(timerDuration);
    timerRef.current = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          if (timerRef.current) clearInterval(timerRef.current);
          captureImage();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const toggleFullscreen = () => {
    if (!isFullscreen) {
      if (containerRef.current && containerRef.current.requestFullscreen) {
        containerRef.current.requestFullscreen();
        setIsFullscreen(true);
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
        setIsFullscreen(false);
      }
    }
  };

  const captureImage = async () => {
    if (!videoRef.current || !canvasRef.current || isLoading) return;

    setIsProcessing(true);
    playShutterSound();

    try {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const context = canvas.getContext('2d', { 
        alpha: false,
        desynchronized: true,
        willReadFrequently: false
      });

      if (!context) throw new Error('Canvas context not available');

      // Set high-resolution canvas
      const scale = window.devicePixelRatio || 1;
      canvas.width = video.videoWidth * scale;
      canvas.height = video.videoHeight * scale;
      canvas.style.width = video.videoWidth + 'px';
      canvas.style.height = video.videoHeight + 'px';
      
      context.scale(scale, scale);
      context.imageSmoothingEnabled = true;
      context.imageSmoothingQuality = 'high';

      // Apply advanced image processing
      context.filter = 'contrast(1.1) brightness(1.05) saturate(1.1)';
      context.drawImage(video, 0, 0, video.videoWidth, video.videoHeight);

      // Additional OCR-optimized processing
      const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;

      // Enhanced contrast and sharpening for text recognition
      for (let i = 0; i < data.length; i += 4) {
        const brightness = (data[i] + data[i + 1] + data[i + 2]) / 3;
        const contrast = 1.3;
        const brightnessFactor = brightness < 128 ? -5 : 5;

        data[i] = Math.min(255, Math.max(0, contrast * data[i] + brightnessFactor));
        data[i + 1] = Math.min(255, Math.max(0, contrast * data[i + 1] + brightnessFactor));
        data[i + 2] = Math.min(255, Math.max(0, contrast * data[i + 2] + brightnessFactor));
      }

      context.putImageData(imageData, 0, 0);

      // Convert to high-quality image
      const capturedImageData = canvas.toDataURL('image/jpeg', 0.98);
      setCapturedImage(capturedImageData);
      setCaptureHistory(prev => [capturedImageData, ...prev.slice(0, 4)]);

      const blob = await new Promise<Blob | null>(resolve => canvas.toBlob(resolve, 'image/jpeg', 0.98));
      if (blob) {
        const file = new File([blob], `medication-scan-${Date.now()}.jpg`, { type: "image/jpeg" });
        onPhotoCapture(file);
      }

      toast({
        title: t("imageCaptured"),
        description: t("imageReadyForAnalysis"),
      });

    } catch (error) {
      console.error('Failed to capture image:', error);
      setError(t('captureError'));
      toast({
        variant: "destructive",
        title: t("captureError"),
        description: t("failedToCaptureImage"),
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const downloadImage = () => {
    if (!capturedImage) return;

    const link = document.createElement('a');
    link.href = capturedImage;
    link.download = `medication-scan-${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.jpg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast({
      title: t("imageDownloaded"),
      description: t("imageSavedToDevice"),
    });
  };

  const handleCancel = () => {
    stopCamera();
    onCancel();
  };

  return (
    <div ref={containerRef} className="space-y-4">
      {error && (
        <Alert>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className={`relative bg-black rounded-lg overflow-hidden transition-all duration-300 ${
        isFullscreen ? 'fixed inset-0 z-50 rounded-none' : 'aspect-video'
      }`}>
        {isActive ? (
          <>
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover cursor-crosshair"
              onClick={handleVideoClick}
              style={{ transform: `scale(${zoom})`, transformOrigin: 'center' }}
            />
            <canvas ref={canvasRef} className="hidden" />

            {/* Grid Overlay */}
            {gridEnabled && (
              <div className="absolute inset-0 pointer-events-none">
                <div className="grid grid-cols-3 grid-rows-3 w-full h-full">
                  {[...Array(9)].map((_, i) => (
                    <div key={i} className="border border-white/20"></div>
                  ))}
                </div>
              </div>
            )}

            {/* Focus Point Indicator */}
            {focusPoint && (
              <div
                className="absolute w-16 h-16 border-2 border-yellow-400 rounded-full pointer-events-none animate-ping"
                style={{
                  left: `${focusPoint.x}%`,
                  top: `${focusPoint.y}%`,
                  transform: 'translate(-50%, -50%)'
                }}
              />
            )}

            {/* Countdown Timer */}
            {countdown > 0 && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                <div className="text-8xl font-bold text-white animate-pulse">
                  {countdown}
                </div>
              </div>
            )}

            {/* Advanced Controls */}
            <div className="absolute top-4 left-4 space-y-2">
              <Button
                onClick={() => setShowSettings(!showSettings)}
                variant="outline"
                size="sm"
                className="bg-black/70 text-white border-white/30 hover:bg-black/80"
              >
                <Settings className="w-4 h-4" />
              </Button>

              {showSettings && (
                <div className="bg-black/80 p-4 rounded-lg space-y-3 w-64">
                  <div className="space-y-2">
                    <Label className="text-white text-xs">Zoom: {zoom.toFixed(1)}x</Label>
                    <Slider
                      value={[zoom]}
                      onValueChange={handleZoomChange}
                      max={maxZoom}
                      min={1}
                      step={0.1}
                      className="w-full"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label className="text-white text-xs">Exposure</Label>
                    <Slider
                      value={[exposureCompensation]}
                      onValueChange={handleExposureChange}
                      max={3}
                      min={-3}
                      step={0.1}
                      className="w-full"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-white text-xs">Resolution</Label>
                    <Select value={resolution} onValueChange={setResolution}>
                      <SelectTrigger className="w-full bg-black/50 border-white/30 text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ultra">Ultra (4K)</SelectItem>
                        <SelectItem value="high">High (1080p)</SelectItem>
                        <SelectItem value="medium">Medium (720p)</SelectItem>
                        <SelectItem value="low">Low (480p)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Switch
                      id="grid"
                      checked={gridEnabled}
                      onCheckedChange={setGridEnabled}
                    />
                    <Label htmlFor="grid" className="text-white text-xs">Grid</Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Switch
                      id="autofocus"
                      checked={autoFocus}
                      onCheckedChange={setAutoFocus}
                    />
                    <Label htmlFor="autofocus" className="text-white text-xs">Auto Focus</Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Switch
                      id="stabilization"
                      checked={stabilization}
                      onCheckedChange={setStabilization}
                    />
                    <Label htmlFor="stabilization" className="text-white text-xs">Stabilization</Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Switch
                      id="sound"
                      checked={soundEnabled}
                      onCheckedChange={setSoundEnabled}
                    />
                    <Label htmlFor="sound" className="text-white text-xs">Shutter Sound</Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Switch
                      id="timer"
                      checked={timerEnabled}
                      onCheckedChange={setTimerEnabled}
                    />
                    <Label htmlFor="timer" className="text-white text-xs">Timer ({timerDuration}s)</Label>
                  </div>
                </div>
              )}
            </div>

            {/* Top Controls */}
            <div className="absolute top-4 right-4 space-x-2 flex">
              <Button
                onClick={toggleFlash}
                variant="outline"
                size="sm"
                className={`border-white/30 hover:bg-black/70 ${
                  flashEnabled 
                    ? 'bg-yellow-500/80 text-black' 
                    : 'bg-black/50 text-white'
                }`}
              >
                <Flashlight className="w-4 h-4" />
              </Button>
              <Button
                onClick={switchCamera}
                variant="outline"
                size="sm"
                className="bg-black/50 text-white border-white/30 hover:bg-black/70"
              >
                <RotateCcw className="w-4 h-4" />
              </Button>
              <Button
                onClick={toggleFullscreen}
                variant="outline"
                size="sm"
                className="bg-black/50 text-white border-white/30 hover:bg-black/70"
              >
                <Maximize2 className="w-4 h-4" />
              </Button>
            </div>

            {/* Main Controls */}
            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 space-x-2">
              <Button
                onClick={timerEnabled ? startCountdown : captureImage}
                disabled={isProcessing || isLoading || countdown > 0}
                className="bg-white text-black hover:bg-gray-200 px-6 py-3 text-lg"
                size="lg"
              >
                <Camera className="w-5 h-5 mr-2" />
                {isProcessing ? t('processing') : countdown > 0 ? countdown : t('capture')}
              </Button>
              <Button
                onClick={handleCancel}
                variant="outline"
                size="lg"
                className="bg-red-600 text-white border-red-600 hover:bg-red-700 px-6 py-3"
                disabled={isLoading}
              >
                <X className="w-5 h-5 mr-2" />
                {t('cancel')}
              </Button>
            </div>

            {/* Enhanced Focus Frame */}
            <div className="absolute inset-0 pointer-events-none">
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 border-2 border-white/50 rounded-lg w-64 h-40">
                <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-green-400 rounded-tl-lg"></div>
                <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-green-400 rounded-tr-lg"></div>
                <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-green-400 rounded-bl-lg"></div>
                <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-green-400 rounded-br-lg"></div>
              </div>
              <div className="absolute bottom-24 left-1/2 transform -translate-x-1/2 text-white text-sm bg-black/70 px-4 py-2 rounded-full">
                {t('alignMedicationInFrame')}
              </div>
            </div>
          </>
        ) : (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <Camera className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-400 mb-4">{t('cameraInactive')}</p>
              <Button 
                onClick={() => {
                  setIsActive(true);
                  startCamera();
                }} 
                className="bg-primary text-primary-foreground" 
                size="lg"
              >
                <Camera className="w-4 h-4 mr-2" />
                {t('startCamera')}
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Capture History */}
      {captureHistory.length > 0 && (
        <div className="flex space-x-2 overflow-x-auto pb-2">
          {captureHistory.map((img, index) => (
            <img
              key={index}
              src={img}
              alt={`Capture ${index + 1}`}
              className="w-16 h-12 object-cover rounded border-2 border-gray-300 flex-shrink-0 cursor-pointer hover:border-primary"
              onClick={() => setCapturedImage(img)}
            />
          ))}
        </div>
      )}

      {/* Enhanced Captured Image Preview */}
      {capturedImage && (
        <div className="mt-4 p-4 border rounded-lg bg-gradient-to-r from-blue-50 to-green-50">
          <h3 className="font-medium text-gray-800 mb-3 flex items-center">
            <Search className="w-5 h-5 text-primary mr-2" />
            {t('capturedImage')}
          </h3>
          <div className="flex items-start space-x-4">
            <div className="relative">
              <img
                src={capturedImage}
                alt="Captured medication"
                className="w-40 h-30 object-cover rounded-lg border-2 border-primary/20 shadow-lg"
              />
              <div className="absolute -top-2 -right-2 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                <div className="w-2 h-2 bg-white rounded-full"></div>
              </div>
            </div>
            <div className="flex-1 space-y-3">
              <p className="text-sm text-gray-700 font-medium">{t('imageReadyForAnalysis')}</p>
              <div className="text-xs text-gray-500 space-y-1">
                <div>Resolution: {resolution.toUpperCase()}</div>
                <div>Zoom: {zoom.toFixed(1)}x</div>
                <div>Flash: {flashEnabled ? 'ON' : 'OFF'}</div>
              </div>
              <div className="flex space-x-2">
                <Button onClick={downloadImage} variant="outline" size="sm">
                  <Download className="w-4 h-4 mr-1" />
                  {t('download')}
                </Button>
                <Button
                  onClick={() => {
                    setCapturedImage(null);
                  }}
                  variant="outline"
                  size="sm"
                >
                  {t('clear')}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
