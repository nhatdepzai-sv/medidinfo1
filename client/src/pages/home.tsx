
import React, { useState, useCallback, useMemo } from 'react';
import { Search, Scan, History, User, Pill } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import CameraInterface from '@/components/camera-interface';
import DrugResults from '@/components/drug-results';
import BottomNavigation from '@/components/bottom-navigation';
import { useLanguage } from '@/contexts/language-context';

// Memoized quick actions to prevent re-renders
const QuickActions = React.memo(() => {
  const { t } = useLanguage();
  
  const actions = useMemo(() => [
    { icon: Scan, label: t('scanMedication') || 'Scan', color: 'bg-blue-500' },
    { icon: Search, label: t('searchDrugs') || 'Search', color: 'bg-green-500' },
    { icon: History, label: t('history') || 'History', color: 'bg-purple-500' },
    { icon: Pill, label: t('pillId') || 'Pill ID', color: 'bg-orange-500' }
  ], [t]);

  return (
    <div className="grid grid-cols-2 gap-3 mb-6">
      {actions.map((action, index) => (
        <Card key={index} className="transition-all hover:shadow-md">
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
        <h3 className="font-semibold mb-3">{t('recentSearches') || 'Recent Searches'}</h3>
        <div className="flex flex-wrap gap-2">
          {recentItems.map((item, index) => (
            <Button key={index} variant="outline" size="sm" className="text-xs">
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
  const [searchQuery, setSearchQuery] = useState('');
  const [showCamera, setShowCamera] = useState(false);
  const [searchResults, setSearchResults] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSearch = useCallback(async () => {
    if (!searchQuery.trim()) return;
    
    setIsLoading(true);
    try {
      const response = await fetch(`/api/search-medications?query=${encodeURIComponent(searchQuery)}`);
      const data = await response.json();
      setSearchResults(data);
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setIsLoading(false);
    }
  }, [searchQuery]);

  const handleCameraToggle = useCallback(() => {
    setShowCamera(prev => !prev);
  }, []);

  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  }, []);

  if (showCamera) {
    return <CameraInterface onClose={handleCameraToggle} />;
  }

  return (
    <div className="max-w-md mx-auto bg-white min-h-screen shadow-lg">
      {/* Header - Optimized with fixed height */}
      <header className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-4 shadow-lg sticky top-0 z-10">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
              <Pill className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold">DrugScan</h1>
              <p className="text-blue-100 text-sm">{t('medicationScanner') || 'Medication Scanner'}</p>
            </div>
          </div>
        </div>

        {/* Search Bar - Inline for better performance */}
        <div className="flex space-x-2">
          <Input
            type="text"
            placeholder={t('searchMedications') || 'Search medications...'}
            value={searchQuery}
            onChange={handleSearchChange}
            className="flex-1 bg-white/10 border-white/20 text-white placeholder-white/70"
          />
          <Button 
            onClick={handleSearch} 
            disabled={isLoading}
            className="bg-white text-blue-600 hover:bg-gray-100"
          >
            <Search className="w-4 h-4" />
          </Button>
          <Button 
            onClick={handleCameraToggle}
            className="bg-white text-blue-600 hover:bg-gray-100"
          >
            <Scan className="w-4 h-4" />
          </Button>
        </div>
      </header>

      {/* Main Content - Optimized scrolling */}
      <main className="flex-1 p-4 pb-20 overflow-y-auto">
        {searchResults ? (
          <DrugResults results={searchResults} />
        ) : (
          <>
            <QuickActions />
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
