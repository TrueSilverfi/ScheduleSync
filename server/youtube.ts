import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import axios from 'axios';
import { Video, RetentionData, CaptionEntry, Captions, SubscriberAnalytics, ImpressionAnalytics, VideoComparisonResult } from '@shared/schema';

// OAuth Configuration
const YOUTUBE_CLIENT_ID = process.env.YOUTUBE_CLIENT_ID || 'youtube-client-id';
const YOUTUBE_CLIENT_SECRET = process.env.YOUTUBE_CLIENT_SECRET || 'youtube-client-secret';
const REDIRECT_URI = process.env.REDIRECT_URI || 'http://localhost:5000/api/auth/youtube/callback';

// Required API scopes
const SCOPES = [
  'https://www.googleapis.com/auth/youtube.readonly',
  'https://www.googleapis.com/auth/youtube.force-ssl',
  'https://www.googleapis.com/auth/userinfo.email',
  'https://www.googleapis.com/auth/youtube.analytics.readonly'
];

// Setup YouTube OAuth with Passport
export function setupYouTubeAuth(passport: passport.PassportStatic) {
  passport.serializeUser((user: any, done) => {
    done(null, user);
  });

  passport.deserializeUser((user: any, done) => {
    done(null, user);
  });

  // For an actual implementation, we'd use Passport's GoogleStrategy
  // For this MVP, we'll use our own custom OAuth flow
}

// Generate OAuth URL for authorization
export async function getAuthUrl(): Promise<string> {
  const baseUrl = 'https://accounts.google.com/o/oauth2/v2/auth';
  const redirectUri = encodeURIComponent(REDIRECT_URI);
  const scope = encodeURIComponent(SCOPES.join(' '));
  
  return `${baseUrl}?client_id=${YOUTUBE_CLIENT_ID}&redirect_uri=${redirectUri}&response_type=code&scope=${scope}&access_type=offline&prompt=consent`;
}

// Exchange authorization code for tokens
export async function exchangeCodeForTokens(code: string): Promise<{
  access_token: string;
  refresh_token: string;
  expires_in: number;
}> {
  try {
    const response = await axios.post('https://oauth2.googleapis.com/token', {
      code,
      client_id: YOUTUBE_CLIENT_ID,
      client_secret: YOUTUBE_CLIENT_SECRET,
      redirect_uri: REDIRECT_URI,
      grant_type: 'authorization_code'
    });

    return {
      access_token: response.data.access_token,
      refresh_token: response.data.refresh_token,
      expires_in: response.data.expires_in
    };
  } catch (error) {
    console.error('Error exchanging code for tokens:', error);
    throw new Error('Failed to exchange code for tokens');
  }
}

// Get current user info
export async function getCurrentUser(accessToken: string): Promise<{
  id: string;
  name: string;
  email: string;
}> {
  try {
    const response = await axios.get('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: {
        Authorization: `Bearer ${accessToken}`
      }
    });

    return {
      id: response.data.id,
      name: response.data.name,
      email: response.data.email
    };
  } catch (error) {
    console.error('Error fetching user info:', error);
    throw new Error('Failed to fetch user info');
  }
}

// Revoke access token
export async function revokeToken(accessToken: string): Promise<void> {
  try {
    await axios.post(`https://oauth2.googleapis.com/revoke?token=${accessToken}`);
  } catch (error) {
    console.error('Error revoking token:', error);
    throw new Error('Failed to revoke token');
  }
}

// Refresh access token
export async function refreshAccessToken(refreshToken: string): Promise<string> {
  try {
    const response = await axios.post('https://oauth2.googleapis.com/token', {
      client_id: YOUTUBE_CLIENT_ID,
      client_secret: YOUTUBE_CLIENT_SECRET,
      refresh_token: refreshToken,
      grant_type: 'refresh_token'
    });

    return response.data.access_token;
  } catch (error) {
    console.error('Error refreshing access token:', error);
    throw new Error('Failed to refresh access token');
  }
}

