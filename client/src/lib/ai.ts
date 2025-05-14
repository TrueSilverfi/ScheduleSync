import { apiRequest } from './queryClient';
import { Hotspot, ActionableInsight } from '@/types';

// Generate insights for a specific hotspot
export async function generateHotspotInsight(
  videoId: string,
  timestamp: number,
  percentageChange: number,
  transcriptText: string
): Promise<Hotspot> {
  const response = await apiRequest('POST', `/api/ai/hotspot-insight`, {
    videoId,
    timestamp,
    percentageChange,
    transcriptText,
  });
  
  return response.json();
}

// Generate actionable insights based on all hotspots
export async function generateActionableInsights(
  videoId: string,
  hotspots: Hotspot[]
): Promise<ActionableInsight> {
  const response = await apiRequest('POST', `/api/ai/actionable-insights`, {
    videoId,
    hotspots,
  });
  
  return response.json();
}
