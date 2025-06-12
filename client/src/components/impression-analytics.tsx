import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Eye, Clock, MousePointer, BarChart3 } from "lucide-react";

interface ImpressionAnalyticsProps {
  videoId: string;
}

interface ImpressionData {
  videoId: string;
  impressions: number;
  clickThroughRate: number;
  averageWatchTime: number;
  watchTimePercentage: number;
  impressionSource: {
    browse: number;
    search: number;
    suggested: number;
    external: number;
  };
}

export default function ImpressionAnalytics({ videoId }: ImpressionAnalyticsProps) {
  const { data: impressionData, isLoading, error } = useQuery<ImpressionData>({
    queryKey: ['/api/videos', videoId, 'impression-analytics'],
    enabled: !!videoId
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Eye className="h-5 w-5" />
            Impression Analytics
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

  if (error || !impressionData) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Eye className="h-5 w-5" />
            Impression Analytics
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Unable to load impression analytics</p>
        </CardContent>
      </Card>
    );
  }

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const totalImpressions = impressionData.impressions;
  const sources = [
    { name: "Browse", value: impressionData.impressionSource.browse, color: "bg-blue-500" },
    { name: "Search", value: impressionData.impressionSource.search, color: "bg-green-500" },
    { name: "Suggested", value: impressionData.impressionSource.suggested, color: "bg-yellow-500" },
    { name: "External", value: impressionData.impressionSource.external, color: "bg-purple-500" }
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Eye className="h-5 w-5" />
          Impression Analytics
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Eye className="h-4 w-4 text-blue-500" />
              <span className="text-sm font-medium">Total Impressions</span>
            </div>
            <p className="text-2xl font-bold">
              {totalImpressions.toLocaleString()}
            </p>
          </div>
          
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <MousePointer className="h-4 w-4 text-green-500" />
              <span className="text-sm font-medium">Click-Through Rate</span>
            </div>
            <p className="text-2xl font-bold text-green-600">
              {(impressionData.clickThroughRate * 100).toFixed(2)}%
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-orange-500" />
              <span className="text-sm font-medium">Avg Watch Time</span>
            </div>
            <p className="text-xl font-bold">
              {formatTime(impressionData.averageWatchTime)}
            </p>
          </div>
          
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-purple-500" />
              <span className="text-sm font-medium">Watch Time %</span>
            </div>
            <p className="text-xl font-bold">
              {(impressionData.watchTimePercentage * 100).toFixed(1)}%
            </p>
          </div>
        </div>

        <div className="space-y-3">
          <h4 className="font-semibold">Impression Sources</h4>
          {sources.map((source) => (
            <div key={source.name} className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">{source.name}</span>
                <span className="text-sm text-muted-foreground">
                  {source.value.toLocaleString()} ({((source.value / totalImpressions) * 100).toFixed(1)}%)
                </span>
              </div>
              <Progress 
                value={(source.value / totalImpressions) * 100} 
                className="h-2"
              />
            </div>
          ))}
        </div>

        <div className="bg-muted p-3 rounded-lg">
          <p className="text-sm text-muted-foreground">
            {impressionData.clickThroughRate > 0.05 
              ? `Strong CTR of ${(impressionData.clickThroughRate * 100).toFixed(2)}% indicates effective thumbnail and title.`
              : `CTR of ${(impressionData.clickThroughRate * 100).toFixed(2)}% suggests thumbnail or title optimization needed.`
            }
          </p>
        </div>
      </CardContent>
    </Card>
  );
}