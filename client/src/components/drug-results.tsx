
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Pill, AlertTriangle, Info } from 'lucide-react';
import { useLanguage } from '@/contexts/language-context';

interface DrugResult {
  id: string;
  name: string;
  nameVi?: string;
  genericName: string;
  genericNameVi?: string;
  category: string;
  categoryVi?: string;
  primaryUse: string;
  primaryUseVi?: string;
  adultDosage: string;
  adultDosageVi?: string;
  maxDosage?: string;
  maxDosageVi?: string;
  warnings: string[];
  warningsVi?: string[];
}

interface DrugResultsProps {
  results: DrugResult | DrugResult[] | null;
}

export default function DrugResults({ results }: DrugResultsProps) {
  const { language, t } = useLanguage();

  if (!results) {
    return (
      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          {t('noResults') || 'No results found. Try a different search term.'}
        </AlertDescription>
      </Alert>
    );
  }

  const medications = Array.isArray(results) ? results : [results];

  return (
    <div className="space-y-4">
      {medications.map((medication) => (
        <Card key={medication.id} className="border-l-4 border-l-blue-500">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Pill className="w-5 h-5 text-blue-600" />
                {language === 'vi' && medication.nameVi ? medication.nameVi : medication.name}
              </CardTitle>
              <Badge variant="secondary">
                {language === 'vi' && medication.categoryVi ? medication.categoryVi : medication.category}
              </Badge>
            </div>
            {medication.genericName && (
              <p className="text-sm text-gray-600">
                <span className="font-medium">{t('generic') || 'Generic'}:</span>{' '}
                {language === 'vi' && medication.genericNameVi ? medication.genericNameVi : medication.genericName}
              </p>
            )}
          </CardHeader>

          <CardContent className="space-y-4">
            {/* Primary Use */}
            <div>
              <h4 className="font-medium text-sm text-gray-700 mb-1">
                {t('primaryUse') || 'Primary Use'}
              </h4>
              <p className="text-sm">
                {language === 'vi' && medication.primaryUseVi ? medication.primaryUseVi : medication.primaryUse}
              </p>
            </div>

            {/* Dosage Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h4 className="font-medium text-sm text-gray-700 mb-1">
                  {t('adultDosage') || 'Adult Dosage'}
                </h4>
                <p className="text-sm font-mono bg-gray-50 p-2 rounded">
                  {language === 'vi' && medication.adultDosageVi ? medication.adultDosageVi : medication.adultDosage}
                </p>
              </div>

              {medication.maxDosage && (
                <div>
                  <h4 className="font-medium text-sm text-gray-700 mb-1">
                    {t('maxDosage') || 'Maximum Dosage'}
                  </h4>
                  <p className="text-sm font-mono bg-gray-50 p-2 rounded">
                    {language === 'vi' && medication.maxDosageVi ? medication.maxDosageVi : medication.maxDosage}
                  </p>
                </div>
              )}
            </div>

            {/* Warnings */}
            {medication.warnings && medication.warnings.length > 0 && (
              <Alert className="border-orange-200 bg-orange-50">
                <AlertTriangle className="h-4 w-4 text-orange-600" />
                <AlertDescription>
                  <div className="font-medium text-orange-800 mb-2">
                    {t('warnings') || 'Important Warnings'}
                  </div>
                  <ul className="space-y-1 text-sm text-orange-700">
                    {(language === 'vi' && medication.warningsVi ? medication.warningsVi : medication.warnings).map((warning, index) => (
                      <li key={index} className="flex items-start gap-1">
                        <span className="text-orange-600 mt-1">•</span>
                        <span>{warning}</span>
                      </li>
                    ))}
                  </ul>
                </AlertDescription>
              </Alert>
            )}

            {/* Disclaimer */}
            <Alert className="border-blue-200 bg-blue-50">
              <Info className="h-4 w-4 text-blue-600" />
              <AlertDescription className="text-xs text-blue-700">
                {t('disclaimer') || 'This information is for educational purposes only. Always consult with a healthcare professional before taking any medication.'}
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
