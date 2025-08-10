import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import BottomNavigation from "@/components/bottom-navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Clock, Camera, Edit, Search } from "lucide-react";
import { useLanguage } from "@/contexts/language-context";
import { useState } from "react";
import type { SearchHistory, Medication } from "@shared/schema";

interface EnrichedSearchHistory extends SearchHistory {
  medication?: Medication | null;
}

export default function History() {
  const [, setLocation] = useLocation();
  const { t, language } = useLanguage();
  const [searchQuery, setSearchQuery] = useState("");

  const { data: history, isLoading, error } = useQuery<EnrichedSearchHistory[]>({
    queryKey: ["/api/search-history"],
  });

  const filteredHistory = history?.filter(item => 
    item.searchQuery?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.medication?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.medication?.nameVi?.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  if (isLoading) {
    return (
      <div className="max-w-md mx-auto bg-white min-h-screen shadow-lg">
        {/* Header */}
        <header className="bg-primary text-white p-4 shadow-md">
          <div className="flex items-center space-x-3">
            <Button
              variant="ghost"
              size="sm"
              className="text-white hover:bg-medical-700 p-2"
              onClick={() => setLocation("/")}
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <h1 className="text-xl font-medium">{t("searchHistory")}</h1>
          </div>
        </header>

        {/* Loading State */}
        <div className="flex-1 p-4">
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse">
                <div className="bg-gray-200 rounded-lg h-24"></div>
              </div>
            ))}
          </div>
        </div>

        <BottomNavigation />
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-md mx-auto bg-white min-h-screen shadow-lg">
        {/* Header */}
        <header className="bg-primary text-white p-4 shadow-md">
          <div className="flex items-center space-x-3">
            <Button
              variant="ghost"
              size="sm"
              className="text-white hover:bg-medical-700 p-2"
              onClick={() => setLocation("/")}
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <h1 className="text-xl font-medium">{t("searchHistory")}</h1>
          </div>
        </header>

        {/* Error State */}
        <div className="flex-1 p-4 flex items-center justify-center">
          <Card className="w-full">
            <CardContent className="pt-6 text-center">
              <div className="text-red-500 mb-4">
                <i className="fas fa-exclamation-triangle text-3xl"></i>
              </div>
              <h3 className="font-medium text-gray-800 mb-2">{t("failedToLoadHistory")}</h3>
              <p className="text-sm text-gray-600">
                {t("unableToRetrieveHistory")}
              </p>
            </CardContent>
          </Card>
        </div>

        <BottomNavigation />
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto bg-white min-h-screen shadow-lg">
      {/* Header */}
      <header className="bg-primary text-white p-4 shadow-md">
        <div className="flex items-center space-x-3">
          <Button
            variant="ghost"
            size="sm"
            className="text-white hover:bg-medical-700 p-2"
            onClick={() => setLocation("/")}
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-xl font-medium">{t("searchHistory")}</h1>
        </div>
      </header>

      {/* Search */}
      <div className="p-4 border-b">
        <div className="relative">
          <Input
            type="text"
            placeholder={t("searchHistory") || "Search history..."}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pr-10"
          />
          <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
        </div>
      </div>

      {/* History Content */}
      <div className="flex-1 p-4 pb-20">
        {!filteredHistory || filteredHistory.length === 0 ? (
          <div className="flex items-center justify-center min-h-[50vh]">
            <Card className="w-full">
              <CardContent className="pt-6 text-center">
                <Clock className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="font-medium text-gray-800 mb-2">
                  {searchQuery ? t("noSearchResults") : t("noSearchHistory")}
                </h3>
                <p className="text-sm text-gray-600 mb-4">
                  {searchQuery ? t("tryDifferentKeywords") : t("noSearchHistoryDesc")}
                </p>
                <Button onClick={() => setLocation("/")}>
                  {t("startScanning")}
                </Button>
              </CardContent>
            </Card>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredHistory.map((item) => (
              <Card key={item.id} className="animate-fade-in hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        {item.searchMethod === "photo" ? (
                          <Camera className="w-4 h-4 text-primary" />
                        ) : (
                          <Edit className="w-4 h-4 text-primary" />
                        )}
                        <span className="text-xs text-gray-500 uppercase font-medium">
                          {item.searchMethod === "photo" ? t("photoScan") : t("manualSearch")}
                        </span>
                      </div>

                      {item.medication ? (
                        <div>
                          <h3 className="font-medium text-gray-800">
                            {language === "vi" && item.medication.nameVi ? item.medication.nameVi : item.medication.name}
                          </h3>
                          {(item.medication.genericName || item.medication.genericNameVi) && (
                            <p className="text-sm text-gray-600">
                              {t("generic")} {language === "vi" && item.medication.genericNameVi ? item.medication.genericNameVi : item.medication.genericName}
                            </p>
                          )}
                          {(item.medication.category || item.medication.categoryVi) && (
                            <span className="inline-block bg-medical-50 text-primary text-xs px-2 py-1 rounded-full mt-1">
                              {language === "vi" && item.medication.categoryVi ? item.medication.categoryVi : item.medication.category}
                            </span>
                          )}
                        </div>
                      ) : (
                        <div>
                          <h3 className="font-medium text-gray-800">{t("searchQuery")}</h3>
                          <p className="text-sm text-gray-600">"{item.searchQuery}"</p>
                          <span className="inline-block bg-red-50 text-red-600 text-xs px-2 py-1 rounded-full mt-1">
                            {t("notFound")}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center text-xs text-gray-500">
                      <Clock className="w-3 h-3 mr-1" />
                      {item.createdAt ? new Date(item.createdAt).toLocaleDateString() : "Unknown"}
                    </div>

                    {item.medication && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-xs"
                        onClick={() => {
                          // Navigate back to home with the medication data
                          setLocation("/");
                        }}
                      >
                        {t("viewDetails")}
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      <BottomNavigation />
    </div>
  );
}