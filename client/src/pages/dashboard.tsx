import { useEffect } from 'react';
import { useLocation } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { checkAuthStatus } from '@/lib/youtube';
import OAuthBanner from '@/components/oauth-banner';

export default function Dashboard() {
  const [location, setLocation] = useLocation();
  
  // Check if user is authenticated
  const { data: authData, isLoading } = useQuery({
    queryKey: ['/api/auth/status'],
    queryFn: async () => {
      const result = await checkAuthStatus();
      return result;
    }
  });

  // Handle successful OAuth connection (redirect from Google)
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');
    const error = urlParams.get('error');
    
    if (code) {
      // Remove the code from the URL
      window.history.replaceState({}, document.title, window.location.pathname);
    }
    
    if (error) {
      console.error('OAuth error:', error);
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  const handleConnect = () => {
    // Connection logic is handled in the OAuthBanner component
  };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Dashboard</h1>
      
      <OAuthBanner 
        onConnect={handleConnect} 
        isConnected={authData?.authenticated || false} 
      />
      
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="bg-white shadow-md">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Loading...</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="animate-pulse h-36 bg-gray-200 rounded"></div>
            </CardContent>
          </Card>
          <Card className="bg-white shadow-md">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Loading...</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="animate-pulse h-36 bg-gray-200 rounded"></div>
            </CardContent>
          </Card>
        </div>
      ) : authData?.authenticated ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <Card className="bg-white shadow-md">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Quick Start</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  <li className="flex items-start">
                    <span className="material-icons text-[#1976D2] mr-2">play_arrow</span>
                    <div>
                      <p className="font-medium">Analyze Video Retention</p>
                      <p className="text-sm text-[#666666]">Find out why viewers drop off and what keeps them engaged.</p>
                      <button 
                        className="mt-2 text-[#1976D2] text-sm font-medium flex items-center"
                        onClick={() => setLocation('/retention-analysis')}
                      >
                        Start Analysis
                        <span className="material-icons text-sm ml-1">arrow_forward</span>
                      </button>
                    </div>
                  </li>
                </ul>
              </CardContent>
            </Card>
            
            <Card className="bg-white shadow-md">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Help & Resources</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-start">
                    <span className="material-icons text-[#666666] mr-2 text-sm">article</span>
                    <a href="#" className="hover:text-[#1976D2]">How to interpret retention hotspots</a>
                  </li>
                  <li className="flex items-start">
                    <span className="material-icons text-[#666666] mr-2 text-sm">article</span>
                    <a href="#" className="hover:text-[#1976D2]">Tips for improving video engagement</a>
                  </li>
                  <li className="flex items-start">
                    <span className="material-icons text-[#666666] mr-2 text-sm">article</span>
                    <a href="#" className="hover:text-[#1976D2]">Understanding AI-powered insights</a>
                  </li>
                  <li className="flex items-start">
                    <span className="material-icons text-[#666666] mr-2 text-sm">help_outline</span>
                    <a href="#" className="hover:text-[#1976D2]">Contact support</a>
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>
          
          <Card className="bg-white shadow-md mb-6">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Latest Insights</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-center text-sm text-[#666666] py-6">
                You haven't analyzed any videos yet. Go to Retention Analysis to get started.
              </p>
              <div className="flex justify-center">
                <button 
                  className="bg-[#1976D2] hover:bg-blue-700 text-white font-medium py-2 px-4 rounded"
                  onClick={() => setLocation('/retention-analysis')}
                >
                  Start Analyzing
                </button>
              </div>
            </CardContent>
          </Card>
        </>
      ) : (
        <Card className="bg-white shadow-md">
          <CardHeader>
            <CardTitle className="text-xl">Welcome to YTInsights</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="mb-4">Connect your YouTube channel to get started with advanced retention analytics.</p>
            <p className="text-sm text-[#666666] mb-6">
              YTInsights helps you understand why viewers drop off and provides AI-generated insights to improve your content.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="p-4 border rounded-lg">
                <div className="flex items-center mb-2">
                  <span className="material-icons text-[#1976D2] mr-2">link</span>
                  <h3 className="font-medium">Connect</h3>
                </div>
                <p className="text-sm">Connect your YouTube channel using secure OAuth.</p>
              </div>
              <div className="p-4 border rounded-lg">
                <div className="flex items-center mb-2">
                  <span className="material-icons text-[#1976D2] mr-2">analytics</span>
                  <h3 className="font-medium">Analyze</h3>
                </div>
                <p className="text-sm">We analyze your audience retention and identify key hotspots.</p>
              </div>
              <div className="p-4 border rounded-lg">
                <div className="flex items-center mb-2">
                  <span className="material-icons text-[#1976D2] mr-2">lightbulb</span>
                  <h3 className="font-medium">Improve</h3>
                </div>
                <p className="text-sm">Get AI-powered insights to improve your future videos.</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
