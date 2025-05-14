import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

interface OAuthBannerProps {
  onConnect: () => void;
  isConnected: boolean;
}

export default function OAuthBanner({ onConnect, isConnected }: OAuthBannerProps) {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleConnect = async () => {
    setIsLoading(true);
    try {
      const response = await apiRequest('GET', '/api/auth/youtube/url');
      const data = await response.json();
      
      // Redirect to Google OAuth consent screen
      window.location.href = data.url;
    } catch (error) {
      console.error('Failed to get OAuth URL:', error);
      toast({
        title: "Connection Error",
        description: "Failed to connect to YouTube. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (isConnected) {
    return null;
  }

  return (
    <div className="mb-6 bg-white rounded-lg shadow-md p-6 flex flex-col md:flex-row items-center justify-between">
      <div className="mb-4 md:mb-0">
        <h2 className="text-xl font-medium mb-2">Connect your YouTube channel</h2>
        <p className="text-[#666666]">Get insights on your video retention and understand why viewers drop off.</p>
      </div>
      <Button
        className="bg-[#FF0000] hover:bg-red-700 font-medium rounded-full flex items-center"
        onClick={handleConnect}
        disabled={isLoading}
      >
        <span className="material-icons mr-2">link</span>
        {isLoading ? "Connecting..." : "Connect Channel"}
      </Button>
    </div>
  );
}
