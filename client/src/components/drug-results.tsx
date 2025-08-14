
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Pill, AlertTriangle, Clock, Info } from 'lucide-react';
import { useLanguage } from '@/contexts/language-context';

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

interface DrugResultsProps {
  results: {
    medications?: Medication[];
    message?: string;
    success?: boolean;
  };
}

const DrugResults: React.FC<DrugResultsProps> = ({ results }) => {
  const { t, language } = useLanguage();

  if (!results?.success || !results?.medications?.length) {
    return (
      <Card className="mb-4 border-orange-200">
        <CardContent className="p-4 text-center">
          <AlertTriangle className="w-12 h-12 text-orange-500 mx-auto mb-3" />
          <h3 className="font-semibold text-gray-800 mb-2">
            {t('noMedicationsFound') || 'No medications found'}
          </h3>
          <p className="text-sm text-gray-600">
            {results?.message || t('tryDifferentSearch') || 'Try a different search term or take a clearer photo.'}
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-800">
          {t('searchResults') || 'Search Results'}
        </h2>
        <Badge variant="secondary">
          {results.medications.length} {t('found') || 'found'}
        </Badge>
      </div>

      {results.medications.map((medication) => (
        <Card key={medication.id} className="shadow-md hover:shadow-lg transition-shadow">
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Pill className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <CardTitle className="text-lg text-gray-800">
                    {language === 'vi' && medication.nameVi ? medication.nameVi : medication.name}
                  </CardTitle>
                  {(medication.genericName || medication.genericNameVi) && (
                    <p className="text-sm text-gray-600 mt-1">
                      {t('generic') || 'Generic'}: {' '}
                      {language === 'vi' && medication.genericNameVi 
                        ? medication.genericNameVi 
                        : medication.genericName}
                    </p>
                  )}
                </div>
              </div>
              {(medication.category || medication.categoryVi) && (
                <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                  {language === 'vi' && medication.categoryVi 
                    ? medication.categoryVi 
                    : medication.category}
                </Badge>
              )}
            </div>
          </CardHeader>

          <CardContent className="space-y-4">
            {/* Primary Use */}
            {(medication.primaryUse || medication.primaryUseVi) && (
              <div className="flex items-start space-x-3">
                <Info className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-medium text-sm text-gray-700">
                    {t('primaryUse') || 'Primary Use'}
                  </p>
                  <p className="text-sm text-gray-600">
                    {language === 'vi' && medication.primaryUseVi 
                      ? medication.primaryUseVi 
                      : medication.primaryUse}
                  </p>
                </div>
              </div>
            )}

            {/* Dosage Information */}
            {(medication.adultDosage || medication.adultDosageVi) && (
              <div className="flex items-start space-x-3">
                <Clock className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-medium text-sm text-gray-700">
                    {t('adultDosage') || 'Adult Dosage'}
                  </p>
                  <p className="text-sm text-gray-600">
                    {language === 'vi' && medication.adultDosageVi 
                      ? medication.adultDosageVi 
                      : medication.adultDosage}
                  </p>
                  {(medication.maxDosage || medication.maxDosageVi) && (
                    <p className="text-xs text-gray-500 mt-1">
                      {t('maxDosage') || 'Max'}: {' '}
                      {language === 'vi' && medication.maxDosageVi 
                        ? medication.maxDosageVi 
                        : medication.maxDosage}
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Warnings */}
            {((medication.warnings && medication.warnings.length > 0) || 
              (medication.warningsVi && medication.warningsVi.length > 0)) && (
              <div className="flex items-start space-x-3">
                <AlertTriangle className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-medium text-sm text-gray-700 mb-2">
                    {t('warnings') || 'Warnings'}
                  </p>
                  <ul className="space-y-1">
                    {(language === 'vi' && medication.warningsVi 
                      ? medication.warningsVi 
                      : medication.warnings || []
                    ).map((warning, index) => (
                      <li key={index} className="text-sm text-red-600 flex items-start">
                        <span className="w-1 h-1 bg-red-600 rounded-full mt-2 mr-2 flex-shrink-0"></span>
                        {warning}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}

            {/* Disclaimer */}
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mt-4">
              <p className="text-xs text-yellow-800">
                <strong>{t('disclaimer') || 'Disclaimer'}:</strong> {' '}
                {t('consultDoctor') || 'Always consult with a healthcare professional before taking any medication. This information is for educational purposes only.'}
              </p>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default DrugResults;
