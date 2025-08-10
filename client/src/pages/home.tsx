import { useState } from "react";
import { Camera } from "lucide-react";
import CameraInterface from "@/components/camera-interface";
import DrugResults from "@/components/drug-results";
import BottomNavigation from "@/components/bottom-navigation";
import LanguageSwitcher from "@/components/language-switcher";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/contexts/language-context";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import type { Medication } from "@shared/schema";

export default function Home() {
  const [searchQuery, setSearchQuery] = useState("");
  const [currentMedication, setCurrentMedication] = useState<Medication | null>(null);
  const [showCamera, setShowCamera] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const { t } = useLanguage();

  // Manual search mutation
  const searchMutation = useMutation({
    mutationFn: async (query: string) => {
      const response = await apiRequest("POST", "/api/search-drug", { query });
      return response.json();
    },
    onSuccess: (data: Medication) => {
      setCurrentMedication(data);
      const medicationName = data.nameVi || data.name;
      toast({
        title: t("medicationFound"),
        description: t("informationLoaded").replace("{name}", medicationName),
      });
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: t("searchFailed"),
        description: error.message || t("medicationNotFound"),
      });
    },
  });

  // Photo identification mutation
  const photoMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append("image", file);
      
      const response = await fetch("/api/identify-drug", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to identify medication");
      }

      return response.json();
    },
    onSuccess: (data: Medication) => {
      setCurrentMedication(data);
      setShowCamera(false);
      const medicationName = data.nameVi || data.name;
      toast({
        title: t("medicationIdentified"),
        description: t("successfullyIdentified").replace("{name}", medicationName),
      });
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: t("identificationFailed"),
        description: error.message || t("couldNotIdentifyFromPhoto"),
      });
    },
  });

  const handleManualSearch = () => {
    if (!searchQuery.trim()) {
      toast({
        variant: "destructive",
        title: t("searchRequired"),
        description: t("enterMedicationToSearch"),
      });
      return;
    }
    searchMutation.mutate(searchQuery.trim());
  };

  const handlePhotoCapture = (file: File) => {
    photoMutation.mutate(file);
  };

  const handleQuickCamera = () => {
    setShowCamera(true);
  };

  const isLoadingState = searchMutation.isPending || photoMutation.isPending || isLoading;

  if (showCamera) {
    return (
      <CameraInterface
        onPhotoCapture={handlePhotoCapture}
        onCancel={() => setShowCamera(false)}
        isLoading={photoMutation.isPending}
      />
    );
  }

  return (
    <div className="max-w-md mx-auto bg-white min-h-screen shadow-lg relative overflow-hidden">
      {/* Header */}
      <header className="bg-primary text-white p-4 shadow-md">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <i className="fas fa-pills text-2xl"></i>
            <h1 className="text-xl font-medium">{t("appName")}</h1>
          </div>
          <LanguageSwitcher />
        </div>
      </header>

      {/* Main Interface */}
      <div className="flex-1 p-4 pb-20">
        {/* Instruction Card */}
        <div className="bg-medical-50 border border-medical-100 rounded-lg p-4 mb-6 animate-fade-in">
          <div className="flex items-start space-x-3">
            <i className="fas fa-info-circle text-medical-600 text-lg mt-1"></i>
            <div>
              <h3 className="font-medium text-gray-800 mb-1">{t("howToUse")}</h3>
              <p className="text-sm text-gray-600 leading-relaxed">
                {t("howToUseDesc")}
              </p>
            </div>
          </div>
        </div>

        {/* Camera Section */}
        <div className="mb-6">
          <div className="relative bg-gray-900 rounded-lg overflow-hidden aspect-[4/3] mb-4">
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center text-white">
                <Camera className="w-12 h-12 mb-3 mx-auto opacity-50" />
                <p className="text-sm opacity-75">{t("tapToCapture")}</p>
              </div>
            </div>
            
            {/* Camera viewfinder overlay */}
            <div className="absolute inset-0 pointer-events-none">
              <div className="w-full h-full relative">
                {/* Corner guides */}
                <div className="absolute top-4 left-4 w-6 h-6 border-l-2 border-t-2 border-white opacity-75"></div>
                <div className="absolute top-4 right-4 w-6 h-6 border-r-2 border-t-2 border-white opacity-75"></div>
                <div className="absolute bottom-4 left-4 w-6 h-6 border-l-2 border-b-2 border-white opacity-75"></div>
                <div className="absolute bottom-4 right-4 w-6 h-6 border-r-2 border-b-2 border-white opacity-75"></div>
                
                {/* Focus area indicator */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-48 h-32 border-2 border-dashed border-white opacity-50 rounded-lg flex items-center justify-center">
                    <span className="text-white text-xs bg-black bg-opacity-50 px-2 py-1 rounded">
                      {t("alignDrugBox")}
                    </span>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Clickable overlay */}
            <div 
              className="absolute inset-0 cursor-pointer"
              onClick={() => setShowCamera(true)}
            ></div>
          </div>

          {/* Camera controls */}
          <div className="flex items-center justify-center space-x-4">
            <button className="p-3 bg-gray-200 rounded-full hover:bg-gray-300 transition-colors">
              <i className="fas fa-bolt text-gray-600"></i>
            </button>
            
            {/* Main capture button */}
            <Button
              size="lg"
              className="w-16 h-16 rounded-full shadow-lg hover:bg-medical-700 transition-all duration-200 transform hover:scale-105 active:scale-95"
              onClick={() => setShowCamera(true)}
              disabled={isLoadingState}
            >
              <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center">
                <Camera className="w-6 h-6 text-primary" />
              </div>
            </Button>
            
            <button className="p-3 bg-gray-200 rounded-full hover:bg-gray-300 transition-colors">
              <i className="fas fa-sync-alt text-gray-600"></i>
            </button>
          </div>
        </div>

        {/* Manual Entry */}
        <div className="mb-6">
          <div className="flex items-center mb-3">
            <div className="flex-1 border-t border-gray-300"></div>
            <span className="px-4 text-sm text-gray-500 font-medium">{t("orEnterManually")}</span>
            <div className="flex-1 border-t border-gray-300"></div>
          </div>
          
          <div className="relative">
            <Input
              type="text"
              placeholder={t("enterMedicationName")}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  handleManualSearch();
                }
              }}
              className="pr-12"
              disabled={isLoadingState}
            />
            <Button
              size="sm"
              variant="ghost"
              className="absolute right-2 top-1/2 transform -translate-y-1/2 p-2 text-primary hover:bg-medical-50"
              onClick={handleManualSearch}
              disabled={isLoadingState || !searchQuery.trim()}
            >
              <i className="fas fa-search"></i>
            </Button>
          </div>
        </div>

        {/* Loading State */}
        {isLoadingState && (
          <div className="animate-fade-in">
            <div className="bg-white border border-gray-200 rounded-lg p-6 text-center shadow-sm">
              <div className="animate-spin w-8 h-8 border-3 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
              <h3 className="font-medium text-gray-800 mb-2">{t("processing")}</h3>
              <p className="text-sm text-gray-600">
                {photoMutation.isPending ? t("extractingText") : t("searchingFor")}
              </p>
            </div>
          </div>
        )}

        {/* Drug Information */}
        {currentMedication && !isLoadingState && (
          <DrugResults medication={currentMedication} />
        )}
      </div>

      {/* Bottom Navigation */}
      <BottomNavigation />

      {/* Floating Action Button */}
      <Button
        size="lg"
        className="fixed bottom-20 right-4 w-14 h-14 bg-secondary rounded-full shadow-lg hover:bg-green-600 transition-all duration-200 transform hover:scale-105 active:scale-95 z-10"
        onClick={handleQuickCamera}
        disabled={isLoadingState}
      >
        <Camera className="w-6 h-6 text-white" />
      </Button>
    </div>
  );
}
