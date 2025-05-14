import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import OAuthBanner from '@/components/oauth-banner';
import { fetchUserVideos, checkAuthStatus } from '@/lib/youtube';
import { Video } from '@/types';

export default function Videos() {
  const [, setLocation] = useLocation();
  
  // Check if user is authenticated
  const { data: authData } = useQuery({
    queryKey: ['/api/auth/status'],
    queryFn: async () => {
      const result = await checkAuthStatus();
      return result;
    }
  });

  // Fetch user's videos
  const { data: videos, isLoading, error } = useQuery<Video[]>({
    queryKey: ['/api/videos'],
    queryFn: fetchUserVideos,
    enabled: authData?.authenticated,
  });

  const handleVideoSelect = (videoId: string) => {
    setLocation(`/retention-analysis?video=${videoId}`);
  };

  const formatViews = (views: number): string => {
    if (views >= 1000000) {
      return `${(views / 1000000).toFixed(1)}M`;
    } else if (views >= 1000) {
      return `${(views / 1000).toFixed(1)}K`;
    }
    return views.toString();
  };

  const getTimeAgo = (publishedAt: string): string => {
    const published = new Date(publishedAt);
    const now = new Date();
    const diffInDays = Math.floor((now.getTime() - published.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffInDays === 0) {
      return 'today';
    } else if (diffInDays === 1) {
      return 'yesterday';
    } else if (diffInDays < 7) {
      return `${diffInDays} days ago`;
    } else if (diffInDays < 30) {
      const weeks = Math.floor(diffInDays / 7);
      return `${weeks} ${weeks === 1 ? 'week' : 'weeks'} ago`;
    } else if (diffInDays < 365) {
      const months = Math.floor(diffInDays / 30);
      return `${months} ${months === 1 ? 'month' : 'months'} ago`;
    } else {
      const years = Math.floor(diffInDays / 365);
      return `${years} ${years === 1 ? 'year' : 'years'} ago`;
    }
  };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">My Videos</h1>

      {!authData?.authenticated && (
        <OAuthBanner onConnect={() => {}} isConnected={false} />
      )}

      {authData?.authenticated && (
        <>
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[...Array(6)].map((_, i) => (
                <Card key={i} className="overflow-hidden">
                  <Skeleton className="h-40 w-full" />
                  <div className="p-3">
                    <Skeleton className="h-4 w-3/4 mb-2" />
                    <Skeleton className="h-3 w-1/2" />
                  </div>
                </Card>
              ))}
            </div>
          ) : error ? (
            <Card className="p-6 text-center">
              <h3 className="text-lg font-medium mb-3 text-red-500">Error Loading Videos</h3>
              <p className="text-sm text-[#666666]">
                There was a problem loading your videos. Please try again later.
              </p>
            </Card>
          ) : videos && videos.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {videos.map((video) => (
                <Card 
                  key={video.id}
                  className="overflow-hidden cursor-pointer hover:shadow-lg transition-shadow"
                  onClick={() => handleVideoSelect(video.id)}
                >
                  <div className="relative">
                    <img 
                      src={video.thumbnailUrl} 
                      alt={`${video.title} thumbnail`} 
                      className="w-full aspect-video object-cover"
                      loading="lazy"
                    />
                    <span className="absolute bottom-2 right-2 bg-black bg-opacity-75 text-white text-xs px-1 rounded">
                      {video.duration}
                    </span>
                  </div>
                  <div className="p-3">
                    <h3 className="font-medium text-sm line-clamp-2 mb-1">{video.title}</h3>
                    <div className="flex items-center text-xs text-[#666666]">
                      <span>{formatViews(video.views)} views</span>
                      <span className="mx-1">•</span>
                      <span>{getTimeAgo(video.publishedAt)}</span>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="p-6 text-center">
              <h3 className="text-lg font-medium mb-3">No Videos Found</h3>
              <p className="text-sm text-[#666666] mb-4">
                We couldn't find any videos on your channel. Make sure your channel has public or unlisted videos.
              </p>
              <span className="material-icons text-4xl text-[#666666]">videocam_off</span>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
