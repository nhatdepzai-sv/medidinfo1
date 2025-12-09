import React, { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { Search, Scan, History, User, Pill, X, WifiOff, Wifi, Info } from 'lucide-react';
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
import { useDeviceType } from "../hooks/use-device-type";

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
    searchTerm?: string;
  }>({});
  const [isSearching, setIsSearching] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [location, setLocation] = useLocation();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [offlineResults, setOfflineResults] = useState<any[]>([]);

  // PWA Install Prompt
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  // State for managing search cancellation
  const currentSearchIdRef = useRef<number>(0);
  const searchCancelledRef = useRef<boolean>(false);

  // PWA Install Handler
  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      // Prevent the mini-infobar from appearing on mobile
      e.preventDefault();
      // Save the event so it can be triggered later
      setDeferredPrompt(e);
      // Show the install prompt
      setShowInstallPrompt(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // Check if app is already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setShowInstallPrompt(false);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallApp = async () => {
    if (!deferredPrompt) return;

    // Show the install prompt
    deferredPrompt.prompt();

    // Wait for the user to respond to the prompt
    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === 'accepted') {
      console.log('User accepted the install prompt');
    }

    // Clear the deferredPrompt
    setDeferredPrompt(null);
    setShowInstallPrompt(false);
  };

  // Enhanced search with offline mode support and faster performance
  const handleSearch = useCallback(async (queryToSearch: string) => {
    if (!queryToSearch.trim()) return;

    const trimmedQuery = queryToSearch.trim();

    // Cancel previous search and assign new search ID
    searchCancelledRef.current = true;
    const searchId = ++currentSearchIdRef.current;
    searchCancelledRef.current = false;

    // Check if this search is still valid before starting
    if (searchId !== currentSearchIdRef.current) {
      return;
    }

    setIsLoading(true);
    setError("");

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

    // Check if we already have results for this exact query to prevent duplicate searches
    if (searchResults.medications && searchResults.medications.length > 0 &&
        searchResults.searchTerm === trimmedQuery) {
      setIsLoading(false);
      return;
    }

    // Try quick local search first for instant results
    const quickResults = quickLocalSearch(trimmedQuery);
    if (quickResults.length > 0) {
      setSearchResults({
        success: true,
        medications: quickResults,
        message: `Found ${quickResults.length} medication(s) (Instant Search)`,
        searchTerm: trimmedQuery
      });
      setIsLoading(false);
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
      setIsLoading(false);
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
      setIsLoading(false);
      return;
    }

    // Online search with timeout for faster response
    let timeoutId: NodeJS.Timeout | null = null;
    try {
      console.log(`Searching for: "${trimmedQuery}"`);

      // Set up timeout that safely aborts the controller
      timeoutId = setTimeout(() => {
        if (!searchCancelledRef.current && searchId === currentSearchIdRef.current) {
          searchCancelledRef.current = true;
          console.log('Timeout abort for:', trimmedQuery);
        }
      }, 10000); // 10 second timeout for better reliability

      const response = await fetch(`/api/search-medications?query=${encodeURIComponent(trimmedQuery)}`, {
        signal: new AbortController().signal // This is a placeholder, the actual cancellation is handled by searchCancelledRef and currentSearchIdRef
      });

      // Clear timeout if request completed successfully
      if (timeoutId) {
        clearTimeout(timeoutId);
        timeoutId = null;
      }

      if (!response.ok) {
        console.error(`Search failed with status ${response.status}`);
        const errorData = await response.json().catch(() => ({ message: 'Network error occurred.' }));
        throw new Error(`Search failed: ${errorData.message || 'Server error'}`);
      }

      const result = await response.json();
      console.log(`Search result for "${trimmedQuery}":`, result);

      // Check if search was cancelled
      if (searchCancelledRef.current || searchId !== currentSearchIdRef.current) {
        console.log(`Search cancelled after fetch for: "${trimmedQuery}"`);
        return;
      }

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
      // Clear timeout on error
      if (timeoutId) {
        clearTimeout(timeoutId);
        timeoutId = null;
      }

      // Check if this is still the current search
      if (searchCancelledRef.current || searchId !== currentSearchIdRef.current) {
        return; // Another search has started or was cancelled, exit silently
      }

      // Silently handle abort errors - they're expected when cancelling searches
      if (err instanceof Error && (err.name === 'AbortError' || err.message.includes('aborted') || err instanceof DOMException)) {
        console.log(`Search aborted for: "${trimmedQuery}"`);
        return; // Don't set any state for aborted requests
      }

      console.error('Search error:', err);

      // Fallback to offline search if online search fails
      try {
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
      } catch (offlineErr) {
        console.error('Offline search also failed:', offlineErr);
      }
    } finally {
      // Only update loading state if this is still the current search
      if (!searchCancelledRef.current && searchId === currentSearchIdRef.current) {
        setIsLoading(false);
      }
      setIsSearching(false); // Ensure isSearching is always reset
    }
  }, [t, networkStatus.isOfflineMode, getOfflineData, saveOfflineData]);


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
      },
      {
        id: 'offline-6',
        name: 'Ginkgo Biloba',
        nameVi: 'Bạch Quả',
        genericName: 'Ginkgo Biloba Extract',
        category: 'Herbal Supplement',
        categoryVi: 'Thực phẩm chức năng thảo dược',
        primaryUse: 'Memory enhancement, circulation improvement',
        primaryUseVi: 'Cải thiện trí nhớ, tuần hoàn máu',
        adultDosage: '40-80mg two to three times daily',
        adultDosageVi: '40-80mg hai đến ba lần mỗi ngày',
        warnings: ['May interact with blood thinners', 'Consult doctor if pregnant'],
        warningsVi: ['Có thể tương tác với thuốc chống đông máu', 'Tham khảo ý kiến bác sĩ nếu mang thai'],
        aliases: ['ginkgo', 'biloba', 'memory herb']
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
    const newValue = e.target.value;
    setSearchQuery(newValue);

    // Clear results immediately if query is cleared
    if (newValue.trim().length === 0) {
      setSearchResults({});
      setError('');
      setIsLoading(false);
    }
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

  // Modified handleTranslate to redirect to a Rick Roll video
  const handleTranslate = () => {
    window.open('https://www.youtube.com/watch?v=dQw4w9WgXcQ', '_blank');
  };

  // Cleanup effect for search cancellation
  useEffect(() => {
    return () => {
      searchCancelledRef.current = true;
    };
  }, []);

  // Debounced search for real-time results with improved cancellation
  useEffect(() => {
    // Cancel any ongoing search when query changes
    searchCancelledRef.current = true;

    const debounceTimer = setTimeout(async () => {
      if (searchQuery.trim().length >= 3) { // Require at least 3 characters
        const trimmedQuery = searchQuery.trim();

        // Check if we already have results for this exact query to prevent duplicate searches
        if (searchResults.medications && searchResults.medications.length > 0 &&
            searchResults.searchTerm === trimmedQuery) {
          setIsLoading(false);
          return;
        }

        setIsLoading(true);
        setError('');
        searchCancelledRef.current = false;

        try {
          const response = await fetch(`/api/search-medications?q=${encodeURIComponent(trimmedQuery)}`);

          if (searchCancelledRef.current) {
            return; // Search was cancelled, ignore results
          }

          const data = await response.json();

          if (data.success) {
            setSearchResults({
              success: true,
              medications: data.medications || [],
              message: data.message || `Found ${data.medications?.length || 0} medication(s)`,
              searchTerm: trimmedQuery
            });
          } else {
            setSearchResults({
              success: false,
              medications: [],
              message: data.message || 'No medications found'
            });
          }
        } catch (err) {
          if (!searchCancelledRef.current) {
            setError('Search failed. Please try again.');
            setSearchResults({
              success: false,
              medications: [],
              message: 'Search failed'
            });
          }
        } finally {
          if (!searchCancelledRef.current) {
            setIsLoading(false);
          }
        }
      } else if (searchQuery.trim().length === 0) {
        setSearchResults({});
        setError('');
        setIsLoading(false);
      }
    }, 800); // Reduced to 800ms for better responsiveness

    return () => {
      clearTimeout(debounceTimer);
    };
  }, [searchQuery]);

  // Dummy function for search history, replace with actual implementation
  const addToSearchHistory = (query: string) => {
    console.log('Adding to search history:', query);
  };

  const handleMedicationDetected = (medication) => {
    console.log('Medication detected:', medication);
    setSearchResults({ success: true, medications: [medication] });
    setIsLoading(false);
    setError('');
  };

  const deviceType = useDeviceType();

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
    <div className={`min-h-screen bg-gradient-to-br from-blue-600 to-indigo-700 ${deviceType === 'desktop' ? 'p-8' : ''}`}>
      <div className={`container mx-auto ${deviceType === 'desktop' ? 'max-w-6xl' : 'px-4 py-8'}`}>
        <div className={deviceType === 'desktop' ? 'grid grid-cols-2 gap-8' : 'max-w-md mx-auto'}>
          <div className={deviceType === 'desktop' ? '' : ''}>
            <header className={`text-center mb-8 ${deviceType === 'desktop' ? 'text-left' : ''}`}>
              <div className={`inline-flex items-center gap-2 mb-4 ${deviceType === 'desktop' ? 'mb-6' : ''}`}>
                <Pill className={`text-white ${deviceType === 'desktop' ? 'h-12 w-12' : 'h-10 w-10'}`} />
                <h1 className={`font-bold text-white ${deviceType === 'desktop' ? 'text-4xl' : 'text-3xl'}`}>{t.appName}</h1>
              </div>
              <p className={`text-blue-100 ${deviceType === 'desktop' ? 'text-lg' : ''}`}>{t.subtitle}</p>
            </header>

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
                    if (e.key === 'Enter' && searchQuery.trim().length >= 3) {
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
                disabled={isSearching || isLoading || searchQuery.trim().length < 3}
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
                  onPillIdClick={handleTranslate} // Updated onClick handler
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
          </div>

          {/* Camera Interface and Results for Desktop */}
          {deviceType === 'desktop' && (
            <div className="flex flex-col">
              <CameraInterface onMedicationDetected={handleMedicationDetected} />

              {deviceType === 'desktop' && (
                <div className="mt-8 bg-white/10 backdrop-blur-md rounded-2xl p-6 text-white">
                  <div className="flex items-start gap-3">
                    <Info className="h-6 w-6 flex-shrink-0 mt-1" />
                    <div>
                      <h3 className="font-semibold mb-2 text-lg">{t.howToUse}</h3>
                      <ol className="space-y-3 text-blue-100">
                        <li className="flex items-center gap-2">
                          <span className="flex items-center justify-center w-6 h-6 bg-blue-500 rounded-full text-sm font-semibold">1</span>
                          {t.step1}
                        </li>
                        <li className="flex items-center gap-2">
                          <span className="flex items-center justify-center w-6 h-6 bg-blue-500 rounded-full text-sm font-semibold">2</span>
                          {t.step2}
                        </li>
                        <li className="flex items-center gap-2">
                          <span className="flex items-center justify-center w-6 h-6 bg-blue-500 rounded-full text-sm font-semibold">3</span>
                          {t.step3}
                        </li>
                      </ol>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Results Column for Desktop */}
          {deviceType === 'desktop' && (
            <div className="flex flex-col">
              {searchResults && searchResults.medications && searchResults.medications.length > 0 ? (
                <div className="animate-in fade-in slide-in-from-right-4 duration-500">
                  <DrugResults results={searchResults} />
                </div>
              ) : (
                <div className="flex items-center justify-center h-full bg-white/10 backdrop-blur-md rounded-2xl p-8">
                  <div className="text-center text-white">
                    <Pill className="h-16 w-16 mx-auto mb-4 opacity-50" />
                    <p className="text-lg font-medium">Scan Results</p>
                    <p className="text-sm text-blue-200 mt-2">Results will appear here after scanning</p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Mobile Results */}
          {deviceType === 'mobile' && searchResults && searchResults.medications && searchResults.medications.length > 0 && (
            <div className="mt-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <DrugResults results={searchResults} />
            </div>
          )}

          {deviceType === 'mobile' && (
            <div className="mt-8 bg-white/10 backdrop-blur-md rounded-2xl p-6 text-white">
              <div className="flex items-start gap-3">
                <Info className="h-6 w-6 flex-shrink-0 mt-1" />
                <div>
                  <h3 className="font-semibold mb-2">{t.howToUse}</h3>
                  <ol className="space-y-2 text-sm text-blue-100">
                    <li>1. {t.step1}</li>
                    <li>2. {t.step2}</li>
                    <li>3. {t.step3}</li>
                  </ol>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <BottomNavigation />
    </div>
  );
}