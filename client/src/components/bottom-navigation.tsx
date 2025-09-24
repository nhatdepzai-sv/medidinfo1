
import React from 'react';
import { Home, History, User, Search } from 'lucide-react';
import { useLocation } from 'wouter';

export default function BottomNavigation() {
  const [location, setLocation] = useLocation();

  const navItems = [
    { icon: Home, label: 'Home', path: '/' },
    { icon: Search, label: 'Search', path: '/translator' },
    { icon: History, label: 'History', path: '/history' },
    { icon: User, label: 'Profile', path: '/profile' }
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50">
      <div className="max-w-md mx-auto">
        <div className="flex justify-around items-center py-2">
          {navItems.map((item, index) => (
            <button
              key={index}
              onClick={() => setLocation(item.path)}
              className={`flex flex-col items-center py-2 px-4 rounded-lg transition-colors ${
                location === item.path
                  ? 'text-blue-600 bg-blue-50'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <item.icon className="w-5 h-5 mb-1" />
              <span className="text-xs font-medium">{item.label}</span>
            </button>
          ))}
        </div>
      </div>
    </nav>
  );
}
