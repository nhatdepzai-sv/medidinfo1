
import React from 'react';
import { Home, History, User, Search, Shield, BarChart3 } from 'lucide-react';
import { useLocation } from 'wouter';
import { useAuth } from '@/contexts/auth-context';

export default function BottomNavigation() {
  const [location, setLocation] = useLocation();
  const { user } = useAuth();

  // Check if user is admin
  const isAdmin = user?.role === 'admin';

  const baseNavItems = [
    { icon: Home, label: 'Home', path: '/' },
    { icon: Search, label: 'Search', path: '/translator' },
    { icon: History, label: 'History', path: '/history' },
    { icon: User, label: 'Profile', path: '/profile' }
  ];

  const adminNavItems = [
    { icon: Home, label: 'Home', path: '/' },
    { icon: Shield, label: 'Admin', path: '/admin' },
    { icon: BarChart3, label: 'Training', path: '/training' },
    { icon: User, label: 'Profile', path: '/profile' }
  ];

  const navItems = isAdmin ? adminNavItems : baseNavItems;

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50 safe-area-inset-bottom shadow-lg">
      <div className="w-full">
        <div className="flex justify-around items-center h-16 px-2">
          {navItems.map((item, index) => (
            <button
              key={index}
              onClick={() => setLocation(item.path)}
              className={`flex flex-col items-center justify-center min-w-0 flex-1 h-full rounded-lg transition-all ${
                location === item.path
                  ? 'text-blue-600 bg-blue-50'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
              }`}
            >
              <item.icon className="w-6 h-6 mb-1" />
              <span className="text-xs font-medium truncate">{item.label}</span>
            </button>
          ))}
        </div>
      </div>
    </nav>
  );
}
