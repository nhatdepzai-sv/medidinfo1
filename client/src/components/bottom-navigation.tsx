import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Home, History, User, Languages } from "lucide-react";
import { useLanguage } from "@/contexts/language-context";

export default function BottomNavigation() {
  const [location, setLocation] = useLocation();
  const { t } = useLanguage();

  const tabs = [
    { id: "home", label: t("home"), icon: Home, path: "/" },
    { id: "history", label: t("history"), icon: History, path: "/history" },
    { id: "translator", label: "Translate", icon: Languages, path: "/translator" },
    { id: "profile", label: t("profile"), icon: User, path: "/profile" },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 w-full bg-white border-t border-gray-200 px-4 py-2 z-50 safe-area-inset-bottom">
      <div className="flex justify-around items-center max-w-md mx-auto">
        {tabs.map(({ path, icon: Icon, label }) => {
          const isActive = location === path;

          return (
            <Button
              key={path}
              variant="ghost"
              size="sm"
              className={`flex flex-col items-center py-3 px-4 transition-colors min-h-[60px] touch-manipulation ${
                isActive
                  ? "text-primary bg-primary/10"
                  : "text-gray-400 hover:text-gray-600 hover:bg-gray-50"
              }`}
              onClick={() => setLocation(path)}
              aria-label={label}
            >
              <Icon className="w-6 h-6 mb-1" />
              <span className="text-xs font-medium">{label}</span>
            </Button>
          );
        })}
      </div>
    </nav>
  );
}