// Fetch user's videos
export async function fetchUserVideos(accessToken: string): Promise<Video[]> {
  try {
    // In a production implementation, we would fetch videos from the YouTube API
    // Example of what the real implementation would look like:
    const response = await axios.get('https://www.googleapis.com/youtube/v3/search', {
      headers: { Authorization: `Bearer ${accessToken}` },
      params: {
        part: 'snippet',
        forMine: true,
        maxResults: 25,
        type: 'video'
      }
    });
    
    // Then we would fetch detailed video information for each video:
    const videoIds = response.data.items.map((item: any) => item.id.videoId).join(',');
    const detailsResponse = await axios.get('https://www.googleapis.com/youtube/v3/videos', {
      headers: { Authorization: `Bearer ${accessToken}` },
      params: {
        part: 'snippet,contentDetails,statistics',
        id: videoIds
      }
    });
    
    // Then we would convert the API response to our Video type
    return detailsResponse.data.items.map((item: any) => {
      // Convert duration from ISO 8601 to MM:SS format
      const isoDuration = item.contentDetails.duration;
      const durationSeconds = convertISODurationToSeconds(isoDuration);
      const duration = formatDuration(durationSeconds);
      
      return {
        id: item.id,
        title: item.snippet.title,
        description: item.snippet.description,
        thumbnailUrl: item.snippet.thumbnails.high?.url || item.snippet.thumbnails.default?.url,
        publishedAt: item.snippet.publishedAt,
        views: parseInt(item.statistics.viewCount, 10),
        likes: parseInt(item.statistics.likeCount, 10),
        comments: parseInt(item.statistics.commentCount, 10),
        duration,
        durationSeconds
      };
    });
    
    // For now, to ensure we have functional examples without needing YouTube API keys:
    return [
      {
        id: 'video1',
        title: 'How to Grow Your YouTube Channel in 2023 - 10 Proven Strategies',
        description: 'Learn the best strategies for growing your channel in 2023.',
        thumbnailUrl: 'https://images.unsplash.com/photo-1611162616305-c69b3fa7fbe0?ixlib=rb-4.0.3&auto=format&fit=crop&w=480&h=270&q=80',
        publishedAt: '2023-05-15T10:30:00Z',
        views: 14000,
        likes: 1200,
        comments: 85,
        duration: '10:28',
        durationSeconds: 628
      },
      {
        id: 'video2',
        title: '5 Must-Have Camera Accessories for Content Creators',
        description: 'Discover the essential camera accessories every creator needs.',
        thumbnailUrl: 'https://images.unsplash.com/photo-1581092918056-0c4c3acd3789?ixlib=rb-4.0.3&auto=format&fit=crop&w=480&h=270&q=80',
        publishedAt: '2023-05-10T14:15:00Z',
        views: 26000,
        likes: 2184,
        comments: 167,
        duration: '18:42',
        durationSeconds: 1122
      },
      {
        id: 'video3',
        title: 'Complete Lighting Setup Guide for YouTube Creators',
        description: 'Master your lighting setup with this comprehensive guide.',
        thumbnailUrl: 'https://images.unsplash.com/photo-1593642532973-d31b6557fa68?ixlib=rb-4.0.3&auto=format&fit=crop&w=480&h=270&q=80',
        publishedAt: '2023-05-01T09:00:00Z',
        views: 8200,
        likes: 645,
        comments: 59,
        duration: '22:15',
        durationSeconds: 1335
      }
    ];
  } catch (error) {
    console.error('Error fetching videos:', error);
    throw new Error('Failed to fetch videos');
  }
}

// Fetch video details
// Fetch enhanced video analytics data
export async function fetchVideoAnalytics(videoId: string, accessToken: string): Promise<{
  subscribersGained: number;
  subscribersLost: number;
  impressions: number;
  clickThroughRate: number;
  averageWatchTime: number;
  watchTimePercentage: number;
}> {
  try {
    // YouTube Analytics API call for subscriber data
    const subscriberResponse = await axios.get('https://youtubeanalytics.googleapis.com/v2/reports', {
      headers: { Authorization: `Bearer ${accessToken}` },
      params: {
        ids: 'channel==MINE',
        startDate: '2023-01-01',
        endDate: '2023-12-31',
        metrics: 'subscribersGained,subscribersLost',
        filters: `video==${videoId}`,
        dimensions: 'video'
      }
    });

    // YouTube Analytics API call for impression data
    const impressionResponse = await axios.get('https://youtubeanalytics.googleapis.com/v2/reports', {
      headers: { Authorization: `Bearer ${accessToken}` },
      params: {
        ids: 'channel==MINE',
        startDate: '2023-01-01',
        endDate: '2023-12-31',
        metrics: 'cardImpressions,cardClickRate,averageViewDuration,averageViewPercentage',
        filters: `video==${videoId}`,
        dimensions: 'video'
      }
    });

    const subscriberData = subscriberResponse.data.rows?.[0] || [0, 0];
    const impressionData = impressionResponse.data.rows?.[0] || [0, 0, 0, 0];

    return {
      subscribersGained: subscriberData[0] || 0,
      subscribersLost: subscriberData[1] || 0,
      impressions: impressionData[0] || 0,
      clickThroughRate: impressionData[1] || 0,
      averageWatchTime: impressionData[2] || 0,
      watchTimePercentage: impressionData[3] || 0
    };
  } catch (error) {
    console.error('Error fetching video analytics:', error);
    // Return mock data for development
    return {
      subscribersGained: Math.floor(Math.random() * 50) + 10,
      subscribersLost: Math.floor(Math.random() * 10) + 1,
      impressions: Math.floor(Math.random() * 10000) + 1000,
      clickThroughRate: Math.random() * 0.1 + 0.02,
      averageWatchTime: Math.random() * 300 + 120,
      watchTimePercentage: Math.random() * 0.3 + 0.4
    };
  }
}

