import { useRef, useEffect, useState } from 'react';
import { CaptionEntry, Hotspot } from '@/types';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

interface TranscriptViewerProps {
  captions: CaptionEntry[];
  hotspots: Hotspot[];
  videoId: string;
  highlightedHotspotId: string | null;
}

export default function TranscriptViewer({ 
  captions, 
  hotspots, 
  videoId,
  highlightedHotspotId
}: TranscriptViewerProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredCaptions, setFilteredCaptions] = useState<CaptionEntry[]>(captions);
  const transcriptRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const [exportLoading, setExportLoading] = useState(false);

  // Format time to MM:SS
  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  // Search functionality
  useEffect(() => {
    if (searchTerm.trim() === '') {
      setFilteredCaptions(captions);
      return;
    }

    const filtered = captions.filter(caption => 
      caption.text.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredCaptions(filtered);
  }, [searchTerm, captions]);

  // When highlightedHotspotId changes, scroll to that caption
  useEffect(() => {
    if (highlightedHotspotId && transcriptRef.current) {
      const hotspot = hotspots.find(h => h.id === highlightedHotspotId);
      if (hotspot) {
        const highlightedCaption = transcriptRef.current.querySelector(`[data-time="${Math.floor(hotspot.timestamp)}"]`);
        if (highlightedCaption) {
          highlightedCaption.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }
    }
  }, [highlightedHotspotId, hotspots]);

  // Check if a caption corresponds to a hotspot
  const getHotspotForCaption = (caption: CaptionEntry): Hotspot | undefined => {
    return hotspots.find(hotspot => {
      const captionMiddle = (caption.startTime + caption.endTime) / 2;
      // Allow for a small window around the timestamp to match captions
      return Math.abs(captionMiddle - hotspot.timestamp) < 2; // 2 seconds tolerance
    });
  };

  // Export transcript
  const handleExport = async () => {
    setExportLoading(true);
    try {
      const response = await apiRequest('GET', `/api/videos/${videoId}/transcript/export`);
      const blob = await response.blob();
      
      // Create a download link
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = `transcript-${videoId}.txt`;
      document.body.appendChild(a);
      a.click();
      
      // Clean up
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast({
        title: "Transcript Exported",
        description: "Your transcript has been exported successfully.",
      });
    } catch (error) {
      console.error('Failed to export transcript:', error);
      toast({
        title: "Export Failed",
        description: "Failed to export transcript. Please try again.",
        variant: "destructive",
      });
    } finally {
      setExportLoading(false);
    }
  };

  return (
    <div className="mb-6 bg-white rounded-lg shadow-md p-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-medium">Video Transcript</h3>
        <div className="flex">
          <div className="mr-2 relative">
            <Input
              type="text"
              placeholder="Search transcript..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="h-8 text-sm"
            />
            {searchTerm && (
              <button 
                className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                onClick={() => setSearchTerm('')}
              >
                <span className="material-icons text-sm">close</span>
              </button>
            )}
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            className="h-8"
            onClick={handleExport}
            disabled={exportLoading}
          >
            <span className="material-icons text-sm mr-1">download</span>
            Export
          </Button>
        </div>
      </div>
      
      <div className="max-h-60 overflow-y-auto pr-2" ref={transcriptRef}>
        {filteredCaptions.length > 0 ? (
          filteredCaptions.map((caption, index) => {
            const hotspot = getHotspotForCaption(caption);
            let bgColor = '';
            
            if (hotspot) {
              switch (hotspot.type) {
                case 'SIGNIFICANT_DROP':
                  bgColor = 'bg-red-50';
                  break;
                case 'INTEREST_POINT':
                  bgColor = 'bg-yellow-50';
                  break;
                case 'ENGAGEMENT_PEAK':
                  bgColor = 'bg-green-50';
                  break;
              }
            }
            
            const isHighlighted = hotspot?.id === highlightedHotspotId;

            return (
              <div 
                key={index} 
                className={`transcript-item flex mb-3 ${bgColor} ${isHighlighted ? 'p-2 ring-2 ring-opacity-50 ring-blue-500' : bgColor ? 'p-2' : ''} rounded`}
                data-time={Math.floor(caption.startTime)}
                data-hotspot={hotspot?.id}
              >
                <span className="text-sm text-[#666666] w-16 flex-shrink-0">
                  {formatTime(caption.startTime)}
                </span>
                <p className={`text-sm ${isHighlighted ? 'font-medium' : ''}`}>
                  {caption.text}
                </p>
              </div>
            );
          })
        ) : (
          <div className="text-center py-4 text-sm text-gray-500">
            {searchTerm ? "No matching text found in transcript." : "No transcript available for this video."}
          </div>
        )}
      </div>
    </div>
  );
}
