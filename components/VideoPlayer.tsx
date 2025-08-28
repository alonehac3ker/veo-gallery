/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React, {useState} from 'react';
import {Video} from '../types';
import {DownloadIcon, PencilSquareIcon, ShareIcon, XMarkIcon} from './icons';

interface VideoPlayerProps {
  video: Video;
  onClose: () => void;
  onEdit: (video: Video) => void;
  onVideoLoaded: () => void;
}

/**
 * A component that renders a video player with controls, description, and edit button.
 */
export const VideoPlayer: React.FC<VideoPlayerProps> = ({
  video,
  onClose,
  onEdit,
  onVideoLoaded,
}) => {
  const [shareFeedback, setShareFeedback] = useState('');

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = video.videoUrl;
    // Sanitize the title to create a valid filename
    const fileName = `${video.title
      .replace(/[^\w\s]/gi, '')
      .replace(/ /g, '_')}.mp4`;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleShare = async () => {
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
      className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center animate-fade-in"
      onClick={onClose}
      aria-modal="true"
      role="dialog">
      <div
        className="bg-gray-800 rounded-lg shadow-2xl w-full max-w-4xl relative overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}>
        <div className="flex-shrink-0 p-2 sm:p-4">
          <button
            onClick={onClose}
            className="absolute top-2 right-2 text-white/70 hover:text-white z-10 p-2 rounded-full bg-black/20 hover:bg-black/40 transition-colors"
            aria-label="Close video player">
            <XMarkIcon className="w-6 h-6 sm:w-8 sm:h-8" />
          </button>
          <div className="aspect-w-16 aspect-h-9 bg-black rounded-md overflow-hidden">
            <video
              key={video.id}
              className="w-full h-full"
              src={video.videoUrl}
              controls
              autoPlay
              onCanPlay={onVideoLoaded}
              onEnded={onClose}
              aria-label={video.title}
            />
          </div>
        </div>
        <div className="flex-1 p-4 pt-2 overflow-y-auto">
          <div className="flex justify-between items-start gap-4">
            <p className="text-sm text-gray-400 mt-0 whitespace-pre-wrap flex-1">
              {video.description}
            </p>
            <div className="flex-shrink-0 flex items-center gap-2">
              <button
                onClick={handleShare}
                className="flex items-center gap-2 bg-gray-600 hover:bg-gray-700 text-white font-bold py-2 px-3 rounded-lg transition-colors text-sm"
                aria-label="Share video">
                <ShareIcon className="w-5 h-5" />
                <span className="hidden sm:inline">
                  {shareFeedback || 'Share'}
                </span>
              </button>
              <button
                onClick={handleDownload}
                className="flex items-center gap-2 bg-gray-600 hover:bg-gray-700 text-white font-bold py-2 px-3 rounded-lg transition-colors text-sm"
                aria-label="Download video">
                <DownloadIcon className="w-5 h-5" />
                <span className="hidden sm:inline">Download</span>
              </button>
              <button
                onClick={() => onEdit(video)}
                className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-3 rounded-lg transition-colors text-sm"
                aria-label="Edit video details">
                <PencilSquareIcon className="w-5 h-5" />
                <span className="hidden sm:inline">Edit</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};