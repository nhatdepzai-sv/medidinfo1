
import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import Translator from "@/components/translator";
import { useLanguage } from "@/contexts/language-context";
import BottomNavigation from "@/components/bottom-navigation";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

export default function TranslatorPage() {
  const [location, setLocation] = useLocation();
  const { t } = useLanguage();
  const [initialText, setInitialText] = useState("");

  useEffect(() => {
    // Parse URL parameters manually since we're using wouter
    const urlParams = new URLSearchParams(window.location.search);
    const text = urlParams.get("text");
    if (text) {
      setInitialText(decodeURIComponent(text));
    }
  }, [location]);

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
          <h1 className="text-xl font-medium">{t("translator")}</h1>
        </div>
      </header>

      {/* Content */}
      <div className="flex-1 p-4 pb-20">
        <div className="text-center mb-6">
          <p className="text-gray-600 text-sm">
            {t("translateMedicalInfo")}
          </p>
        </div>
        
        <Translator initialText={initialText} />
      </div>

      <BottomNavigation />
    </div>
  );
}
