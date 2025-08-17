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
import { useTheme } from '../contexts/theme-context'; // Assuming you have a theme context

// Memoized quick actions to prevent re-renders
const QuickActions = React.memo(({ onScanClick, onSearchClick, onHistoryClick, onPillIdClick }: {
  onScanClick: () => void;
  onSearchClick: () => void;
  onHistoryClick: () => void;
  onPillIdClick: () => void;
}) => {
  const { t } = useLanguage();
  const { currentTheme } = useTheme();

  const actions = useMemo(() => [
    { icon: Scan, label: t('scanMedication') || 'Scan', color: currentTheme.colors.scan, onClick: onScanClick },
    { icon: Search, label: t('searchDrugs') || 'Search', color: currentTheme.colors.search, onClick: onSearchClick },
    { icon: History, label: t('history') || 'History', color: currentTheme.colors.history, onClick: onHistoryClick },
    { icon: Pill, label: t('pillId') || 'Pill ID', color: currentTheme.colors.pillId, onClick: onPillIdClick }
  ], [t, onScanClick, onSearchClick, onHistoryClick, onPillIdClick, currentTheme.colors]);

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
  const { currentTheme } = useTheme();

  const recentItems = useMemo(() => [
    'Aspirin', 'Ibuprofen', 'Paracetamol', 'Amoxicillin'
  ], []);

  return (
    <Card className="mb-4">
      <CardContent className="p-4">
        <h3 className="font-semibold mb-3" style={{ color: currentTheme.colors.primary }}>{t('recentSearches') || 'Recent Searches'}</h3>
        <div className="flex flex-wrap gap-2">
          {recentItems.map((item, index) => (
            <Button key={index} variant="outline" size="sm" className="text-xs" style={{ borderColor: currentTheme.colors.primary, color: currentTheme.colors.primary }}>
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
  const { currentTheme } = useTheme();
  const [showCamera, setShowCamera] = useState(false);
  const [searchResults, setSearchResults] = useState<{
    success: boolean;
    medications?: any[];
    message?: string;
  }>({});
  const [isSearching, setIsSearching] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [location, setLocation] = useLocation();

  const handleSearch = useCallback(async (query: string) => {
    if (!query.trim()) {
      setSearchResults({});
      return;
    }

    setIsSearching(true);
    setSearchQuery(query);
    try {
      const response = await fetch(`/api/search-medications?query=${encodeURIComponent(query)}`);
      const data = await response.json();
      setSearchResults(data);
    } catch (error) {
      console.error('Search error:', error);
      setSearchResults({
        success: false,
        message: 'Search failed. Please try again.'
      });
    } finally {
      setIsSearching(false);
    }
  }, []);

  const handleCameraToggle = useCallback(() => {
    setShowCamera(prev => !prev);
  }, []);

  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    if (e.target.value.length === 0) {
      setSearchResults({});
    }
  }, []);

  const handleScanClick = useCallback(() => {
    setShowCamera(true);
  }, []);

  const handleSearchClick = useCallback(() => {
    document.querySelector('input')?.focus();
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
          // Here you would typically trigger a backend process for image analysis
          // For now, we'll simulate a result after a short delay to show a loading state
          setIsLoading(true); // Assuming you have a loading state for processing
          setTimeout(() => {
            // Replace with actual backend call and result handling
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
        }}
        setError={(error) => {
          console.error('Camera error:', error);
          setSearchResults({ success: false, message: error });
        }}
        setProcessingStage={(stage) => {
          console.log('Processing stage:', stage);
          // You could use this to update a UI element showing progress
          if (stage === 'processing') {
            setIsLoading(true);
          } else {
            setIsLoading(false);
          }
        }}
      />
    );
  }

  return (
    <div className="max-w-md mx-auto bg-white min-h-screen shadow-lg" style={{ backgroundColor: currentTheme.colors.background }}>
      {/* Header with Language Switcher */}
      <header className={`text-white p-4 shadow-lg sticky top-0 z-10`} style={{ background: currentTheme.colors.headerGradient }}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className={`w-10 h-10 ${currentTheme.colors.headerIconBackground} rounded-lg flex items-center justify-center`}>
              <Pill className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold">DrugScan</h1>
              <p className="text-blue-100 text-sm">{t('medicationScanner') || 'Medication Scanner'}</p>
            </div>
          </div>
          <LanguageSwitcher />
        </div>

        {/* Search Bar - Inline for better performance */}
        <div className="flex space-x-2">
          <Input
            type="text"
            placeholder={t('searchMedications') || 'Search medications...'}
            value={searchQuery}
            onChange={handleSearchChange}
            className="flex-1 bg-white/10 border-white/20 text-white placeholder-white/70"
            style={{ backgroundColor: currentTheme.colors.searchInputBackground, borderColor: currentTheme.colors.searchInputBorder, color: currentTheme.colors.searchInputText, placeholderColor: currentTheme.colors.searchInputPlaceholder }}
          />
          <Button
            onClick={() => handleSearch(searchQuery)}
            disabled={isSearching}
            className="bg-white hover:bg-gray-100"
            style={{ color: currentTheme.colors.primary }}
          >
            <Search className="w-4 h-4" />
          </Button>
          <Button
            onClick={handleCameraToggle}
            className="bg-white hover:bg-gray-100"
            style={{ color: currentTheme.colors.primary }}
          >
            <Scan className="w-4 h-4" />
          </Button>
        </div>
      </header>

      {/* Main Content - Optimized scrolling */}
      <main className="flex-1 p-4 pb-20 overflow-y-auto" style={{ backgroundColor: currentTheme.colors.background }}>
        {searchResults && searchResults.medications && searchResults.medications.length > 0 ? (
          <DrugResults results={searchResults} />
        ) : searchResults && searchResults.message ? (
          <Card className="mb-4 text-center py-4" style={{ borderColor: currentTheme.colors.primary, color: currentTheme.colors.primary }}>
            <CardContent>
              <p>{searchResults.message}</p>
            </CardContent>
          </Card>
        ) : (
          <>
            <QuickActions
              onScanClick={handleScanClick}
              onSearchClick={handleSearchClick}
              onHistoryClick={handleHistoryClick}
              onPillIdClick={handlePillIdClick}
            />
            <RecentSearches />

            {/* Tips Card - Lazy loaded */}
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