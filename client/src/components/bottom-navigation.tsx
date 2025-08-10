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
    <nav className="fixed bottom-0 left-1/2 transform -translate-x-1/2 w-full max-w-md bg-white border-t border-gray-200 px-4 py-2">
      <div className="flex justify-around items-center">
        {tabs.map(({ path, icon: Icon, label }) => {
          const isActive = location === path;

          return (
            <Button
              key={path}
              variant="ghost"
              size="sm"
              className={`flex flex-col items-center py-2 px-3 transition-colors ${
                isActive
                  ? "text-primary"
                  : "text-gray-400 hover:text-gray-600"
              }`}
              onClick={() => setLocation(path)}
            >
              <Icon className="w-5 h-5 mb-1" />
              <span className="text-xs font-medium">{label}</span>
            </Button>
          );
        })}
      </div>
    </nav>
  );
}