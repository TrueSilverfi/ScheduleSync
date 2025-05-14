import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Skeleton } from '@/components/ui/skeleton';
import { Video } from '@/types';

interface VideoSelectorProps {
  onSelectVideo: (videoId: string) => void;
  selectedVideoId?: string;
}

export default function VideoSelector({ onSelectVideo, selectedVideoId }: VideoSelectorProps) {
  const { data: videos, isLoading, error } = useQuery<Video[]>({
    queryKey: ['/api/videos'],
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const formatDuration = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
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

  if (isLoading) {
    return (
      <div className="mb-6 bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-medium mb-4">Select a video to analyze</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="rounded-lg p-3">
              <Skeleton className="h-40 w-full rounded-lg mb-2" />
              <Skeleton className="h-4 w-3/4 mb-2" />
              <Skeleton className="h-3 w-1/2" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mb-6 bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-medium mb-4">Failed to load videos</h2>
        <p className="text-red-500">An error occurred while loading your videos. Please try again later.</p>
      </div>
    );
  }

  if (!videos || videos.length === 0) {
    return (
      <div className="mb-6 bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-medium mb-4">No videos found</h2>
        <p>We couldn't find any videos on your channel. Please make sure you have videos on your YouTube channel.</p>
      </div>
    );
  }

  return (
    <div className="mb-6 bg-white rounded-lg shadow-md p-6">
      <h2 className="text-xl font-medium mb-4">Select a video to analyze</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {videos.map((video) => (
          <div 
            key={video.id}
            className={`video-item cursor-pointer ${selectedVideoId === video.id ? 'bg-[#F9F9F9]' : 'hover:bg-[#F9F9F9]'} rounded-lg p-3 transition-colors`}
            onClick={() => onSelectVideo(video.id)}
          >
            <div className="relative mb-2">
              <img 
                src={video.thumbnailUrl} 
                alt={`${video.title} thumbnail`} 
                className="w-full rounded-lg" 
                loading="lazy"
              />
              <span className="absolute bottom-2 right-2 bg-black bg-opacity-75 text-white text-xs px-1 rounded">
                {video.duration}
              </span>
            </div>
            <h3 className="font-medium text-sm line-clamp-2">{video.title}</h3>
            <div className="flex items-center mt-2 text-xs text-[#666666]">
              <span>{formatViews(video.views)} views</span>
              <span className="mx-1">•</span>
              <span>{getTimeAgo(video.publishedAt)}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
