
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Languages, Copy, ArrowUpDown } from "lucide-react";
import { useLanguage } from "@/contexts/language-context";
import { useToast } from "@/hooks/use-toast";

interface TranslatorProps {
  initialText?: string;
}

export default function Translator({ initialText = "" }: TranslatorProps) {
  const [sourceText, setSourceText] = useState(initialText);
  const [translatedText, setTranslatedText] = useState("");
  const [sourceLang, setSourceLang] = useState("en");
  const [targetLang, setTargetLang] = useState("vi");
  const [isTranslating, setIsTranslating] = useState(false);
  const { t } = useLanguage();
  const { toast } = useToast();

  const translateText = async () => {
    if (!sourceText.trim()) return;
    
    setIsTranslating(true);
    try {
      const response = await fetch("/api/translate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: sourceText,
          from: sourceLang,
          to: targetLang
        })
      });
      
      const data = await response.json();
      if (data.success) {
        setTranslatedText(data.translatedText);
      } else {
        throw new Error(data.error);
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Translation Failed",
        description: "Could not translate text. Please try again.",
      });
    } finally {
      setIsTranslating(false);
    }
  };

  const swapLanguages = () => {
    setSourceLang(targetLang);
    setTargetLang(sourceLang);
    setSourceText(translatedText);
    setTranslatedText(sourceText);
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast({
        title: t("copiedToClipboard"),
        description: "Text copied successfully",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Copy failed",
        description: "Could not copy text to clipboard",
      });
    }
  };

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Languages className="w-5 h-5" />
          Medical Text Translator
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-2">
          <Select value={sourceLang} onValueChange={setSourceLang}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="en">English</SelectItem>
              <SelectItem value="vi">Vietnamese</SelectItem>
            </SelectContent>
          </Select>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={swapLanguages}
            className="px-2"
          >
            <ArrowUpDown className="w-4 h-4" />
          </Button>
          
          <Select value={targetLang} onValueChange={setTargetLang}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="en">English</SelectItem>
              <SelectItem value="vi">Vietnamese</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">Source Text</label>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => copyToClipboard(sourceText)}
                disabled={!sourceText}
              >
                <Copy className="w-4 h-4" />
              </Button>
            </div>
            <Textarea
              value={sourceText}
              onChange={(e) => setSourceText(e.target.value)}
              placeholder="Enter text to translate..."
              className="min-h-32 resize-none"
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">Translation</label>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => copyToClipboard(translatedText)}
                disabled={!translatedText}
              >
                <Copy className="w-4 h-4" />
              </Button>
            </div>
            <Textarea
              value={translatedText}
              readOnly
              placeholder="Translation will appear here..."
              className="min-h-32 resize-none bg-gray-50"
            />
          </div>
        </div>

        <Button
          onClick={translateText}
          disabled={!sourceText.trim() || isTranslating}
          className="w-full"
        >
          {isTranslating ? "Translating..." : "Translate"}
        </Button>
      </CardContent>
    </Card>
  );
}
