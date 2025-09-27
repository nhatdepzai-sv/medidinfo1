import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { Search, Scan, History, User, Pill, X, WifiOff, Wifi } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import CameraInterface from '@/components/camera-interface';
import DrugResults from '@/components/drug-results';
import BottomNavigation from '@/components/bottom-navigation';
import { useLanguage } from '@/contexts/language-context';
import { useLocation } from 'wouter';
import { useNetwork, useOfflineStorage } from '@/hooks/use-network';
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
    <div className="grid grid-cols-2 gap-4 mb-6">
      {actions.map((action, index) => (
        <Card key={index} className="card-interactive transition-all hover:shadow-md cursor-pointer tap-highlight-transparent" onClick={action.onClick}>
          <CardContent className="p-6 text-center">
            <div className={`w-14 h-14 ${action.color} rounded-full mx-auto mb-3 flex items-center justify-center shadow-sm`}>
              <action.icon className="w-7 h-7 text-white" />
            </div>
            <p className="text-sm font-medium text-gray-700">{action.label}</p>
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
    <Card className="mb-6 card-mobile">
      <CardContent className="p-5">
        <h3 className="font-semibold mb-4 text-blue-600 text-base">{t('recentSearches') || 'Recent Searches'}</h3>
        <div className="flex flex-wrap gap-2">
          {recentItems.map((item, index) => (
            <Button 
              key={index} 
              variant="outline" 
              size="sm" 
              className="text-xs border-blue-500 text-blue-600 hover:bg-blue-50 tap-highlight-transparent min-h-8 px-3"
            >
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
  const networkStatus = useNetwork();
  const { saveOfflineData, getOfflineData } = useOfflineStorage();
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
  const [offlineResults, setOfflineResults] = useState<any[]>([]);

  // State for managing search AbortController
  const [searchController, setSearchController] = useState<AbortController | null>(null);


  // Enhanced search with offline mode support and faster performance
  const handleSearch = useCallback(async (queryToSearch: string) => {
    if (!queryToSearch.trim()) return;

    setIsSearching(true);
    setError("");

    const trimmedQuery = queryToSearch.trim();

    // Cancel previous search if still running
    if (searchController) {
      searchController.abort();
    }

    const controller = new AbortController();
    setSearchController(controller);

    // Try quick local search for common terms first
    const quickLocalSearch = (query: string) => {
      const commonMeds = [
        {
          id: 'quick-1',
          name: 'Paracetamol',
          nameVi: 'Paracetamol',
          category: 'Pain Reliever',
          categoryVi: 'Thuốc giảm đau',
          primaryUse: 'Pain relief and fever reduction',
          primaryUseVi: 'Giảm đau và hạ sốt',
          adultDosage: '500-1000mg every 4-6 hours',
          adultDosageVi: '500-1000mg mỗi 4-6 giờ',
          warnings: ['Do not exceed 4000mg daily'],
          warningsVi: ['Không vượt quá 4000mg mỗi ngày'],
          aliases: ['para', 'paracet', 'acetaminophen', 'tylenol']
        },
        {
          id: 'quick-2',
          name: 'Ibuprofen',
          nameVi: 'Ibuprofen',
          category: 'NSAID',
          categoryVi: 'Thuốc chống viêm',
          primaryUse: 'Pain and inflammation relief',
          primaryUseVi: 'Giảm đau và chống viêm',
          adultDosage: '200-400mg every 4-6 hours',
          adultDosageVi: '200-400mg mỗi 4-6 giờ',
          warnings: ['Take with food'],
          warningsVi: ['Dùng cùng thức ăn'],
          aliases: ['ibu', 'advil', 'motrin']
        }
      ];

      const queryLower = query.toLowerCase();
      return commonMeds.filter(med => 
        med.aliases.some(alias => alias.includes(queryLower)) ||
        med.name.toLowerCase().includes(queryLower) ||
        med.nameVi.toLowerCase().includes(queryLower)
      );
    };

    // Try quick local search first for instant results
    const quickResults = quickLocalSearch(trimmedQuery);
    if (quickResults.length > 0) {
      setSearchResults({
        success: true,
        medications: quickResults,
        message: `Found ${quickResults.length} medication(s) (Instant Search)`
      });
      setIsSearching(false);
      setSearchController(null);
      return;
    }

    // Check for offline cached results
    const cachedResults = getOfflineData(`search_${trimmedQuery.toLowerCase()}`);

    if (networkStatus.isOfflineMode && cachedResults) {
      setSearchResults({
        success: true,
        medications: cachedResults,
        message: `Found ${cachedResults.length} cached medication(s) (Offline Mode)`
      });
      setIsSearching(false);
      setSearchController(null);
      return;
    }

    // If offline and no cache, use built-in offline database
    if (networkStatus.isOfflineMode) {
      const offlineSearchResults = await performOfflineSearch(trimmedQuery);
      setSearchResults({
        success: offlineSearchResults.length > 0,
        medications: offlineSearchResults,
        message: offlineSearchResults.length > 0 
          ? `Found ${offlineSearchResults.length} medication(s) (Offline Mode)`
          : 'No medications found in offline database'
      });
      setIsSearching(false);
      setSearchController(null);
      return;
    }

    // Online search with timeout for faster response
    try {
      // Set up timeout that clears the timeout ID when it fires
      let timeoutId: NodeJS.Timeout | null = setTimeout(() => {
        timeoutId = null;
        controller.abort();
      }, 5000); // 5 second timeout for better UX

      const response = await fetch(`/api/search-medications?query=${encodeURIComponent(trimmedQuery)}`, {
        signal: controller.signal
      });

      // Clear timeout only if it hasn't fired yet
      if (timeoutId !== null) {
        clearTimeout(timeoutId);
        timeoutId = null;
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'An unknown error occurred.' }));
        throw new Error(`Search failed with status ${response.status}: ${errorData.message}`);
      }

      const result = await response.json();

      if (result.success && result.medications && result.medications.length > 0) {
        // Cache successful results for offline use
        saveOfflineData(`search_${trimmedQuery.toLowerCase()}`, result.medications);

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
      // Silently handle abort errors - they're expected when cancelling searches
      if (err instanceof Error && err.name === 'AbortError') {
        // Just return without setting error state for aborted requests
        setIsSearching(false);
        setSearchController(null);
        return;
      }

      console.error('Search error:', err);

      // Fallback to offline search if online search fails
      const offlineSearchResults = await performOfflineSearch(trimmedQuery);
      if (offlineSearchResults.length > 0) {
        setSearchResults({
          success: true,
          medications: offlineSearchResults,
          message: `Found ${offlineSearchResults.length} medication(s) (Offline Fallback)`
        });
      } else {
        const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred.';
        setError(t.searchFailed || `Search failed: ${errorMessage}`);
        setSearchResults({
          success: false,
          medications: [],
          message: t.searchFailed || 'Search failed. Please try again.'
        });
      }
    } finally {
      setIsSearching(false);
      setSearchController(null);
    }
  }, [t, networkStatus.isOfflineMode, getOfflineData, saveOfflineData, searchController]);

  // Offline search function using built-in medication database with enhanced partial matching
  const performOfflineSearch = useCallback(async (query: string): Promise<any[]> => {
    const commonMedications = [
      {
        id: 'offline-1',
        name: 'Paracetamol',
        nameVi: 'Paracetamol',
        genericName: 'Acetaminophen',
        category: 'Pain Reliever',
        categoryVi: 'Thuốc giảm đau',
        primaryUse: 'Pain relief and fever reduction',
        primaryUseVi: 'Giảm đau và hạ sốt',
        adultDosage: '500-1000mg every 4-6 hours',
        adultDosageVi: '500-1000mg mỗi 4-6 giờ',
        warnings: ['Do not exceed 4000mg daily', 'Avoid alcohol'],
        warningsVi: ['Không vượt quá 4000mg mỗi ngày', 'Tránh rượu bia'],
        aliases: ['para', 'paracet', 'acetaminophen', 'tylenol', 'panadol']
      },
      {
        id: 'offline-2',
        name: 'Ibuprofen',
        nameVi: 'Ibuprofen',
        genericName: 'Ibuprofen',
        category: 'NSAID',
        categoryVi: 'Thuốc chống viêm',
        primaryUse: 'Pain, inflammation, and fever reduction',
        primaryUseVi: 'Giảm đau, chống viêm và hạ sốt',
        adultDosage: '200-400mg every 4-6 hours',
        adultDosageVi: '200-400mg mỗi 4-6 giờ',
        warnings: ['Take with food', 'Not for children under 6 months'],
        warningsVi: ['Dùng cùng thức ăn', 'Không dành cho trẻ dưới 6 tháng'],
        aliases: ['ibu', 'advil', 'motrin', 'brufen']
      },
      {
        id: 'offline-3',
        name: 'Aspirin',
        nameVi: 'Aspirin',
        genericName: 'Acetylsalicylic Acid',
        category: 'NSAID',
        categoryVi: 'Thuốc chống viêm',
        primaryUse: 'Pain relief, anti-inflammatory, blood thinner',
        primaryUseVi: 'Giảm đau, chống viêm, làm loãng máu',
        adultDosage: '325-650mg every 4 hours',
        adultDosageVi: '325-650mg mỗi 4 giờ',
        warnings: ['Risk of bleeding', 'Not for children under 16'],
        warningsVi: ['Nguy cơ chảy máu', 'Không dành cho trẻ dưới 16 tuổi'],
        aliases: ['asp', 'asa', 'bayer']
      },
      {
        id: 'offline-4',
        name: 'Amoxicillin',
        nameVi: 'Amoxicillin',
        genericName: 'Amoxicillin',
        category: 'Antibiotic',
        categoryVi: 'Kháng sinh',
        primaryUse: 'Bacterial infections',
        primaryUseVi: 'Nhiễm trùng do vi khuẩn',
        adultDosage: '250-500mg every 8 hours',
        adultDosageVi: '250-500mg mỗi 8 giờ',
        warnings: ['Complete full course', 'May cause allergic reactions'],
        warningsVi: ['Dùng hết liệu trình', 'Có thể gây dị ứng'],
        aliases: ['amox', 'amoxil']
      },
      {
        id: 'offline-5',
        name: 'Omeprazole',
        nameVi: 'Omeprazole',
        genericName: 'Omeprazole',
        category: 'PPI',
        categoryVi: 'Thuốc ức chế bơm proton',
        primaryUse: 'Acid reflux and stomach ulcers',
        primaryUseVi: 'Trào ngược axit và loét dạ dày',
        adultDosage: '20-40mg once daily',
        adultDosageVi: '20-40mg một lần mỗi ngày',
        warnings: ['Take before meals', 'Long-term use may affect absorption'],
        warningsVi: ['Dùng trước bữa ăn', 'Dùng lâu dài có thể ảnh hưởng hấp thu'],
        aliases: ['omep', 'prilosec']
      }
    ];

    const searchTerm = query.toLowerCase();

    // Enhanced scoring for partial matches
    const scoredResults = commonMedications.map(med => {
      let score = 0;

      // Check aliases first (highest priority for partial matches)
      if (med.aliases && med.aliases.some(alias => alias.includes(searchTerm))) {
        score = 100;
      }
      // Exact matches
      else if (med.name.toLowerCase() === searchTerm || 
               med.nameVi.toLowerCase() === searchTerm ||
               med.genericName?.toLowerCase() === searchTerm) {
        score = 95;
      }
      // Starts with search term
      else if (med.name.toLowerCase().startsWith(searchTerm) ||
               med.nameVi.toLowerCase().startsWith(searchTerm) ||
               med.genericName?.toLowerCase().startsWith(searchTerm)) {
        score = 90;
      }
      // Contains search term
      else if (med.name.toLowerCase().includes(searchTerm) ||
               med.nameVi.toLowerCase().includes(searchTerm) ||
               med.genericName?.toLowerCase().includes(searchTerm)) {
        score = 80;
      }
      // Category match
      else if (med.category.toLowerCase().includes(searchTerm) ||
               med.categoryVi.toLowerCase().includes(searchTerm)) {
        score = 70;
      }

      return { med, score };
    }).filter(result => result.score > 0);

    return scoredResults
      .sort((a, b) => b.score - a.score)
      .map(result => result.med);
  }, []);

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
    // The debounced effect will handle the search trigger, so no immediate search here
  }, []);

  const handleScanClick = useCallback(() => {
    if (networkStatus.isOfflineMode) {
      setError(t('cameraOfflineMode') || 'Camera scanning is not available in offline mode. Please use search instead.');
      return;
    }
    setShowCamera(true);
  }, [networkStatus.isOfflineMode, t]);

  const handleSearchClick = useCallback(() => {
    const searchInput = document.querySelector('input[placeholder*="Search medications"]');
    if (searchInput) {
      (searchInput as HTMLInputElement).focus();
    }
  }, []);

  const handleHistoryClick = useCallback(() => {
    setLocation('/history');
  }, [setLocation]);

  const handlePillIdClick = useCallback(() => {
    setLocation('/translator');
  }, [setLocation]);

  // Debounced search for real-time results
  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      if (searchQuery.trim().length >= 2) {
        handleSearch(searchQuery);
      } else if (searchQuery.trim().length === 0) {
        setSearchResults({});
        setError('');
      }
    }, 300); // 300ms delay for smooth typing experience

    return () => clearTimeout(debounceTimer);
  }, [searchQuery, handleSearch]);

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
    <div className="max-w-md mx-auto bg-white min-h-screen shadow-lg overflow-hidden">
      {/* Header */}
      <header className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-4 shadow-lg sticky top-0 z-10 safe-top">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-blue-800 rounded-xl flex items-center justify-center shadow-sm">
              <Pill className="w-7 h-7" />
            </div>
            <div>
              <h1 className="text-xl font-bold">DrugScan</h1>
              <div className="flex items-center space-x-2">
                <p className="text-blue-100 text-sm">{t('medicationScanner') || 'Medication Scanner'}</p>
                {networkStatus.isOfflineMode ? (
                  <Badge variant="secondary" className="bg-orange-500/20 text-orange-200 text-xs h-5">
                    <WifiOff className="w-3 h-3 mr-1" />
                    Offline
                  </Badge>
                ) : (
                  <Badge variant="secondary" className="bg-green-500/20 text-green-200 text-xs h-5">
                    <Wifi className="w-3 h-3 mr-1" />
                    Online
                  </Badge>
                )}
              </div>
            </div>
          </div>
          <LanguageSwitcher />
        </div>

        {/* Search Bar */}
        <div className="flex space-x-2">
          <div className="flex-1 relative">
            <Input
              type="search"
              autoComplete="off"
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck="false"
              inputMode="search"
              placeholder={networkStatus.isOfflineMode 
                ? (t('searchMedicationsOffline') || 'Search medications (Offline)...') 
                : (t('searchMedications') || 'Search medications...')
              }
              value={searchQuery}
              onChange={handleSearchChange}
              className="form-input-mobile bg-white/20 border-white/30 text-white placeholder:text-white/60 focus:bg-white/30 focus:border-white/50 focus:outline-none focus:ring-2 focus:ring-white/40 h-12"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && searchQuery.trim().length >= 1) {
                  e.preventDefault();
                  e.currentTarget.blur(); // Hide mobile keyboard after search
                  handleSearch(searchQuery);
                }
              }}
              onFocus={(e) => {
                // Scroll to top when input is focused on mobile
                if (window.innerWidth <= 768) {
                  setTimeout(() => {
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }, 100);
                }
              }}
            />
          </div>
          <Button
            onClick={() => handleSearch(searchQuery)}
            disabled={isSearching || isLoading || searchQuery.trim().length < 1}
            className="btn-mobile bg-white hover:bg-gray-100 text-blue-600 w-12 h-12 p-0"
          >
            {isSearching ? (
              <div className="loading-spinner w-4 h-4 border-blue-600" />
            ) : (
              <Search className="w-5 h-5" />
            )}
          </Button>
          <Button
            onClick={handleCameraToggle}
            disabled={isSearching || isLoading || networkStatus.isOfflineMode}
            className="btn-mobile bg-white hover:bg-gray-100 text-blue-600 disabled:opacity-50 w-12 h-12 p-0"
            title={networkStatus.isOfflineMode ? 'Camera disabled in offline mode' : 'Scan medication'}
          >
            <Scan className="w-5 h-5" />
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 p-4 pb-24 overflow-y-auto min-h-screen scroll-smooth safe-bottom">
        {error && (
          <Card className="mb-4 text-center py-6 border-red-200 bg-red-50">
            <CardContent className="p-0">
              <p className="text-red-600 font-medium">{error}</p>
            </CardContent>
          </Card>
        )}

        {isLoading && (
          <div className="flex justify-center items-center h-32">
            <div className="flex flex-col items-center space-y-3">
              <div className="loading-spinner w-8 h-8 border-blue-600" />
              <p className="text-gray-600">{t('processing') || 'Processing...'}</p>
            </div>
          </div>
        )}

        {!isLoading && !error && searchResults && searchResults.medications && searchResults.medications.length > 0 ? (
          <DrugResults results={searchResults} />
        ) : !isLoading && !error && searchResults && searchResults.message && (searchResults.medications === undefined || searchResults.medications.length === 0) ? (
          <Card className="mb-4 text-center py-6 border-blue-200 bg-blue-50">
            <CardContent className="p-0">
              <p className="text-blue-600 font-medium">{searchResults.message}</p>
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
            <Card className="bg-gradient-to-r from-green-50 to-blue-50 card-mobile">
              <CardContent className="p-5">
                <h3 className="font-semibold text-green-800 mb-3 text-base">
                  {t('tips') || 'Tips for Better Results'}
                </h3>
                <ul className="text-sm text-green-700 space-y-2">
                  <li className="flex items-start">
                    <span className="w-2 h-2 bg-green-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                    {t('tipClearPhoto') || 'Take clear photos in good lighting'}
                  </li>
                  <li className="flex items-start">
                    <span className="w-2 h-2 bg-green-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                    {t('tipReadableText') || 'Ensure medication text is readable'}
                  </li>
                  <li className="flex items-start">
                    <span className="w-2 h-2 bg-green-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                    {t('tipConsultDoctor') || 'Always consult your doctor before taking medications'}
                  </li>
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