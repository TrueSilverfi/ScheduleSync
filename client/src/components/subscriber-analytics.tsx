import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, Users } from "lucide-react";

interface SubscriberAnalyticsProps {
  videoId: string;
}

interface SubscriberData {
  videoId: string;
  subscribersGained: number;
  subscribersLost: number;
  netGrowth: number;
  growthRate: number;
}

export default function SubscriberAnalytics({ videoId }: SubscriberAnalyticsProps) {
  const { data: subscriberData, isLoading, error } = useQuery<SubscriberData>({
    queryKey: ['/api/videos', videoId, 'subscriber-analytics'],
    enabled: !!videoId
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Subscriber Analytics
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error || !subscriberData) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Subscriber Analytics
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Unable to load subscriber analytics</p>
        </CardContent>
      </Card>
    );
  }

  const isPositiveGrowth = subscriberData.netGrowth > 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          Subscriber Analytics
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-green-500" />
              <span className="text-sm font-medium">Gained</span>
            </div>
            <p className="text-2xl font-bold text-green-600">
              +{subscriberData.subscribersGained}
            </p>
          </div>
          
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <TrendingDown className="h-4 w-4 text-red-500" />
              <span className="text-sm font-medium">Lost</span>
            </div>
            <p className="text-2xl font-bold text-red-600">
              -{subscriberData.subscribersLost}
            </p>
          </div>
        </div>

        <div className="border-t pt-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Net Growth</span>
            <Badge variant={isPositiveGrowth ? "default" : "destructive"}>
              {isPositiveGrowth ? "+" : ""}{subscriberData.netGrowth}
            </Badge>
          </div>
          
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Growth Rate</span>
            <span className={`text-sm font-bold ${isPositiveGrowth ? 'text-green-600' : 'text-red-600'}`}>
              {subscriberData.growthRate.toFixed(1)}%
            </span>
          </div>
        </div>

        <div className="bg-muted p-3 rounded-lg">
          <p className="text-sm text-muted-foreground">
            {isPositiveGrowth 
              ? `This video drove positive subscriber growth, gaining ${subscriberData.subscribersGained} subscribers.`
              : `This video had a net loss of ${Math.abs(subscriberData.netGrowth)} subscribers.`
            }
          </p>
        </div>
      </CardContent>
    </Card>
  );
}