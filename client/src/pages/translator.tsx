
import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import Translator from "@/components/translator";
import { useLanguage } from "@/contexts/language-context";

export default function TranslatorPage() {
  const [searchParams] = useSearchParams();
  const { t } = useLanguage();
  const [initialText, setInitialText] = useState("");

  useEffect(() => {
    const text = searchParams.get("text");
    if (text) {
      setInitialText(decodeURIComponent(text));
    }
  }, [searchParams]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="container mx-auto py-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Medical Text Translator
          </h1>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Translate medical information between English and Vietnamese to better understand medication details.
          </p>
        </div>
        
        <Translator initialText={initialText} />
      </div>
    </div>
  );
}
