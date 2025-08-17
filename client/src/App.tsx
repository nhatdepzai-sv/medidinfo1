import { Switch, Route } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "./contexts/theme-context";
import { LanguageProvider } from "./contexts/language-context";
import Home from "./pages/home";
import History from "./pages/history";
import TranslatorPage from "./pages/translator";
import Profile from "./pages/profile";
import NotFound from "./pages/not-found";

function App() {
  return (
    <LanguageProvider>
      <ThemeProvider>
        <QueryClientProvider client={queryClient}>
          <TooltipProvider>
            <div className="min-h-screen bg-gray-50">
              <Switch>
                <Route path="/" component={Home} />
                <Route path="/history" component={History} />
                <Route path="/translator" component={TranslatorPage} />
                <Route path="/profile" component={Profile} />
                <Route component={NotFound} />
              </Switch>
              <Toaster />
            </div>
          </TooltipProvider>
        </QueryClientProvider>
      </ThemeProvider>
    </LanguageProvider>
  );
}

export default App;