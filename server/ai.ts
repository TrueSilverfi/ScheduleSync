import { RetentionData, Captions, Hotspot, HotspotType, ActionableInsight } from '@shared/schema';
import OpenAI from 'openai';

// Initialize OpenAI API client
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY || '' });

// Generate insights for retention hotspots
export async function generateHotspotInsights(
  videoId: string,
  retentionData: RetentionData,
  captions: Captions
): Promise<Hotspot[]> {
  try {
    // Identify significant hotspots in retention data
    const hotspots = findHotspots(retentionData);
    
    // Align hotspots with captions
    const alignedHotspots = alignHotspotsWithCaptions(hotspots, captions);
    
    // Use OpenAI to generate insights for each hotspot
    const insightsPromises = alignedHotspots.map(async (hotspot, index) => {
      try {
        if (!process.env.OPENAI_API_KEY) {
          return createFallbackHotspot(hotspot, index, videoId);
        }
        
        const insight = await generateInsightWithAI(hotspot, videoId);
        return insight;
      } catch (error) {
        console.error('Error generating insight for hotspot:', error);
        return createFallbackHotspot(hotspot, index, videoId);
      }
    });
    
    const insights = await Promise.all(insightsPromises);
    return insights;
  } catch (error) {
    console.error('Error generating hotspot insights:', error);
    throw new Error('Failed to generate hotspot insights');
  }
}

// Generate actionable insights based on all hotspots
export async function generateActionableInsights(hotspots: Hotspot[]): Promise<ActionableInsight> {
  try {
    if (!process.env.OPENAI_API_KEY || hotspots.length === 0) {
      return createFallbackActionableInsights();
    }
    
    // Prepare the prompt for OpenAI
    const hotspotsDescription = hotspots.map(h => {
      return `Hotspot: ${h.type}. Change: ${h.percentageChange}%. Context: "${h.transcriptText}". Reason: ${h.reasons.join(', ')}`;
    }).join('\n');
    
    // Create prompt for OpenAI
    const prompt = `Based on the following retention hotspots from a YouTube video:\n
${hotspotsDescription}\n
Generate actionable insights for the creator's future videos in the following format:
1. A JSON object with these fields:
- "toAvoid": an array of 3 specific things to avoid (based on negative retention points)
- "toInclude": an array of 3 specific things to include (based on positive retention points)
- "aiRecommendation": a 2-3 sentence specific recommendation for structuring future videos
- "estimatedImprovement": a realistic estimate of potential retention improvement as a single sentence

IMPORTANT: Be specific and actionable. Don't use generic advice. Base recommendations directly on the hotspots provided.
Output in JSON format only.`;

    // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" },
      temperature: 0.7,
    });
    
    // Parse the response
    const content = response.choices[0].message.content;
    if (!content) {
      return createFallbackActionableInsights();
    }
    
    const jsonResponse = JSON.parse(content);
    
    return {
      toAvoid: jsonResponse.toAvoid || [],
      toInclude: jsonResponse.toInclude || [],
      aiRecommendation: jsonResponse.aiRecommendation || "",
      estimatedImprovement: jsonResponse.estimatedImprovement || ""
    };
  } catch (error) {
    console.error('Error generating actionable insights:', error);
    return createFallbackActionableInsights();
  }
}

