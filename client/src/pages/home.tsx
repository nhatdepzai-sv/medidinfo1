
import { useState } from "react";
import { useLocation } from "wouter";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Camera, Search, Clock, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/contexts/language-context";
import CameraInterface from "@/components/camera-interface";
import DrugResults from "@/components/drug-results";
import BottomNavigation from "@/components/bottom-navigation";
import LanguageSwitcher from "@/components/language-switcher";

interface Medication {
  id: string;
  name: string;
  nameVi?: string;
  genericName?: string;
  genericNameVi?: string;
  category?: string;
  categoryVi?: string;
  primaryUse?: string;
  primaryUseVi?: string;
  adultDosage?: string;
  adultDosageVi?: string;
  maxDosage?: string;
  maxDosageVi?: string;
  warnings?: string[];
  warningsVi?: string[];
}

interface SearchHistoryItem {
  id: string;
  searchQuery?: string;
  searchMethod: string;
  createdAt: string;
  medication?: Medication | null;
}

async function apiRequest(method: string, url: string, body?: any) {
  const options: RequestInit = {
    method,
    headers: {
      'Content-Type': 'application/json',
    },
  };

  if (body) {
    options.body = JSON.stringify(body);
  }

  const response = await fetch(url, options);
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Network error' }));
    throw new Error(error.message || `HTTP ${response.status}`);
  }
  
  return response;
}

export default function Home() {
  const [, setLocation] = useLocation();
  const { t, language } = useLanguage();
  const { toast } = useToast();
  
  const [showCamera, setShowCamera] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentMedication, setCurrentMedication] = useState<Medication | null>(null);
  const [processingStage, setProcessingStage] = useState("");

  // Fetch recent search history
  const { data: recentSearches } = useQuery<SearchHistoryItem[]>({
    queryKey: ["/api/search-history"],
    select: (data) => data?.slice(0, 5) || []
  });

  // Manual search mutation
  const searchMutation = useMutation({
    mutationFn: async (query: string) => {
      const response = await apiRequest("POST", "/api/search-drug", { query });
      return response.json();
    },
    onSuccess: (data: Medication) => {
      setCurrentMedication(data);
      const medicationName = (language === "vi" && data.nameVi) ? data.nameVi : data.name;
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
      setProcessingStage("");
      
      const medicationName = (language === "vi" && data.nameVi) ? data.nameVi : data.name;
      toast({
        title: t("medicationFound"),
        description: t("informationLoaded").replace("{name}", medicationName),
      });
    },
    onError: (error) => {
      setShowCamera(false);
      setProcessingStage("");
      toast({
        variant: "destructive",
        title: t("searchFailed"),
        description: error.message || t("noMedicationFound"),
      });
    },
  });

  const handleCameraCapture = (file: File, extractedText?: string) => {
    setProcessingStage(t("analyzingImage") || "Analyzing image...");
    photoMutation.mutate(file);
  };

  const handleManualSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim().length < 2) {
      toast({
        variant: "destructive", 
        title: t("error"),
        description: "Please enter at least 2 characters to search.",
      });
      return;
    }
    searchMutation.mutate(searchQuery.trim());
  };

  const handleHistoryItemClick = (item: SearchHistoryItem) => {
    if (item.medication) {
      setCurrentMedication(item.medication);
    } else if (item.searchQuery) {
      setSearchQuery(item.searchQuery);
      searchMutation.mutate(item.searchQuery);
    }
  };

  if (showCamera) {
    return (
      <CameraInterface
        onCapture={handleCameraCapture}
        onClose={() => {
          setShowCamera(false);
          setProcessingStage("");
        }}
        isProcessing={photoMutation.isPending}
        processingStage={processingStage}
      />
    );
  }

  if (currentMedication) {
    return (
      <DrugResults
        medication={currentMedication}
        onBack={() => setCurrentMedication(null)}
        onNewSearch={() => {
          setCurrentMedication(null);
          setSearchQuery("");
        }}
      />
    );
  }

  return (
    <div className="max-w-md mx-auto bg-white min-h-screen shadow-lg">
      {/* Header */}
      <header className="bg-primary text-white p-4 shadow-md">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-medium">{t("appName")}</h1>
            <p className="text-primary-foreground/80 text-sm">
              {t("welcomeMessage")}
            </p>
          </div>
          <LanguageSwitcher />
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 p-4 pb-20">
        {/* Search Section */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-lg">{t("searchManually")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <form onSubmit={handleManualSearch} className="space-y-3">
              <Input
                type="text"
                placeholder={t("searchPlaceholder")}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full"
              />
              <Button 
                type="submit" 
                className="w-full"
                disabled={searchMutation.isPending || searchQuery.trim().length < 2}
              >
                {searchMutation.isPending ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                    {t("searching")}
                  </>
                ) : (
                  <>
                    <Search className="w-4 h-4 mr-2" />
                    {t("search")}
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Camera Section */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <Button 
              onClick={() => setShowCamera(true)}
              className="w-full h-12"
              size="lg"
            >
              <Camera className="w-5 h-5 mr-2" />
              {t("startScanning")}
            </Button>
            <p className="text-sm text-muted-foreground text-center mt-2">
              {t("ensureGoodLighting")}
            </p>
          </CardContent>
        </Card>

        {/* Recent Searches */}
        {recentSearches && recentSearches.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center">
                <Clock className="w-5 h-5 mr-2" />
                {t("recentSearches")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {recentSearches.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => handleHistoryItemClick(item)}
                    className="p-3 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        {item.medication ? (
                          <div>
                            <p className="font-medium text-sm">
                              {(language === "vi" && item.medication.nameVi) 
                                ? item.medication.nameVi 
                                : item.medication.name}
                            </p>
                            {(item.medication.genericName || item.medication.genericNameVi) && (
                              <p className="text-xs text-gray-500">
                                {(language === "vi" && item.medication.genericNameVi)
                                  ? item.medication.genericNameVi
                                  : item.medication.genericName}
                              </p>
                            )}
                          </div>
                        ) : (
                          <p className="text-sm text-gray-600">
                            {item.searchQuery || "Unknown search"}
                          </p>
                        )}
                      </div>
                      <div className="text-xs text-gray-400">
                        {item.searchMethod === "photo" ? (
                          <Camera className="w-4 h-4" />
                        ) : (
                          <Search className="w-4 h-4" />
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Welcome message for first-time users */}
        {(!recentSearches || recentSearches.length === 0) && (
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              {t("welcomeMessage")}
            </AlertDescription>
          </Alert>
        )}
      </div>

      <BottomNavigation />
    </div>
  );
}
