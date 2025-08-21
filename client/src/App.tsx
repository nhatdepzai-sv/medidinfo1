import { lazy, Suspense, useState, useEffect } from "react";
import { Switch, Route } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "./contexts/theme-context";
import { LanguageProvider } from "./contexts/language-context";
import BottomNavigation from "./components/bottom-navigation";

// Lazy load pages for better performance
const Home = lazy(() => import("./pages/home"));
const History = lazy(() => import("./pages/history"));
const Profile = lazy(() => import("./pages/profile"));
const Translator = lazy(() => import("./pages/translator"));
const NotFound = lazy(() => import("./pages/not-found"));

function App() {
  return (
    <LanguageProvider>
      <ThemeProvider>
        <QueryClientProvider client={queryClient}>
          <TooltipProvider>
            <div className="min-h-screen bg-gray-50 flex flex-col">
              <main className="flex-1 overflow-auto">
                <Suspense fallback={
                  <div className="flex items-center justify-center min-h-screen">
                    <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full"></div>
                  </div>
                }>
                  <Switch>
                    <Route path="/" component={Home} />
                    <Route path="/history" component={History} />
                    <Route path="/translator" component={Translator} />
                    <Route path="/profile" component={Profile} />
                    <Route component={NotFound} />
                  </Switch>
                </Suspense>
              </main>
              <BottomNavigation />
              <Toaster />
            </div>
          </TooltipProvider>
        </QueryClientProvider>
      </ThemeProvider>
    </LanguageProvider>
  );
}

export default App;