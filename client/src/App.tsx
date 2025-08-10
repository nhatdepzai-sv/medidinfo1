
import { Switch, Route, Router } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { LanguageProvider } from "@/contexts/language-context";
import Home from "@/pages/home";
import History from "@/pages/history";
import Profile from "@/pages/profile";
import TranslatorPage from "@/pages/translator";
import NotFound from "@/pages/not-found";
import "./index.css";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <LanguageProvider>
          <Router>
            <div className="min-h-screen bg-background">
              <Switch>
                <Route path="/" component={Home} />
                <Route path="/history" component={History} />
                <Route path="/profile" component={Profile} />
                <Route path="/translator" component={TranslatorPage} />
                <Route component={NotFound} />
              </Switch>
            </div>
            <Toaster />
          </Router>
        </LanguageProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
