import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { logout, checkAuthStatus } from '@/lib/youtube';
import OAuthBanner from '@/components/oauth-banner';
import { apiRequest } from '@/lib/queryClient';

export default function Settings() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [email, setEmail] = useState('');
  const [isEmailUpdating, setIsEmailUpdating] = useState(false);
  
  // Check if user is authenticated
  const { data: authData, isLoading } = useQuery({
    queryKey: ['/api/auth/status'],
    queryFn: async () => {
      const result = await checkAuthStatus();
      return result;
    }
  });

  // Fetch user profile 
  const { data: userProfile } = useQuery<{
    email: string;
    notificationsEnabled: boolean;
  }>({
    queryKey: ['/api/user/profile'],
    enabled: authData?.authenticated,
  });

  // Update profile settings
  const updateProfile = useMutation({
    mutationFn: async (data: { notificationsEnabled?: boolean; email?: string }) => {
      return await apiRequest('PATCH', '/api/user/profile', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/user/profile'] });
      toast({
        title: "Settings Updated",
        description: "Your profile settings have been updated successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Update Failed",
        description: "Failed to update your settings. Please try again.",
        variant: "destructive",
      });
    }
  });

  // Logout mutation
  const logoutMutation = useMutation({
    mutationFn: logout,
    onSuccess: () => {
      queryClient.invalidateQueries();
      toast({
        title: "Logged Out",
        description: "You have been successfully logged out.",
      });
      // Force reload to clear any state
      window.location.href = "/";
    },
    onError: () => {
      toast({
        title: "Logout Failed",
        description: "Failed to log out. Please try again.",
        variant: "destructive",
      });
    }
  });

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  const handleNotificationsToggle = (checked: boolean) => {
    setEmailNotifications(checked);
    updateProfile.mutate({ notificationsEnabled: checked });
  };

  const handleUpdateEmail = () => {
    if (!email) return;
    
    setIsEmailUpdating(true);
    updateProfile.mutate(
      { email },
      {
        onSettled: () => {
          setIsEmailUpdating(false);
        }
      }
    );
  };

  // Effect to set initial values from userProfile
  useState(() => {
    if (userProfile) {
      setEmailNotifications(userProfile.notificationsEnabled);
      setEmail(userProfile.email || '');
    }
  });

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Settings</h1>
      
      {!authData?.authenticated && (
        <OAuthBanner onConnect={() => {}} isConnected={false} />
      )}
      
      {authData?.authenticated && (
        <div className="grid gap-6">
          <Card className="bg-white shadow-md">
            <CardHeader>
              <CardTitle className="text-lg">Account Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-col space-y-1.5">
                <Label htmlFor="email">Email Address</Label>
                <div className="flex">
                  <Input
                    id="email"
                    placeholder="your@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="flex-1 mr-2"
                  />
                  <Button 
                    onClick={handleUpdateEmail}
                    disabled={isEmailUpdating || !email}
                  >
                    Update
                  </Button>
                </div>
                <p className="text-xs text-[#666666]">
                  Your email is used for sending reports and notifications.
                </p>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="notifications">Email Notifications</Label>
                  <p className="text-xs text-[#666666]">
                    Receive email notifications for reports and insights.
                  </p>
                </div>
                <Switch
                  id="notifications"
                  checked={emailNotifications}
                  onCheckedChange={handleNotificationsToggle}
                />
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-white shadow-md">
            <CardHeader>
              <CardTitle className="text-lg">YouTube Connection</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center">
                <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center mr-3">
                  <span className="material-icons text-green-600">check_circle</span>
                </div>
                <div>
                  <p className="font-medium">Connected to YouTube</p>
                  <p className="text-xs text-[#666666]">Your YouTube account is connected to YTInsights.</p>
                </div>
              </div>
              
              <div className="flex flex-col space-y-2">
                <Button 
                  variant="outline" 
                  className="border-[#FF0000] text-[#FF0000] hover:bg-red-50"
                  onClick={handleLogout}
                >
                  <span className="material-icons mr-2 text-sm">logout</span>
                  Disconnect YouTube Account
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
