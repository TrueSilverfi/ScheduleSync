import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Lightbulb, TrendingUp, Eye, Users, Clock, BarChart3 } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { Video } from "@/types";

interface VideoComparisonProps {
  currentVideoId?: string;
}

interface VideoComparisonResult {
  video1: Video;
  video2: Video;
  performanceMetrics: {
    viewsRatio: number;
    engagementRatio: number;
    retentionRatio: number;
    subscriberGrowthRatio: number;
    ctrRatio: number;
  };
  insights: string;
  keyDifferences: string[];
  recommendations: string[];
}

export default function VideoComparison({ currentVideoId }: VideoComparisonProps) {
  const [selectedVideo1, setSelectedVideo1] = useState<string>(currentVideoId || "");
  const [selectedVideo2, setSelectedVideo2] = useState<string>("");

  const { data: videos } = useQuery<Video[]>({
    queryKey: ['/api/videos'],
  });

  const compareVideosMutation = useMutation({
    mutationFn: async ({ video1Id, video2Id }: { video1Id: string; video2Id: string }) => {
      return apiRequest("/api/videos/compare", {
        method: "POST",
        body: JSON.stringify({ video1Id, video2Id }),
        headers: { "Content-Type": "application/json" }
      }) as Promise<VideoComparisonResult>;
    }
  });

  const handleCompare = () => {
    if (selectedVideo1 && selectedVideo2 && selectedVideo1 !== selectedVideo2) {
      compareVideosMutation.mutate({ video1Id: selectedVideo1, video2Id: selectedVideo2 });
    }
  };

  const getPerformanceIndicator = (ratio: number) => {
    if (ratio > 1.2) return { color: "text-green-600", label: "Much Better" };
    if (ratio > 1.05) return { color: "text-green-500", label: "Better" };
    if (ratio > 0.95) return { color: "text-yellow-500", label: "Similar" };
    if (ratio > 0.8) return { color: "text-orange-500", label: "Worse" };
    return { color: "text-red-600", label: "Much Worse" };
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BarChart3 className="h-5 w-5" />
          Video Comparison
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Video 1</label>
            <Select value={selectedVideo1} onValueChange={setSelectedVideo1}>
              <SelectTrigger>
                <SelectValue placeholder="Select first video" />
              </SelectTrigger>
              <SelectContent>
                {videos?.map((video) => (
                  <SelectItem key={video.id} value={video.id}>
                    {video.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Video 2</label>
            <Select value={selectedVideo2} onValueChange={setSelectedVideo2}>
              <SelectTrigger>
                <SelectValue placeholder="Select second video" />
              </SelectTrigger>
              <SelectContent>
                {videos?.map((video) => (
                  <SelectItem key={video.id} value={video.id}>
                    {video.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <Button 
          onClick={handleCompare}
          disabled={!selectedVideo1 || !selectedVideo2 || selectedVideo1 === selectedVideo2 || compareVideosMutation.isPending}
          className="w-full"
        >
          {compareVideosMutation.isPending ? "Analyzing..." : "Compare Videos"}
        </Button>

        {compareVideosMutation.data && (
          <div className="space-y-6 pt-4">
            <div className="grid grid-cols-2 gap-4">
              <Card className="p-4">
                <h4 className="font-semibold text-sm mb-2">Video 1</h4>
                <p className="text-sm font-medium">{compareVideosMutation.data.video1.title}</p>
                <div className="mt-2 space-y-1 text-xs text-muted-foreground">
                  <div className="flex justify-between">
                    <span>Views:</span>
                    <span>{formatNumber(compareVideosMutation.data.video1.views!)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Likes:</span>
                    <span>{formatNumber(compareVideosMutation.data.video1.likes!)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Subscribers:</span>
                    <span>+{compareVideosMutation.data.video1.subscribersGained}</span>
                  </div>
                </div>
              </Card>

              <Card className="p-4">
                <h4 className="font-semibold text-sm mb-2">Video 2</h4>
                <p className="text-sm font-medium">{compareVideosMutation.data.video2.title}</p>
                <div className="mt-2 space-y-1 text-xs text-muted-foreground">
                  <div className="flex justify-between">
                    <span>Views:</span>
                    <span>{formatNumber(compareVideosMutation.data.video2.views!)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Likes:</span>
                    <span>{formatNumber(compareVideosMutation.data.video2.likes!)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Subscribers:</span>
                    <span>+{compareVideosMutation.data.video2.subscribersGained}</span>
                  </div>
                </div>
              </Card>
            </div>

            <div className="space-y-4">
              <h4 className="font-semibold flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                Performance Metrics
              </h4>

              {Object.entries(compareVideosMutation.data.performanceMetrics).map(([key, ratio]) => {
                const indicator = getPerformanceIndicator(ratio as number);
                const metricNames: Record<string, string> = {
                  viewsRatio: "Views",
                  engagementRatio: "Engagement",
                  retentionRatio: "Retention",
                  subscriberGrowthRatio: "Subscriber Growth",
                  ctrRatio: "Click-Through Rate"
                };

                return (
                  <div key={key} className="flex items-center justify-between">
                    <span className="text-sm font-medium">{metricNames[key]}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">
                        {(ratio as number).toFixed(2)}x
                      </span>
                      <Badge variant="outline" className={indicator.color}>
                        {indicator.label}
                      </Badge>
                    </div>
                  </div>
                );
              })}
            </div>

            <Separator />

            <div className="space-y-4">
              <h4 className="font-semibold flex items-center gap-2">
                <Eye className="h-4 w-4" />
                Key Insights
              </h4>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {compareVideosMutation.data.insights}
              </p>
            </div>

            {compareVideosMutation.data.keyDifferences.length > 0 && (
              <div className="space-y-3">
                <h4 className="font-semibold">Key Differences</h4>
                <ul className="space-y-2">
                  {compareVideosMutation.data.keyDifferences.map((difference, index) => (
                    <li key={index} className="text-sm text-muted-foreground flex items-start gap-2">
                      <span className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-2 flex-shrink-0"></span>
                      {difference}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="space-y-3">
              <h4 className="font-semibold flex items-center gap-2">
                <Lightbulb className="h-4 w-4" />
                Recommendations
              </h4>
              <ul className="space-y-2">
                {compareVideosMutation.data.recommendations.map((recommendation, index) => (
                  <li key={index} className="text-sm text-muted-foreground flex items-start gap-2">
                    <span className="w-1.5 h-1.5 bg-green-500 rounded-full mt-2 flex-shrink-0"></span>
                    {recommendation}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {compareVideosMutation.error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-600">
              Failed to compare videos. Please try again.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}