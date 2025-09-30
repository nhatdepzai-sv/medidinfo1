
import { useState } from "react";
import { User, Settings, Bell, Shield, HelpCircle, LogOut, UserCog, BarChart3, Database } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import BottomNavigation from "@/components/bottom-navigation";
import LanguageSwitcher from "@/components/language-switcher";
import { useLanguage } from "@/contexts/language-context";
import { useAuth } from "@/contexts/auth-context";
import { useLocation } from "wouter";

export default function Profile() {
  const { t } = useLanguage();
  const { user } = useAuth();
  const [location, setLocation] = useLocation();
  const [notifications, setNotifications] = useState(true);
  const [autoSave, setAutoSave] = useState(false);

  // Check if user is admin
  const isAdmin = user?.username === 'admin';

  const profileSections = [
    {
      title: "Settings",
      icon: Settings,
      items: [
        {
          label: "Notifications",
          description: "Receive alerts about medications",
          type: "switch",
          value: notifications,
          onChange: setNotifications
        },
        {
          label: "Auto-save History", 
          description: "Automatically save scanned medications",
          type: "switch",
          value: autoSave,
          onChange: setAutoSave
        }
      ]
    },
    {
      title: "Support",
      icon: HelpCircle,
      items: [
        {
          label: "Help Center",
          description: "Get help and support",
          type: "button"
        },
        {
          label: "Privacy Policy",
          description: "View our privacy policy",
          type: "button"
        },
        {
          label: "Terms of Service",
          description: "View terms and conditions",
          type: "button"
        }
      ]
    }
  ];

  return (
    <div className="max-w-md mx-auto bg-white min-h-screen shadow-lg relative">
      {/* Header */}
      <header className="bg-primary text-white p-4 shadow-md">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <User className="text-2xl" />
            <h1 className="text-xl font-medium">{t("profile")}</h1>
          </div>
          <LanguageSwitcher />
        </div>
      </header>

      <div className="flex-1 p-4 pb-20">
        {/* User Info */}
        <Card className="mb-6">
          <CardContent className="p-6 text-center">
            <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center mx-auto mb-4">
              <User className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-xl font-semibold mb-1">{user?.username || 'Anonymous User'}</h2>
            <p className="text-gray-500 text-sm">
              {user?.username === 'Guest User' ? 'Guest User' : 
               isAdmin ? 'Administrator' : 'DrugScan User'}
            </p>
            {user?.email && (
              <p className="text-xs text-gray-400 mt-1">{user.email}</p>
            )}
          </CardContent>
        </Card>

        {/* Admin Commands Section */}
        {isAdmin && (
          <Card className="mb-4 border-red-200 bg-red-50">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center space-x-2 text-base text-red-700">
                <Shield className="w-5 h-5" />
                <span>Admin Commands</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-1 gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setLocation('/admin')}
                  className="justify-start border-red-300 hover:bg-red-100"
                >
                  <UserCog className="w-4 h-4 mr-2" />
                  Admin Dashboard
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setLocation('/training')}
                  className="justify-start border-red-300 hover:bg-red-100"
                >
                  <BarChart3 className="w-4 h-4 mr-2" />
                  AI Training Dashboard
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.open('/api/stats', '_blank')}
                  className="justify-start border-red-300 hover:bg-red-100"
                >
                  <Database className="w-4 h-4 mr-2" />
                  System Statistics
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Profile Sections */}
        {profileSections.map((section) => (
          <Card key={section.title} className="mb-4">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center space-x-2 text-base">
                <section.icon className="w-5 h-5" />
                <span>{section.title}</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {section.items.map((item, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="font-medium text-sm">{item.label}</div>
                    <div className="text-xs text-gray-500">{item.description}</div>
                  </div>
                  {item.type === 'switch' && (
                    <Switch 
                      checked={item.value as boolean}
                      onCheckedChange={item.onChange as (checked: boolean) => void}
                    />
                  )}
                  {item.type === 'button' && (
                    <Button variant="ghost" size="sm">
                      <HelpCircle className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>
        ))}

        {/* App Info */}
        <Card>
          <CardContent className="p-4 text-center">
            <h3 className="font-medium mb-2">DrugScan v1.0.0</h3>
            <p className="text-xs text-gray-500">
              Medication identification and information app
            </p>
          </CardContent>
        </Card>
      </div>

      <BottomNavigation />
    </div>
  );
}
