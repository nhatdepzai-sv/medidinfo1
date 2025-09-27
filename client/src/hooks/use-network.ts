import { useState, useEffect } from 'react';

export interface NetworkStatus {
  isOnline: boolean;
  isSlowConnection: boolean;
  connectionType: string;
  isOfflineMode: boolean;
}

export function useNetwork(): NetworkStatus {
  const [networkStatus, setNetworkStatus] = useState<NetworkStatus>({
    isOnline: navigator.onLine,
    isSlowConnection: false,
    connectionType: 'unknown',
    isOfflineMode: false
  });

  useEffect(() => {
    const updateNetworkStatus = () => {
      const isOnline = navigator.onLine;

      // Get connection info if available
      const connection = (navigator as any).connection ||
                        (navigator as any).mozConnection ||
                        (navigator as any).webkitConnection;

      let isSlowConnection = false;
      let connectionType = 'unknown';

      if (connection) {
        connectionType = connection.effectiveType || connection.type || 'unknown';
        isSlowConnection = connection.effectiveType === 'slow-2g' ||
                          connection.effectiveType === '2g' ||
                          connection.downlink < 1;
      }

      const isOfflineMode = !isOnline || isSlowConnection;

      setNetworkStatus({
        isOnline,
        isSlowConnection,
        connectionType,
        isOfflineMode
      });
    };

    // Initial check
    updateNetworkStatus();

    // Listen for network changes
    window.addEventListener('online', updateNetworkStatus);
    window.addEventListener('offline', updateNetworkStatus);

    // Listen for connection changes if available
    const connection = (navigator as any).connection ||
                      (navigator as any).mozConnection ||
                      (navigator as any).webkitConnection;

    if (connection) {
      connection.addEventListener('change', updateNetworkStatus);
    }

    // Check connection periodically
    const interval = setInterval(async () => {
      try {
        // Test actual connectivity with a lightweight request
        const controller = new AbortController();
        let timeoutId: NodeJS.Timeout | null = setTimeout(() => {
          timeoutId = null;
          controller.abort();
        }, 3000);

        await fetch('/api/health', {
          method: 'GET',
          signal: controller.signal
        });

        // Clear timeout only if it hasn't fired yet
        if (timeoutId !== null) {
          clearTimeout(timeoutId);
          timeoutId = null;
        }

        if (!networkStatus.isOnline) {
          updateNetworkStatus();
        }
      } catch (error) {
        // Silently handle abort errors for network checks
        if (error instanceof Error && error.name === 'AbortError') {
          return;
        }
        
        if (networkStatus.isOnline) {
          setNetworkStatus(prev => ({
            ...prev,
            isOnline: false,
            isOfflineMode: true
          }));
        }
      }
    }, 10000); // Check every 10 seconds

    return () => {
      window.removeEventListener('online', updateNetworkStatus);
      window.removeEventListener('offline', updateNetworkStatus);

      if (connection) {
        connection.removeEventListener('change', updateNetworkStatus);
      }

      clearInterval(interval);
    };
  }, [networkStatus.isOnline]);

  return networkStatus;
}

// Hook for offline storage
export function useOfflineStorage() {
  const saveOfflineData = (key: string, data: any) => {
    try {
      localStorage.setItem(`offline_${key}`, JSON.stringify({
        data,
        timestamp: Date.now()
      }));
    } catch (error) {
      console.error('Failed to save offline data:', error);
    }
  };

  const getOfflineData = (key: string) => {
    try {
      const stored = localStorage.getItem(`offline_${key}`);
      if (stored) {
        const parsed = JSON.parse(stored);
        // Return data if it's less than 24 hours old
        if (Date.now() - parsed.timestamp < 24 * 60 * 60 * 1000) {
          return parsed.data;
        }
      }
    } catch (error) {
      console.error('Failed to get offline data:', error);
    }
    return null;
  };

  const clearOfflineData = (key?: string) => {
    try {
      if (key) {
        localStorage.removeItem(`offline_${key}`);
      } else {
        // Clear all offline data
        Object.keys(localStorage)
          .filter(k => k.startsWith('offline_'))
          .forEach(k => localStorage.removeItem(k));
      }
    } catch (error) {
      console.error('Failed to clear offline data:', error);
    }
  };

  return { saveOfflineData, getOfflineData, clearOfflineData };
}