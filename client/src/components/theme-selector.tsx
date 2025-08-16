
import React, { useState } from 'react';
import { Palette, Check } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';
import { useTheme } from '../contexts/theme-context';

const ThemeSelector: React.FC = () => {
  const { currentTheme, themes, setTheme } = useTheme();
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative">
      <Button
        onClick={() => setIsOpen(!isOpen)}
        variant="ghost"
        size="icon"
        className="text-white hover:bg-white/20"
        aria-label="Select theme"
      >
        <Palette className="h-5 w-5" />
      </Button>

      {isOpen && (
        <Card className="absolute top-12 right-0 w-64 bg-white/95 backdrop-blur-sm border shadow-lg z-50">
          <CardContent className="p-3">
            <h3 className="font-medium text-sm mb-3 text-gray-800">Choose Theme</h3>
            <div className="space-y-2">
              {themes.map((theme) => (
                <button
                  key={theme.id}
                  onClick={() => {
                    setTheme(theme.id);
                    setIsOpen(false);
                  }}
                  className={`w-full flex items-center justify-between p-2 rounded-lg hover:bg-gray-100 transition-colors ${
                    currentTheme.id === theme.id ? 'bg-gray-100' : ''
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <div
                      className="w-6 h-6 rounded-full border-2 border-gray-200"
                      style={{
                        background: `linear-gradient(45deg, ${theme.colors.primary}, ${theme.colors.secondary})`
                      }}
                    />
                    <span className="text-sm font-medium text-gray-700">{theme.name}</span>
                  </div>
                  {currentTheme.id === theme.id && (
                    <Check className="h-4 w-4 text-green-600" />
                  )}
                </button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ThemeSelector;
