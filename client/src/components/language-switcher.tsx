import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/language-context";
import { Globe } from "lucide-react";

export default function LanguageSwitcher() {
  const { language, setLanguage } = useLanguage();

  const toggleLanguage = () => {
    setLanguage(language === "en" ? "vi" : "en");
  };

  return (
    <Button
      variant="ghost"
      size="sm"
      className="text-white hover:bg-white hover:bg-opacity-20 p-2 rounded-full"
      onClick={toggleLanguage}
    >
      <Globe className="w-4 h-4 mr-1" />
      <span className="text-xs font-medium">
        {language === "en" ? "VI" : "EN"}
      </span>
    </Button>
  );
}