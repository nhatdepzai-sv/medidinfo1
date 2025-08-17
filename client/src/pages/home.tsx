
import React, { useState, useCallback, useMemo } from 'react';
import { Search, Scan, History, User, Pill, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import CameraInterface from '@/components/camera-interface';
import DrugResults from '@/components/drug-results';
import BottomNavigation from '@/components/bottom-navigation';
import { useLanguage } from '@/contexts/language-context';
import { useLocation } from 'wouter';
import LanguageSwitcher from '../components/language-switcher';

// Memoized quick actions to prevent re-renders
const QuickActions = React.memo(({ onScanClick, onSearchClick, onHistoryClick, onPillIdClick }: {
  onScanClick: () => void;
  onSearchClick: () => void;
  onHistoryClick: () => void;
  onPillIdClick: () => void;
}) => {
  const { t } = useLanguage();

  const actions = useMemo(() => [
    { icon: Scan, label: t('scanMedication') || 'Scan', color: 'bg-blue-500', onClick: onScanClick },
    { icon: Search, label: t('searchDrugs') || 'Search', color: 'bg-green-500', onClick: onSearchClick },
    { icon: History, label: t('history') || 'History', color: 'bg-purple-500', onClick: onHistoryClick },
    { icon: Pill, label: t('pillId') || 'Pill ID', color: 'bg-orange-500', onClick: onPillIdClick }
  ], [t, onScanClick, onSearchClick, onHistoryClick, onPillIdClick]);

  return (
    <div className="grid grid-cols-2 gap-3 mb-6">
      {actions.map((action, index) => (
        <Card key={index} className="transition-all hover:shadow-md cursor-pointer" onClick={action.onClick}>
          <CardContent className="p-4 text-center">
            <div className={`w-12 h-12 ${action.color} rounded-full mx-auto mb-2 flex items-center justify-center`}>
              <action.icon className="w-6 h-6 text-white" />
            </div>
            <p className="text-sm font-medium">{action.label}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
});

QuickActions.displayName = 'QuickActions';

// Memoized recent searches to prevent re-renders
const RecentSearches = React.memo(() => {
  const { t } = useLanguage();

  const recentItems = useMemo(() => [
    'Aspirin', 'Ibuprofen', 'Paracetamol', 'Amoxicillin'
  ], []);

  return (
    <Card className="mb-4">
      <CardContent className="p-4">
        <h3 className="font-semibold mb-3 text-blue-600">{t('recentSearches') || 'Recent Searches'}</h3>
        <div className="flex flex-wrap gap-2">
          {recentItems.map((item, index) => (
            <Button key={index} variant="outline" size="sm" className="text-xs border-blue-500 text-blue-600">
              {item}
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
});

RecentSearches.displayName = 'RecentSearches';

export default function Home() {
  const { t } = useLanguage();
  const [showCamera, setShowCamera] = useState(false);
  const [searchResults, setSearchResults] = useState<{
    success: boolean;
    medications?: any[];
    message?: string;
  }>({});
  const [isSearching, setIsSearching] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [location, setLocation] = useLocation();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // Use the original handleSearch logic, but fix the endpoint and response handling
  const handleSearch = useCallback(async () => {
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    setError("");

    try {
      const response = await fetch(`/api/search-medications?query=${encodeURIComponent(searchQuery.trim())}`);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'An unknown error occurred.' }));
        throw new Error(`Search failed with status ${response.status}: ${errorData.message}`);
      }

      const result = await response.json();

      if (result.success && result.medications && result.medications.length > 0) {
        setSearchResults({
          success: true,
          medications: result.medications,
          message: result.message || `Found ${result.medications.length} medication(s)`
        });
      } else {
        setSearchResults({
          success: false,
          medications: [],
          message: result.message || 'No medications found for your search'
        });
      }
    } catch (err) {
      console.error('Search error:', err);
      const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred.';
      setError(t.searchFailed || `Search failed: ${errorMessage}`);
      setSearchResults({
        success: false,
        medications: [],
        message: t.searchFailed || 'Search failed. Please try again.'
      });
    } finally {
      setIsSearching(false);
    }
  }, [searchQuery, t, setError]);

  const handleCameraToggle = useCallback(() => {
    setShowCamera(prev => !prev);
    if (showCamera) {
      setSearchResults({});
      setSearchQuery('');
      setError('');
    }
  }, [showCamera]);

  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    if (e.target.value.trim().length === 0) {
      setSearchResults({});
      setError('');
    }
  }, []);

  const handleScanClick = useCallback(() => {
    setShowCamera(true);
  }, []);

  const handleSearchClick = useCallback(() => {
    const searchInput = document.querySelector('input[placeholder*="Search medications"]');
    if (searchInput) {
      searchInput.focus();
    }
  }, []);

  const handleHistoryClick = useCallback(() => {
    setLocation('/history');
  }, [setLocation]);

  const handlePillIdClick = useCallback(() => {
    setLocation('/translator');
  }, [setLocation]);

  if (showCamera) {
    return (
      <CameraInterface
        onClose={handleCameraToggle}
        onCapture={(imageData) => {
          console.log('Image captured:', imageData);
          setIsLoading(true);
          setError('');
          setTimeout(() => {
            setSearchResults({ success: true, medications: [{ name: 'Simulated Drug', description: 'This is a simulated result.' }] });
            setIsLoading(false);
          }, 2000);
        }}
        onMedicationFound={(medication) => {
          console.log('Medication found:', medication);
          setSearchResults({
            success: true,
            medications: [medication]
          });
          setIsLoading(false);
          setError('');
        }}
        setError={(errorMsg) => {
          console.error('Camera error:', errorMsg);
          setError(errorMsg);
          setSearchResults({ success: false, message: errorMsg });
          setIsLoading(false);
        }}
        setProcessingStage={(stage) => {
          console.log('Processing stage:', stage);
          if (stage === 'processing') {
            setIsLoading(true);
            setError('');
          } else {
            setIsLoading(false);
          }
        }}
      />
    );
  }

  return (
    <div className="max-w-md mx-auto bg-white min-h-screen shadow-lg">
      {/* Header */}
      <header className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-4 shadow-lg sticky top-0 z-10">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-blue-800 rounded-lg flex items-center justify-center">
              <Pill className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold">DrugScan</h1>
              <p className="text-blue-100 text-sm">{t('medicationScanner') || 'Medication Scanner'}</p>
            </div>
          </div>
          <LanguageSwitcher />
        </div>

        {/* Search Bar */}
        <div className="flex space-x-2">
          <Input
            type="text"
            placeholder={t('searchMedications') || 'Search medications...'}
            value={searchQuery}
            onChange={handleSearchChange}
            className="flex-1 bg-white/20 border-white/30 text-white placeholder:text-white/60 focus:bg-white/30 focus:border-white/50 focus:outline-none focus:ring-2 focus:ring-white/40"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && searchQuery.trim()) {
                e.preventDefault();
                handleSearch();
              }
            }}
          />
          <Button
            onClick={handleSearch}
            disabled={isSearching || isLoading || !searchQuery.trim()}
            className="bg-white hover:bg-gray-100 text-blue-600"
          >
            {isSearching ? (
              <div className="animate-spin w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full" />
            ) : (
              <Search className="w-4 h-4" />
            )}
          </Button>
          <Button
            onClick={handleCameraToggle}
            disabled={isSearching || isLoading}
            className="bg-white hover:bg-gray-100 text-blue-600"
          >
            <Scan className="w-4 h-4" />
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 p-4 pb-20 overflow-y-auto">
        {error && (
          <Card className="mb-4 text-center py-4 border-red-200">
            <CardContent>
              <p className="text-red-600">{error}</p>
            </CardContent>
          </Card>
        )}

        {isLoading && (
          <div className="flex justify-center items-center h-32">
            <p>{t('processing') || 'Processing...'}</p>
          </div>
        )}

        {!isLoading && !error && searchResults && searchResults.medications && searchResults.medications.length > 0 ? (
          <DrugResults results={searchResults} />
        ) : !isLoading && !error && searchResults && searchResults.message && (searchResults.medications === undefined || searchResults.medications.length === 0) ? (
          <Card className="mb-4 text-center py-4 border-blue-200">
            <CardContent>
              <p className="text-blue-600">{searchResults.message}</p>
            </CardContent>
          </Card>
        ) : !isLoading && !error && (
          <>
            <QuickActions
              onScanClick={handleScanClick}
              onSearchClick={handleSearchClick}
              onHistoryClick={handleHistoryClick}
              onPillIdClick={handlePillIdClick}
            />
            <RecentSearches />

            {/* Tips Card */}
            <Card className="bg-gradient-to-r from-green-50 to-blue-50">
              <CardContent className="p-4">
                <h3 className="font-semibold text-green-800 mb-2">
                  {t('tips') || 'Tips'}
                </h3>
                <ul className="text-sm text-green-700 space-y-1">
                  <li>• {t('tipClearPhoto') || 'Take clear photos in good lighting'}</li>
                  <li>• {t('tipReadableText') || 'Ensure text is readable'}</li>
                  <li>• {t('tipConsultDoctor') || 'Always consult your doctor'}</li>
                </ul>
              </CardContent>
            </Card>
          </>
        )}
      </main>

      <BottomNavigation />
    </div>
  );
}
