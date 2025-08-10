import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Share2, Bookmark, Target, PillBottle, AlertTriangle, Languages, Heart } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/contexts/language-context";
import type { Medication } from "@shared/schema";

interface DrugResultsProps {
  medication: Medication;
}

export default function DrugResults({ medication }: DrugResultsProps) {
  const { toast } = useToast();
  const { language, t } = useLanguage();

  const handleSave = () => {
    // In a real app, this would save to user favorites/history
    const medicationName = language === "vi" && medication.nameVi ? medication.nameVi : medication.name;
    toast({
      title: t("saved"),
      description: t("savedToFavorites").replace("{name}", medicationName),
    });
  };

  const handleShare = async () => {
    const medicationName = language === "vi" && medication.nameVi ? medication.nameVi : medication.name;
    const primaryUse = language === "vi" && medication.primaryUseVi ? medication.primaryUseVi : medication.primaryUse;
    const dosage = language === "vi" && medication.adultDosageVi ? medication.adultDosageVi : medication.adultDosage;

    const shareData = {
      title: `${medicationName} - Medication Information`,
      text: `${medicationName}: ${primaryUse}`,
      url: window.location.href,
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        // Fallback to clipboard
        await navigator.clipboard.writeText(
          `${medicationName}\n\n${t("primaryUse")}: ${primaryUse}\n\n${t("typicalDosage")}: ${dosage || 'Consult healthcare provider'}`
        );
        toast({
          title: t("copiedToClipboard"),
          description: t("medicationInfoCopied"),
        });
      }
    } catch (error) {
      console.error("Share failed:", error);
      toast({
        variant: "destructive",
        title: t("shareFailed"),
        description: t("unableToShareInfo"),
      });
    }
  };

  const medicationName = language === "vi" && medication.nameVi ? medication.nameVi : medication.name;
  const genericName = language === "vi" && medication.genericNameVi ? medication.genericNameVi : medication.genericName;
  const category = language === "vi" && medication.categoryVi ? medication.categoryVi : medication.category;
  const primaryUse = language === "vi" && medication.primaryUseVi ? medication.primaryUseVi : medication.primaryUse;
  const adultDosage = language === "vi" && medication.adultDosageVi ? medication.adultDosageVi : medication.adultDosage;
  const maxDosage = language === "vi" && medication.maxDosageVi ? medication.maxDosageVi : medication.maxDosage;
  const warnings = language === "vi" && medication.warningsVi ? medication.warningsVi : medication.warnings;

  return (
    <div className="animate-slide-up">
      <Card className="shadow-sm overflow-hidden">
        {/* Drug header */}
        <div className="medical-gradient text-white p-4">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h2 className="text-lg font-medium mb-1">{medicationName}</h2>
              {genericName && (
                <p className="text-blue-100 text-sm">{t("generic")} {genericName}</p>
              )}
            </div>
            <div className="ml-3">
              {category && (
                <span className="bg-white bg-opacity-20 text-xs px-2 py-1 rounded-full">
                  {category}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Drug details */}
        <CardContent className="p-4 space-y-4">
          {/* Primary use */}
          <div>
            <h3 className="font-medium text-gray-800 mb-2 flex items-center">
              <Target className="w-4 h-4 text-secondary mr-2" />
              {t("primaryUse")}
            </h3>
            <p className="text-gray-700 text-sm leading-relaxed pl-6">
              {primaryUse}
            </p>
          </div>

          {/* Dosage information */}
          {(adultDosage || maxDosage) && (
            <div className="border-t border-gray-100 pt-4">
              <h3 className="font-medium text-gray-800 mb-2 flex items-center">
                <PillBottle className="w-4 h-4 text-accent mr-2" />
                {t("typicalDosage")}
              </h3>
              <div className="pl-6 space-y-2">
                {adultDosage && (
                  <div className="flex justify-between items-start text-sm">
                    <span className="text-gray-600">{t("adults")}</span>
                    <span className="font-medium text-gray-800 text-right flex-1 ml-4">
                      {adultDosage}
                    </span>
                  </div>
                )}
                {maxDosage && (
                  <div className="flex justify-between items-start text-sm">
                    <span className="text-gray-600">{t("maxDaily")}</span>
                    <span className="font-medium text-gray-800 text-right flex-1 ml-4">
                      {maxDosage}
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Important warnings */}
          {warnings && warnings.length > 0 && (
            <div className="border-t border-gray-100 pt-4">
              <h3 className="font-medium text-red-600 mb-2 flex items-center">
                <AlertTriangle className="w-4 h-4 text-red-500 mr-2" />
                {t("importantWarnings")}
              </h3>
              <ul className="pl-6 space-y-1 text-sm text-gray-700">
                {warnings.map((warning, index) => (
                  <li key={index} className="flex items-start">
                    <span className="text-red-500 mr-2 mt-1 text-xs">•</span>
                    <span>{warning}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Action buttons */}
          <div className="flex gap-2 pt-4 border-t">
            <Button onClick={handleSave} className="flex-1">
              <Heart className="w-4 h-4 mr-2" />
              {t("save")}
            </Button>
            <Button onClick={handleShare} variant="outline" className="flex-1">
              <Share2 className="w-4 h-4 mr-2" />
              {t("share")}
            </Button>
            <Button
              onClick={() => {
                const textToTranslate = `${medicationName}\n\n${primaryUse}\n\n${adultDosage}`;
                window.open(`/translator?text=${encodeURIComponent(textToTranslate)}`, '_blank');
              }}
              variant="outline"
              className="flex-1"
            >
              <Languages className="w-4 h-4 mr-2" />
              Translate
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Disclaimer */}
      <div className="mt-4 bg-amber-50 border border-amber-200 rounded-lg p-3">
        <p className="text-xs text-amber-800 leading-relaxed">
          <AlertTriangle className="w-3 h-3 inline mr-1" />
          <strong>{t("medicalDisclaimer")}</strong> {t("disclaimerText")}
        </p>
      </div>
    </div>
  );
}