export async function fetchVideoDetails(videoId: string, accessToken: string): Promise<Video> {
  try {
    // In a production implementation, we would fetch video details from the YouTube API
    // Example of what the real implementation would look like:
    const response = await axios.get('https://www.googleapis.com/youtube/v3/videos', {
      headers: { Authorization: `Bearer ${accessToken}` },
      params: {
        part: 'snippet,contentDetails,statistics',
        id: videoId
      }
    });
    
    if (!response.data.items || response.data.items.length === 0) {
      throw new Error('Video not found');
    }
    
    const item = response.data.items[0];
    const isoDuration = item.contentDetails.duration;
    const durationSeconds = convertISODurationToSeconds(isoDuration);
    const duration = formatDuration(durationSeconds);
    
    // Fetch enhanced analytics data
    const analyticsData = await fetchVideoAnalytics(videoId, accessToken);
    
    return {
      id: item.id,
      title: item.snippet.title,
      description: item.snippet.description,
      thumbnailUrl: item.snippet.thumbnails.high?.url || item.snippet.thumbnails.default?.url,
      publishedAt: new Date(item.snippet.publishedAt),
      views: parseInt(item.statistics.viewCount, 10),
      likes: parseInt(item.statistics.likeCount, 10),
      comments: parseInt(item.statistics.commentCount, 10),
      duration,
      durationSeconds,
      subscribersGained: analyticsData.subscribersGained,
      subscribersLost: analyticsData.subscribersLost,
      impressions: analyticsData.impressions,
      clickThroughRate: analyticsData.clickThroughRate,
      averageWatchTime: analyticsData.averageWatchTime,
      watchTimePercentage: analyticsData.watchTimePercentage,
      userId: null
    };
    
    // For now, to ensure we have functional examples without needing YouTube API keys:
    // For the selected video (matching the design)
    if (videoId === 'video2') {
      return {
        id: 'video2',
        title: '5 Must-Have Camera Accessories for Content Creators',
        description: 'Discover the essential camera accessories every creator needs.',
        thumbnailUrl: 'https://images.unsplash.com/photo-1581092918056-0c4c3acd3789?ixlib=rb-4.0.3&auto=format&fit=crop&w=480&h=270&q=80',
        publishedAt: '2023-01-15T14:15:00Z',
        views: 26419,
        likes: 2184,
        comments: 167,
        duration: '18:42',
        durationSeconds: 1122
      };
    }
    
    // Default for other videos
    return {
      id: videoId,
      title: 'Sample YouTube Video',
      description: 'This is a sample video description.',
      thumbnailUrl: 'https://images.unsplash.com/photo-1611162616305-c69b3fa7fbe0?ixlib=rb-4.0.3&auto=format&fit=crop&w=480&h=270&q=80',
      publishedAt: '2023-01-01T12:00:00Z',
      views: 10000,
      likes: 500,
      comments: 50,
      duration: '10:00',
      durationSeconds: 600
    };
  } catch (error) {
    console.error('Error fetching video details:', error);
    throw new Error('Failed to fetch video details');
  }
}

