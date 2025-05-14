import { useState, useEffect } from "react";
import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import Dashboard from "@/pages/dashboard";
import RetentionAnalysis from "@/pages/retention-analysis";
import Videos from "@/pages/videos";
import Settings from "@/pages/settings";
import { useToast } from "@/hooks/use-toast";
import Sidebar from "@/components/sidebar";

function Router() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const { toast } = useToast();

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  // Listen for screen size changes
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setIsSidebarOpen(false); // Close mobile sidebar on larger screens
      }
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return (
    <div className="flex min-h-screen bg-[#F9F9F9]">
      <Sidebar isOpen={isSidebarOpen} />
      
      <div className="flex-1 pl-0 lg:pl-64">
        {/* Mobile Header */}
        <header className="lg:hidden bg-white p-4 shadow-md flex items-center justify-between sticky top-0 z-10">
          <button className="material-icons" onClick={toggleSidebar}>
            menu
          </button>
          <div className="flex items-center">
            <span className="material-icons text-[#FF0000] mr-2">smart_display</span>
            <h1 className="text-xl font-bold">YTInsights</h1>
          </div>
          <div className="w-8"></div>
        </header>

        <main className="p-4 md:p-6">
          <Switch>
            <Route path="/" component={Dashboard} />
            <Route path="/retention-analysis" component={RetentionAnalysis} />
            <Route path="/videos" component={Videos} />
            <Route path="/settings" component={Settings} />
            <Route component={NotFound} />
          </Switch>
        </main>
      </div>
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
