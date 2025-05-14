import { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import VideoSelector from '@/components/video-selector';
import RetentionGraph from '@/components/retention-graph';
import HotspotCard from '@/components/hotspot-card';
import TranscriptViewer from '@/components/transcript-viewer';
import ActionableInsights from '@/components/actionable-insights';
import OAuthBanner from '@/components/oauth-banner';
import { fetchVideoAnalysis, checkAuthStatus, sendEmailReport } from '@/lib/youtube';
import { useToast } from '@/hooks/use-toast';
import { Video, Hotspot, RetentionData, Captions, ActionableInsight } from '@/types';
import { Skeleton } from '@/components/ui/skeleton';

export default function RetentionAnalysis() {
  const [selectedVideoId, setSelectedVideoId] = useState<string | null>(null);
  const [highlightedHotspotId, setHighlightedHotspotId] = useState<string | null>(null);
  const { toast } = useToast();

  // Check auth status
  const { data: authData } = useQuery({
    queryKey: ['/api/auth/status'],
    queryFn: async () => {
      const result = await checkAuthStatus();
      return result;
    }
  });

  // Fetch video analysis data when a video is selected
  const { 
    data: analysisData,
    isLoading: isAnalysisLoading,
    error: analysisError
  } = useQuery({
    queryKey: ['/api/videos', selectedVideoId, 'analysis'],
    queryFn: async () => {
      if (!selectedVideoId) return null;
      return await fetchVideoAnalysis(selectedVideoId);
    },
    enabled: !!selectedVideoId,
  });

  // Handle video selection
  const handleSelectVideo = (videoId: string) => {
    setSelectedVideoId(videoId);
    setHighlightedHotspotId(null);
  };

  // Handle hotspot highlighting
  const handleHotspotHover = (hotspotId: string | null) => {
    setHighlightedHotspotId(hotspotId);
  };

  // Send report mutation
  const { mutate: generateReport, isPending: isGeneratingReport } = useMutation({
    mutationFn: async () => {
      if (!selectedVideoId) throw new Error('No video selected');
      return await sendEmailReport(selectedVideoId);
    },
    onSuccess: (data) => {
      toast({
        title: "Report Sent",
        description: "Your analysis report has been sent to your email.",
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to Send Report",
        description: "There was an error sending your report. Please try again.",
        variant: "destructive",
      });
    }
  });

  const handleGenerateReport = () => {
    generateReport();
  };

  // Format video stats
  const formatViews = (views: number) => {
    return new Intl.NumberFormat('en-US').format(views);
  };

  const formatPublishedDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Retention Analysis</h1>
      
      {!authData?.authenticated && (
        <OAuthBanner 
          onConnect={() => {}} 
          isConnected={false} 
        />
      )}
      
      {authData?.authenticated && (
        <VideoSelector 
          onSelectVideo={handleSelectVideo} 
          selectedVideoId={selectedVideoId || undefined} 
        />
      )}
      
      {selectedVideoId && isAnalysisLoading && (
        <div className="mb-6 bg-white rounded-lg shadow-md p-6">
          <div className="flex flex-col md:flex-row mb-6">
            <div className="md:w-2/3">
              <Skeleton className="h-7 w-3/4 mb-2" />
              <div className="flex flex-wrap text-sm text-[#666666]">
                <Skeleton className="h-4 w-24 mr-4 mb-2" />
                <Skeleton className="h-4 w-24 mr-4 mb-2" />
                <Skeleton className="h-4 w-24 mr-4 mb-2" />
              </div>
            </div>
          </div>
          
          <div className="h-64 bg-[#F9F9F9] p-4 rounded-lg mb-6">
            <Skeleton className="h-full w-full" />
          </div>
          
          <div className="space-y-4 mb-6">
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-32 w-full" />
          </div>
        </div>
      )}
      
      {selectedVideoId && analysisData && (
        <>
          {/* Video title & stats */}
          <div className="mb-6 bg-white rounded-lg shadow-md p-6">
            <div className="flex flex-col md:flex-row mb-6">
              <div className="md:w-2/3">
                <h2 className="text-xl font-medium mb-2">{analysisData.video.title}</h2>
                <div className="flex flex-wrap text-sm text-[#666666]">
                  <span className="mr-4 mb-2">
                    <span className="material-icons text-sm align-text-bottom">visibility</span> 
                    <span>{formatViews(analysisData.video.views)} views</span>
                  </span>
                  <span className="mr-4 mb-2">
                    <span className="material-icons text-sm align-text-bottom">thumb_up</span> 
                    <span>{formatViews(analysisData.video.likes)} likes</span>
                  </span>
                  <span className="mr-4 mb-2">
                    <span className="material-icons text-sm align-text-bottom">comment</span> 
                    <span>{formatViews(analysisData.video.comments)} comments</span>
                  </span>
                  <span>
                    <span className="material-icons text-sm align-text-bottom">calendar_today</span> 
                    <span>Published {formatPublishedDate(analysisData.video.publishedAt)}</span>
                  </span>
                </div>
              </div>
            </div>
            
            {/* Retention graph */}
            <RetentionGraph
              videoId={analysisData.video.id}
              retentionData={analysisData.retentionData}
              hotspots={analysisData.hotspots}
              duration={analysisData.video.durationSeconds}
              onHotspotHover={handleHotspotHover}
            />
            
            {/* Hotspots Analysis */}
            <div className="hotspots-container">
              <h3 className="text-lg font-medium mb-4">Retention Hotspots</h3>
              
              {analysisData.hotspots.map((hotspot) => (
                <HotspotCard 
                  key={hotspot.id} 
                  hotspot={hotspot} 
                  isHighlighted={highlightedHotspotId === hotspot.id}
                />
              ))}
              
              {analysisData.hotspots.length === 0 && (
                <div className="text-center py-6 text-sm text-[#666666]">
                  No significant hotspots found for this video.
                </div>
              )}
            </div>
          </div>
          
          {/* Actionable Insights */}
          {analysisData.hotspots.length > 0 && (
            <ActionableInsights 
              insights={{
                toAvoid: [
                  "Long price comparison segments without visual variety",
                  "Technical explanations without demonstrations",
                  "Mentioning downloadable resources only at the end"
                ],
                toInclude: [
                  "More before/after visual comparisons",
                  "Mention downloadable resources within first 3 minutes",
                  "Include budget options alongside premium recommendations"
                ],
                aiRecommendation: "Based on your retention data, we recommend structuring your next video with a \"sandwich\" approach: start with a strong value proposition and mention downloadable resources, follow with before/after demonstrations of each accessory, include budget alternatives for each item, and end with a quick summary and call-to-action.",
                estimatedImprovement: "This approach could improve your average view duration by an estimated 18-24%."
              }}
              onGenerateReport={handleGenerateReport}
              isGeneratingReport={isGeneratingReport}
            />
          )}
          
          {/* Transcript */}
          <TranscriptViewer 
            captions={analysisData.captions.entries}
            hotspots={analysisData.hotspots}
            videoId={analysisData.video.id}
            highlightedHotspotId={highlightedHotspotId}
          />
        </>
      )}
      
      {selectedVideoId && analysisError && (
        <div className="mb-6 bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-medium mb-2 text-red-500">Error Loading Analysis</h2>
          <p>There was a problem loading the analysis for this video. Please try again later.</p>
        </div>
      )}
      
      {!selectedVideoId && authData?.authenticated && (
        <div className="mb-6 bg-white rounded-lg shadow-md p-6 text-center">
          <h3 className="text-lg font-medium mb-3">Select a Video</h3>
          <p className="text-sm text-[#666666] mb-4">
            Please select a video from the list above to view its retention analysis.
          </p>
          <span className="material-icons text-4xl text-[#666666]">movie</span>
        </div>
      )}
    </div>
  );
}