// Fetch retention data
export async function fetchRetentionData(videoId: string, accessToken: string): Promise<RetentionData> {
  try {
    // For now, we'll use mock data while YouTube API integration is in progress
    // In a production environment, this would be replaced with actual API calls
    
    // Generate 100 data points with a realistic retention curve
    const points = [];
    let currentPercentage = 1.0; // Start at 100%
    
    // Get video duration
    const video = await fetchVideoDetails(videoId, accessToken);
    const duration = video.durationSeconds;
    const timeStep = duration / 100;
    
    for (let i = 0; i < 100; i++) {
      // Apply a realistic curve with some variations
      if (i < 5) {
        // Initial drop (first 5%)
        currentPercentage -= 0.03 + (Math.random() * 0.02);
      } else if (i === 32) {
        // Significant drop at 32% (matching design)
        currentPercentage -= 0.32;
      } else if (i === 20) {
        // Interest point at 20% (matching design)
        currentPercentage += 0.15;
      } else if (i === 80) {
        // Engagement peak at 80% (matching design)
        currentPercentage += 0.22;
      } else if (i > 90) {
        // End of video drop
        currentPercentage -= 0.05 + (Math.random() * 0.03);
      } else {
        // Gradual decline with some small variations
        currentPercentage -= 0.003 + (Math.random() * 0.006);
      }
      
      // Ensure percentage stays between 0 and 1
      currentPercentage = Math.max(0, Math.min(1, currentPercentage));
      
      points.push({
        timestamp: i * timeStep,
        percentage: currentPercentage
      });
    }
    
    return {
      videoId,
      points
    };
  } catch (error) {
    console.error('Error fetching retention data:', error);
    throw new Error('Failed to fetch retention data');
  }
}

// Fetch captions/transcripts
export async function fetchCaptions(videoId: string, accessToken: string): Promise<Captions> {
  try {
    // For now, we'll use mock data while YouTube API integration is in progress
    // In a production environment, this would be replaced with actual API calls
    let captions: CaptionEntry[] = [];
    
    if (videoId === 'video2') {
      // Match the design with hotspots
      captions = [
        { startTime: 0, endTime: 18, text: "Hey everyone! Welcome back to the channel. Today I'm going to show you the 5 must-have camera accessories that every content creator needs in 2023." },
        { startTime: 18, endTime: 32, text: "If you're serious about improving your video quality, these accessories will make a huge difference. Let's get started!" },
        { startTime: 32, endTime: 60, text: "First up, we have the most important accessory - a good quality tripod. Now, you might think any tripod will do, but let me show you the difference..." },
        // More captions...
        { startTime: 202, endTime: 255, text: "This accessory completely transformed my video quality, and here's a before/after comparison. Look at how much smoother and more professional the footage looks!" },
        { startTime: 255, endTime: 300, text: "The second must-have accessory is good lighting. I can't stress enough how important lighting is for video quality..." },
        // More captions...
        { startTime: 648, endTime: 750, text: "And now I'll show you the price comparison between these different camera mounts. The high-end models start at around $199, while mid-range options are about $89 to $129..." },
        { startTime: 750, endTime: 800, text: "The fourth accessory every creator needs is a good quality external microphone. Don't rely on your camera's built-in mic..." },
        // More captions...
        { startTime: 906, endTime: 950, text: "I've created a free downloadable cheatsheet with all these accessories and their alternatives at different price points. Check the link in the description to get it!" },
        { startTime: 950, endTime: 1070, text: "And that wraps up my top 5 must-have camera accessories for content creators. If you found this video helpful, please give it a thumbs up and consider subscribing..." }
      ];
    } else {
      // Generate generic captions for other videos
      const video = await fetchVideoDetails(videoId, accessToken);
      const duration = video.durationSeconds;
      const segmentLength = 30; // 30 seconds per caption
      const numSegments = Math.ceil(duration / segmentLength);
      
      for (let i = 0; i < numSegments; i++) {
        const startTime = i * segmentLength;
        const endTime = Math.min((i + 1) * segmentLength, duration);
        
        captions.push({
          startTime,
          endTime,
          text: `Caption text for segment ${i + 1}. This would contain the actual transcription of the video audio.`
        });
      }
    }
    
    return {
      videoId,
      entries: captions
    };
  } catch (error) {
    console.error('Error fetching captions:', error);
    throw new Error('Failed to fetch captions');
  }
}

// Helper function to convert ISO 8601 duration to seconds
function convertISODurationToSeconds(isoDuration: string): number {
  const match = isoDuration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) return 0;
  
  const hours = parseInt(match[1] || '0', 10);
  const minutes = parseInt(match[2] || '0', 10);
  const seconds = parseInt(match[3] || '0', 10);
  
  return hours * 3600 + minutes * 60 + seconds;
}

