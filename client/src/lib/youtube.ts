import { apiRequest } from './queryClient';
import { Video, RetentionData, Captions, VideoAnalysisResponse } from '@/types';

// Fetch user's videos
export async function fetchUserVideos(): Promise<Video[]> {
  const response = await apiRequest('GET', '/api/videos');
  return response.json();
}

// Fetch detailed video data for analysis
export async function fetchVideoAnalysis(videoId: string): Promise<VideoAnalysisResponse> {
  const response = await apiRequest('GET', `/api/videos/${videoId}/analysis`);
  return response.json();
}

// Send email report
export async function sendEmailReport(videoId: string, email?: string): Promise<{ success: boolean, message: string }> {
  const response = await apiRequest('POST', `/api/videos/${videoId}/report`, { email });
  return response.json();
}

// Check authentication status
export async function checkAuthStatus(): Promise<{ authenticated: boolean }> {
  try {
    const response = await apiRequest('GET', '/api/auth/status');
    return response.json();
  } catch (error) {
    return { authenticated: false };
  }
}

// Logout
export async function logout(): Promise<void> {
  await apiRequest('POST', '/api/auth/logout');
}
