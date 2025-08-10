import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Camera, X, Zap, RotateCcw, Flashlight, Maximize2, Download, Search, CameraOff } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/contexts/language-context";
import { Alert, AlertDescription } from "@/components/ui/alert";

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
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const { t } = useLanguage();
  const { toast } = useToast();

  useEffect(() => {
    if (isActive) {
      startCamera();
    }
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }
    };
  }, [facingMode]);

  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }
    };
  }, []);

  const startCamera = async () => {
    try {
      setError(null);

      // Stop any existing stream first
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }

      // Enhanced video constraints for better quality
      const constraints = {
        video: {
          facingMode: facingMode,
          width: { min: 640, ideal: 1920, max: 3840 },
          height: { min: 480, ideal: 1080, max: 2160 },
          frameRate: { ideal: 30 },
          focusMode: "continuous",
          whiteBalanceMode: "continuous",
          exposureMode: "continuous"
        }
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);

      // Apply flash/torch if supported and enabled
      if (flashEnabled && 'ImageCapture' in window) {
        const track = stream.getVideoTracks()[0];
        const imageCapture = new ImageCapture(track);
        const capabilities = imageCapture.track.getCapabilities();

        if (capabilities.torch) {
          await track.applyConstraints({
            advanced: [{ torch: true }]
          });
        }
      }

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        
        // Wait for video to be ready before setting active
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
    setIsActive(false);
    setError(null);
    setCapturedImage(null);
    setIsFullscreen(false);

    toast({
      title: t("cameraStopped"),
      description: t("cameraDeactivated"),
    });
  };

  const switchCamera = async () => {
    if (!isActive) return;
    
    const newFacingMode = facingMode === "user" ? "environment" : "user";
    
    // Stop current camera
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
    if ('ImageCapture' in window) {
      const imageCapture = new ImageCapture(track);
      const capabilities = imageCapture.track.getCapabilities();

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
    }
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

    try {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');

      if (!context) throw new Error('Canvas context not available');

      // Set canvas dimensions to match video with high resolution
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      // Enhanced image processing for better OCR
      context.imageSmoothingEnabled = true;
      context.imageSmoothingQuality = 'high';

      // Draw the video frame to canvas
      context.drawImage(video, 0, 0, canvas.width, canvas.height);

      // Apply image enhancement for better text recognition
      const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;

      // Simple contrast and brightness adjustment
      for (let i = 0; i < data.length; i += 4) {
        // Increase contrast slightly
        const contrast = 1.2;
        const brightness = 10;

        data[i] = Math.min(255, Math.max(0, contrast * data[i] + brightness));     // Red
        data[i + 1] = Math.min(255, Math.max(0, contrast * data[i + 1] + brightness)); // Green
        data[i + 2] = Math.min(255, Math.max(0, contrast * data[i + 2] + brightness)); // Blue
      }

      context.putImageData(imageData, 0, 0);

      // Convert to high-quality base64 image data
      const capturedImageData = canvas.toDataURL('image/jpeg', 0.95);
      setCapturedImage(capturedImageData);

      // Convert captured image to a File object for onPhotoCapture
      const blob = await new Promise<Blob | null>(resolve => canvas.toBlob(resolve, 'image/jpeg', 0.95));
      if (blob) {
        const file = new File([blob], "medication-photo.jpg", { type: "image/jpeg" });
        onPhotoCapture(file);
      }

      toast({
        title: t("imageCaptured"),
        description: t("imageReadyForAnalysis"),
      });

      console.log('Image captured successfully with enhanced processing');

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
              className="w-full h-full object-cover"
            />
            <canvas
              ref={canvasRef}
              className="hidden"
            />

            {/* Camera Controls Overlay */}
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
                onClick={captureImage}
                disabled={isProcessing || isLoading}
                className="bg-white text-black hover:bg-gray-200 px-6 py-3 text-lg"
                size="lg"
              >
                <Camera className="w-5 h-5 mr-2" />
                {isProcessing ? t('processing') : t('capture')}
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

            {/* Focus indicator */}
            <div className="absolute inset-0 pointer-events-none">
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 border-2 border-white/50 rounded-lg w-48 h-32">
                <div className="absolute top-0 left-0 w-6 h-6 border-t-2 border-l-2 border-green-400"></div>
                <div className="absolute top-0 right-0 w-6 h-6 border-t-2 border-r-2 border-green-400"></div>
                <div className="absolute bottom-0 left-0 w-6 h-6 border-b-2 border-l-2 border-green-400"></div>
                <div className="absolute bottom-0 right-0 w-6 h-6 border-b-2 border-r-2 border-green-400"></div>
              </div>
              <div className="absolute bottom-20 left-1/2 transform -translate-x-1/2 text-white text-sm bg-black/50 px-3 py-1 rounded">
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

      {/* Captured Image Preview */}
      {capturedImage && (
        <div className="mt-4 p-4 border rounded-lg bg-gray-50">
          <h3 className="font-medium text-gray-800 mb-2 flex items-center">
            <Search className="w-4 h-4 text-accent mr-2" />
            {t('capturedImage')}
          </h3>
          <div className="flex items-start space-x-4">
            <img
              src={capturedImage}
              alt="Captured medication"
              className="w-32 h-24 object-cover rounded border"
            />
            <div className="flex-1 space-y-2">
              <p className="text-sm text-gray-600">{t('imageReadyForAnalysis')}</p>
              <div className="flex space-x-2">
                <Button
                  onClick={downloadImage}
                  variant="outline"
                  size="sm"
                >
                  <Download className="w-4 h-4 mr-1" />
                  {t('download')}
                </Button>
                <Button
                  onClick={() => {
                    setCapturedImage(null); // Clear the preview
                    // Optionally, stop and restart camera or just allow re-capture
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