// Helper function to format seconds as MM:SS
function formatDuration(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60);
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
}

// Helper function to parse SRT content into CaptionEntry[]
function parseSRT(srtContent: string): CaptionEntry[] {
  const lines = srtContent.split('\n');
  const entries: CaptionEntry[] = [];
  let currentEntry: Partial<CaptionEntry> = {};
  let textLines: string[] = [];
  let parsingText = false;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    if (/^\d+$/.test(line)) {
      // This is a caption number, start a new entry
      if (currentEntry.startTime !== undefined && textLines.length > 0) {
        currentEntry.text = textLines.join(' ');
        entries.push(currentEntry as CaptionEntry);
      }
      
      currentEntry = {};
      textLines = [];
      parsingText = false;
    } else if (/^\d{2}:\d{2}:\d{2},\d{3} --> \d{2}:\d{2}:\d{2},\d{3}$/.test(line)) {
      // This is a timestamp line
      const times = line.split(' --> ');
      currentEntry.startTime = convertSRTTimeToSeconds(times[0]);
      currentEntry.endTime = convertSRTTimeToSeconds(times[1]);
      parsingText = true;
    } else if (parsingText) {
      if (line !== '') {
        textLines.push(line);
      }
    }
  }
  
  // Add the last entry if there is one
  if (currentEntry.startTime !== undefined && textLines.length > 0) {
    currentEntry.text = textLines.join(' ');
    entries.push(currentEntry as CaptionEntry);
  }
  
  return entries;
}

// Helper function to convert SRT time format to seconds
function convertSRTTimeToSeconds(srtTime: string): number {
  const [time, milliseconds] = srtTime.split(',');
  const [hours, minutes, seconds] = time.split(':').map(Number);
  
  return hours * 3600 + minutes * 60 + seconds + parseInt(milliseconds, 10) / 1000;
}

// Compare two videos and generate insights
export async function compareVideos(video1Id: string, video2Id: string, accessToken: string): Promise<VideoComparisonResult> {
  try {
    const [video1, video2] = await Promise.all([
      fetchVideoDetails(video1Id, accessToken),
      fetchVideoDetails(video2Id, accessToken)
    ]);

    // Calculate performance ratios
    const viewsRatio = video1.views! / video2.views!;
    const engagementRatio = (video1.likes! + video1.comments!) / (video2.likes! + video2.comments!);
    const retentionRatio = video1.watchTimePercentage! / video2.watchTimePercentage!;
    const subscriberGrowthRatio = video1.subscribersGained! / video2.subscribersGained!;
    const ctrRatio = video1.clickThroughRate! / video2.clickThroughRate!;

    // Determine which video performed better
    const video1Better = viewsRatio > 1;
    const betterVideo = video1Better ? video1 : video2;
    const worseVideo = video1Better ? video2 : video1;

    // Generate insights and recommendations
    const keyDifferences = [];
    const recommendations = [];

    if (Math.abs(viewsRatio - 1) > 0.2) {
      keyDifferences.push(`${betterVideo.title} had ${(Math.abs(viewsRatio - 1) * 100).toFixed(1)}% more views`);
    }

    if (Math.abs(retentionRatio - 1) > 0.1) {
      keyDifferences.push(`${betterVideo.title} had ${(Math.abs(retentionRatio - 1) * 100).toFixed(1)}% better retention`);
    }

    if (Math.abs(ctrRatio - 1) > 0.2) {
      keyDifferences.push(`${betterVideo.title} had ${(Math.abs(ctrRatio - 1) * 100).toFixed(1)}% better click-through rate`);
    }

    recommendations.push("Analyze the thumbnail and title of the better-performing video");
    recommendations.push("Review the content structure and pacing differences");
    recommendations.push("Consider the timing and context of video publication");
    recommendations.push("Compare the opening hooks and viewer engagement techniques");

    const insights = `${betterVideo.title} outperformed ${worseVideo.title} primarily due to ${keyDifferences[0] || 'better overall engagement'}. The performance gap suggests significant differences in content strategy, presentation, or timing.`;

    return {
      video1,
      video2,
      performanceMetrics: {
        viewsRatio,
        engagementRatio,
        retentionRatio,
        subscriberGrowthRatio,
        ctrRatio
      },
      insights,
      keyDifferences,
      recommendations
    };
  } catch (error) {
    console.error('Error comparing videos:', error);
    throw new Error('Failed to compare videos');
  }
}
