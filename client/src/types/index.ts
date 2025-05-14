// YouTube API data types
export interface User {
  id: number;
  username: string;
  email: string;
  accessToken: string;
  refreshToken: string;
  youtubeChannelId: string;
  displayName: string;
  profileImage?: string;
}

export interface Video {
  id: string;
  title: string;
  description: string;
  thumbnailUrl: string;
  publishedAt: string;
  views: number;
  likes: number;
  comments: number;
  duration: string;
  durationSeconds: number;
}

export interface RetentionPoint {
  timestamp: number;
  percentage: number;
}

export interface RetentionData {
  videoId: string;
  points: RetentionPoint[];
}

export interface CaptionEntry {
  startTime: number;
  endTime: number;
  text: string;
}

export interface Captions {
  videoId: string;
  entries: CaptionEntry[];
}

// Hotspot types
export enum HotspotType {
  SIGNIFICANT_DROP = "SIGNIFICANT_DROP",
  INTEREST_POINT = "INTEREST_POINT",
  ENGAGEMENT_PEAK = "ENGAGEMENT_PEAK"
}

export interface Hotspot {
  id: string;
  videoId: string;
  type: HotspotType;
  timestamp: number;
  percentageChange: number;
  transcriptText: string;
  reasons: string[];
  suggestion: string;
}

// UI State types
export interface SelectedVideoState {
  video: Video | null;
  retentionData: RetentionData | null;
  captions: Captions | null;
  hotspots: Hotspot[];
  isLoading: boolean;
  error: string | null;
}

// API Response types
export interface VideoAnalysisResponse {
  video: Video;
  retentionData: RetentionData;
  captions: Captions;
  hotspots: Hotspot[];
}

// Report types
export interface Report {
  id: string;
  videoId: string;
  generatedAt: string;
  sentTo?: string;
  videoTitle: string;
  hotspots: Hotspot[];
  actionableInsights: ActionableInsight;
}

export interface ActionableInsight {
  toAvoid: string[];
  toInclude: string[];
  aiRecommendation: string;
  estimatedImprovement: string;
}
