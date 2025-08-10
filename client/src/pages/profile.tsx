
import { useState } from "react";
import { User, Settings, Bell, Shield, HelpCircle, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import BottomNavigation from "@/components/bottom-navigation";
import LanguageSwitcher from "@/components/language-switcher";
import { useLanguage } from "@/contexts/language-context";

export default function Profile() {
  const { t } = useLanguage();
  const [notifications, setNotifications] = useState(true);
  const [autoSave, setAutoSave] = useState(false);

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
            <h2 className="text-xl font-semibold mb-1">Anonymous User</h2>
            <p className="text-gray-500 text-sm">DrugScan User</p>
          </CardContent>
        </Card>

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
