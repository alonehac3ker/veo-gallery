/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React from 'react';
import {HistoryVideo} from '../types';
import {HistoryCard} from './HistoryCard';
import {VideoCameraIcon} from './icons';

interface HistoryPageProps {
  videos: HistoryVideo[];
  onPlayVideo: (video: HistoryVideo) => void;
  loadingVideoId: string | null;
}

export const HistoryPage: React.FC<HistoryPageProps> = ({
  videos,
  onPlayVideo,
  loadingVideoId,
}) => {
  if (videos.length === 0) {
    return (
      <div className="text-center py-16 text-gray-400 flex flex-col items-center animate-fade-in">
        <VideoCameraIcon className="w-16 h-16 mb-4 text-gray-600" />
        <h2 className="text-2xl font-bold text-white mb-2">
          No Videos Generated Yet
        </h2>
        <p>Select a video from the gallery to create your first remix.</p>
      </div>
    );
  }

  // Sort videos by creation date, newest first
  const sortedVideos = [...videos].sort(
    (a, b) => b.createdAt.getTime() - a.createdAt.getTime(),
  );

  return (
    <div className="space-y-6 animate-fade-in">
      {sortedVideos.map((video) => (
        <HistoryCard
          key={video.id}
          video={video}
          onPlay={onPlayVideo}
          isLoading={loadingVideoId === video.id}
        />
      ))}
    </div>
  );
};
