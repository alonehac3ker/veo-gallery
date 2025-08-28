/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React, {useState} from 'react';
import {HistoryVideo} from '../types';
import {PlayIcon, ShareIcon} from './icons';

interface HistoryCardProps {
  video: HistoryVideo;
  onPlay: (video: HistoryVideo) => void;
  isLoading: boolean;
}

export const HistoryCard: React.FC<HistoryCardProps> = ({
  video,
  onPlay,
  isLoading,
}) => {
  const [shareFeedback, setShareFeedback] = useState('');
  const formattedDate = video.createdAt.toLocaleString(undefined, {
    dateStyle: 'long',
    timeStyle: 'short',
  });

  const handleShare = async (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent card's onPlay from triggering

    const urlToShare = video.videoUrl.startsWith('http')
      ? video.videoUrl
      : window.location.href;
    const shareData = {
      title: video.title,
      text: video.description,
      url: urlToShare,
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (error) {
        if ((error as Error).name !== 'AbortError') {
          console.error('Error sharing:', error);
        }
      }
    } else {
      try {
        await navigator.clipboard.writeText(urlToShare);
        setShareFeedback('Link Copied!');
        setTimeout(() => setShareFeedback(''), 2000);
      } catch (err) {
        console.error('Failed to copy:', err);
        setShareFeedback('Failed to copy');
        setTimeout(() => setShareFeedback(''), 2000);
      }
    }
  };

  return (
    <div
      className="group w-full text-left bg-gray-800/50 rounded-lg overflow-hidden shadow-lg hover:shadow-gray-500/30 transition-all duration-300 hover:bg-gray-800/80 flex animate-fade-in"
      aria-label={`Generated video: ${video.title}`}>
      <button
        type="button"
        className="relative w-1/3 md:w-1/4 flex-shrink-0"
        onClick={() => onPlay(video)}
        aria-label={`Play generated video: ${video.title}`}>
        <video
          className="w-full h-full object-cover pointer-events-none"
          src={video.videoUrl}
          muted
          playsInline
          preload="metadata"
          aria-hidden="true"></video>
        <div
          className={`absolute inset-0 bg-black/20 flex items-center justify-center transition-opacity duration-300 ${
            isLoading ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
          }`}>
          {isLoading ? (
            <div
              className="w-10 h-10 border-2 border-dashed rounded-full animate-spin border-white"
              role="status"
              aria-label="Loading..."></div>
          ) : (
            <PlayIcon className="w-12 h-12 text-white opacity-80 drop-shadow-lg" />
          )}
        </div>
      </button>
      <div className="p-4 flex flex-col flex-grow overflow-hidden relative">
        <button
          onClick={handleShare}
          className="absolute top-3 right-3 text-gray-400 hover:text-white p-2 rounded-full bg-transparent hover:bg-gray-700 transition-colors z-10"
          aria-label="Share this video">
          {shareFeedback ? (
            <span className="text-xs px-1">{shareFeedback}</span>
          ) : (
            <ShareIcon className="w-5 h-5" />
          )}
        </button>

        <h3 className="text-lg font-semibold text-gray-100 truncate pr-10">
          {video.title}
        </h3>
        <p className="text-xs text-gray-400 mb-2">
          Generated on: {formattedDate}
        </p>
        <p className="text-sm text-gray-300 flex-grow max-h-28 overflow-y-auto">
          <span className="font-semibold">Prompt:</span> {video.description}
        </p>
      </div>
    </div>
  );
};