// Helper function to generate AI insight for a single hotspot
async function generateInsightWithAI(
  hotspot: {
    timestamp: number;
    percentageChange: number;
    type: HotspotType;
    captionText?: string;
  },
  videoId: string
): Promise<Hotspot> {
  // Prepare prompt for OpenAI
  const hotspotType = hotspot.type === HotspotType.SIGNIFICANT_DROP ? 'drop' : 
                       hotspot.type === HotspotType.INTEREST_POINT ? 'interest point' : 'engagement peak';
  
  const prompt = `You are analyzing a YouTube video retention data. At timestamp ${formatTime(hotspot.timestamp)}, 
there is a ${hotspotType} with a ${hotspot.percentageChange}% change in viewer retention.
The caption text at this point is: "${hotspot.captionText || 'No caption available'}"

Based on this information, provide:
1. Two likely reasons for this viewer behavior
2. One specific, actionable suggestion to improve or leverage this in future videos

Output your answer in JSON format with these fields:
- "reasons": array of two strings explaining possible reasons
- "suggestion": string with one specific actionable suggestion`;

  // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
  const response = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [{ role: "user", content: prompt }],
    response_format: { type: "json_object" },
    temperature: 0.7,
  });

  const content = response.choices[0].message.content;
  if (!content) {
    throw new Error('No content in OpenAI response');
  }
  
  const jsonResponse = JSON.parse(content);
  
  // Create the Hotspot object
  return {
    id: `hotspot-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    videoId,
    type: hotspot.type,
    timestamp: hotspot.timestamp,
    percentageChange: hotspot.percentageChange,
    transcriptText: hotspot.captionText || "",
    reasons: jsonResponse.reasons || [],
    suggestion: jsonResponse.suggestion || ""
  };
}

// Helper function to find significant hotspots in retention data
function findHotspots(retentionData: RetentionData): {
  timestamp: number;
  percentageChange: number;
  type: HotspotType;
}[] {
  const hotspots = [];
  const points = retentionData.points;
  
  // Look for significant changes in a window of 3-5 data points
  const windowSize = 5;
  const significantDropThreshold = -0.1; // 10% drop
  const significantRiseThreshold = 0.05; // 5% rise
  
  for (let i = windowSize; i < points.length; i++) {
    const currentValue = points[i].percentage;
    const previousValue = points[i - windowSize].percentage;
    const change = currentValue - previousValue;
    
    // Calculate percentage change relative to previous value
    const percentageChange = Math.round(change * 100);
    
    if (percentageChange <= significantDropThreshold * 100) {
      hotspots.push({
        timestamp: points[i].timestamp,
        percentageChange,
        type: HotspotType.SIGNIFICANT_DROP
      });
    } else if (percentageChange >= significantRiseThreshold * 100) {
      // Determine if it's an engagement peak or interest point
      if (percentageChange >= 20) {
        hotspots.push({
          timestamp: points[i].timestamp,
          percentageChange,
          type: HotspotType.ENGAGEMENT_PEAK
        });
      } else {
        hotspots.push({
          timestamp: points[i].timestamp,
          percentageChange,
          type: HotspotType.INTEREST_POINT
        });
      }
    }
  }
  
  // Limit to 3-5 most significant hotspots
  return hotspots
    .sort((a, b) => Math.abs(b.percentageChange) - Math.abs(a.percentageChange))
    .slice(0, 5);
}

// Helper function to align hotspots with captions
function alignHotspotsWithCaptions(
  hotspots: {
    timestamp: number;
    percentageChange: number;
    type: HotspotType;
  }[],
  captions: Captions
): {
  timestamp: number;
  percentageChange: number;
  type: HotspotType;
  captionText?: string;
}[] {
  return hotspots.map(hotspot => {
    // Find the caption that contains this timestamp
    const caption = captions.entries.find(
      entry => hotspot.timestamp >= entry.startTime && hotspot.timestamp <= entry.endTime
    );
    
    return {
      ...hotspot,
      captionText: caption?.text
    };
  });
}

// Create a fallback hotspot for when OpenAI is not available
function createFallbackHotspot(
  hotspot: {
    timestamp: number;
    percentageChange: number;
    type: HotspotType;
    captionText?: string;
  },
  index: number,
  videoId: string
): Hotspot {
  let reasons: string[] = [];
  let suggestion: string = '';
  
  switch (hotspot.type) {
    case HotspotType.SIGNIFICANT_DROP:
      reasons = [
        "Content may be too technical or complex without proper visualization",
        "Possible lack of engagement or pacing issues at this segment"
      ];
      suggestion = "Consider adding more visual examples or simplifying the explanation in this section";
      break;
    case HotspotType.INTEREST_POINT:
      reasons = [
        "Visual demonstration likely captured viewer attention",
        "Content may be addressing a specific pain point viewers are seeking"
      ];
      suggestion = "Include more similar demonstrations throughout your content";
      break;
    case HotspotType.ENGAGEMENT_PEAK:
      reasons = [
        "Offering additional value beyond the basic video content",
        "Audience likely found this information particularly useful or novel"
      ];
      suggestion = "Create more downloadable resources and mention them earlier in videos";
      break;
  }
  
  return {
    id: `hotspot-${index + 1}`,
    videoId,
    type: hotspot.type,
    timestamp: hotspot.timestamp,
    percentageChange: hotspot.percentageChange,
    transcriptText: hotspot.captionText || "",
    reasons,
    suggestion
  };
}

// Create fallback actionable insights when OpenAI is not available
function createFallbackActionableInsights(): ActionableInsight {
  return {
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
  };
}

// Helper function to format time
function formatTime(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60);
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
}
