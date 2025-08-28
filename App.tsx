/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React, {useState} from 'react';
import {EditVideoPage} from './components/EditVideoPage';
import {ErrorModal} from './components/ErrorModal';
import {HistoryPage} from './components/HistoryPage';
import {VideoCameraIcon} from './components/icons';
import {SavingProgressPage} from './components/SavingProgressPage';
import {VideoGrid} from './components/VideoGrid';
import {VideoPlayer} from './components/VideoPlayer';
import {MOCK_VIDEOS} from './constants';
import {HistoryVideo, Video} from './types';

import {GeneratedVideo, GoogleGenAI} from '@google/genai';

const VEO_MODEL_NAME = 'veo-2.0-generate-001';

const ai = new GoogleGenAI({apiKey: process.env.API_KEY});

// ---

function bloblToBase64(blob: Blob) {
  return new Promise<string>(async (resolve) => {
    const reader = new FileReader();
    reader.onload = () => {
      const url = reader.result as string;
      resolve(url.split(',')[1]);
    };
    reader.readAsDataURL(blob);
  });
}

// ---

async function generateVideoFromText(
  prompt: string,
  numberOfVideos = 1,
): Promise<string[]> {
  let operation = await ai.models.generateVideos({
    model: VEO_MODEL_NAME,
    prompt,
    config: {
      numberOfVideos,
      aspectRatio: '16:9',
    },
  });

  while (!operation.done) {
    await new Promise((resolve) => setTimeout(resolve, 10000));
    console.log('...Generating...');
    operation = await ai.operations.getVideosOperation({operation});
  }

  if (operation?.response) {
    const videos = operation.response?.generatedVideos;
    if (videos === undefined || videos.length === 0) {
      throw new Error('No videos generated');
    }

    return await Promise.all(
      videos.map(async (generatedVideo: GeneratedVideo) => {
        const url = decodeURIComponent(generatedVideo.video.uri);
        const res = await fetch(`${url}&key=${process.env.API_KEY}`);
        if (!res.ok) {
          throw new Error(
            `Failed to fetch video: ${res.status} ${res.statusText}`,
          );
        }
        const blob = await res.blob();
        return bloblToBase64(blob);
      }),
    );
  } else {
    throw new Error('No videos generated');
  }
}

/**
 * Main component for the Veo3 Gallery app.
 * It manages the state of videos, playing videos, editing videos and error handling.
 */
export const App: React.FC = () => {
  const [videos, setVideos] = useState<Video[]>(MOCK_VIDEOS);
  const [playingVideo, setPlayingVideo] = useState<Video | null>(null);
  const [editingVideo, setEditingVideo] = useState<Video | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [savingMessage, setSavingMessage] = useState('');
  const [generationError, setGenerationError] = useState<string[] | null>(
    null,
  );
  const [view, setView] = useState<'gallery' | 'history'>('gallery');
  const [generatedVideosHistory, setGeneratedVideosHistory] = useState<
    HistoryVideo[]
  >([]);
  const [newVideoPrompt, setNewVideoPrompt] = useState('');
  const [loadingVideoId, setLoadingVideoId] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  const handlePlayVideo = (video: Video) => {
    setLoadingVideoId(video.id);
    setPlayingVideo(video);
    setIsPlaying(true);
  };

  const handleClosePlayer = () => {
    setPlayingVideo(null);
    setLoadingVideoId(null);
    setIsPlaying(false);
  };

  const handleVideoLoaded = () => {
    setLoadingVideoId(null);
  };

  const handleStartEdit = (video: Video) => {
    setPlayingVideo(null); // Close player
    setIsPlaying(false);
    setLoadingVideoId(null);
    setEditingVideo(video); // Open edit page
  };

  const handleCancelEdit = () => {
    setEditingVideo(null); // Close edit page, return to grid
  };

  const handleSaveEdit = async (originalVideo: Video) => {
    setEditingVideo(null);
    setSavingMessage('Creating your remix...');
    setIsSaving(true);
    setGenerationError(null);

    try {
      const promptText = originalVideo.description;
      console.log('Generating video...', promptText);
      const videoObjects = await generateVideoFromText(promptText);

      if (!videoObjects || videoObjects.length === 0) {
        throw new Error('Video generation returned no data.');
      }

      console.log('Generated video data received.');

      const mimeType = 'video/mp4';
      const videoSrc = videoObjects[0];
      const src = `data:${mimeType};base64,${videoSrc}`;

      const newVideo: Video = {
        id: self.crypto.randomUUID(),
        title: `Remix of "${originalVideo.title}"`,
        description: originalVideo.description,
        videoUrl: src,
      };

      const newHistoryVideo: HistoryVideo = {
        ...newVideo,
        createdAt: new Date(),
      };

      setVideos((currentVideos) => [newVideo, ...currentVideos]);
      setGeneratedVideosHistory((currentHistory) => [
        newHistoryVideo,
        ...currentHistory,
      ]);
      setView('history'); // Switch to history view
      setPlayingVideo(newVideo); // Go to the new video
      setIsPlaying(true);
    } catch (error) {
      console.error('Video generation failed:', error);
      setGenerationError([
        'Video generation failed.',
        'This may be due to an invalid API key or network issues.',
      ]);
    } finally {
      setIsSaving(false);
    }
  };

  const handleGenerateNewVideo = async () => {
    if (!newVideoPrompt.trim()) return;

    setSavingMessage('Generating your video...');
    setIsSaving(true);
    setGenerationError(null);

    try {
      const promptText = newVideoPrompt.trim();
      console.log('Generating video from new prompt...', promptText);
      const videoObjects = await generateVideoFromText(promptText);

      if (!videoObjects || videoObjects.length === 0) {
        throw new Error('Video generation returned no data.');
      }

      console.log('Generated video data received.');

      const mimeType = 'video/mp4';
      const videoSrc = videoObjects[0];
      const src = `data:${mimeType};base64,${videoSrc}`;

      const newVideo: Video = {
        id: self.crypto.randomUUID(),
        title: `Generated: "${promptText.substring(0, 40)}${
          promptText.length > 40 ? '...' : ''
        }"`,
        description: promptText,
        videoUrl: src,
      };

      const newHistoryVideo: HistoryVideo = {
        ...newVideo,
        createdAt: new Date(),
      };

      setVideos((currentVideos) => [newVideo, ...currentVideos]);
      setGeneratedVideosHistory((currentHistory) => [
        newHistoryVideo,
        ...currentHistory,
      ]);
      setNewVideoPrompt(''); // Clear prompt
      setView('history'); // Switch to history view
      setPlayingVideo(newVideo); // Play the new video
      setIsPlaying(true);
    } catch (error) {
      console.error('Video generation failed:', error);
      setGenerationError([
        'Video generation failed.',
        'This may be due to an invalid API key or network issues.',
      ]);
    } finally {
      setIsSaving(false);
    }
  };

  if (isSaving) {
    return <SavingProgressPage message={savingMessage} />;
  }

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 font-sans">
      {editingVideo ? (
        <EditVideoPage
          video={editingVideo}
          onSave={handleSaveEdit}
          onCancel={handleCancelEdit}
        />
      ) : (
        <div className="mx-auto max-w-[1080px]">
          <header className="p-6 md:p-8 text-center">
            <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-purple-400 via-pink-500 to-red-500 text-transparent bg-clip-text inline-flex items-center gap-4">
              <VideoCameraIcon className="w-10 h-10 md:w-12 md:h-12" />
              <span>Veo Gallery</span>
            </h1>
            <p className="text-gray-400 mt-2 text-lg">
              Generate a new video or select one to create variations
            </p>
          </header>

          <div className="px-4 md:px-8 mb-8">
            <div className="bg-gray-800 p-6 rounded-lg shadow-lg">
              <h2 className="text-xl font-semibold text-white mb-3">
                Create Your Own Video
              </h2>
              <p className="text-gray-400 mb-4">
                Enter a text prompt below and let our AI bring your idea to
                life.
              </p>
              <textarea
                value={newVideoPrompt}
                onChange={(e) => setNewVideoPrompt(e.target.value)}
                rows={4}
                className="w-full bg-gray-900 border border-gray-700 rounded-lg p-3 text-gray-200 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-shadow duration-200"
                placeholder="e.g., A cinematic shot of a koala in a leather jacket, riding a motorcycle."
                disabled={isSaving}
              />
              <div className="text-right mt-4">
                <button
                  onClick={handleGenerateNewVideo}
                  disabled={!newVideoPrompt.trim() || isSaving}
                  className="px-6 py-2 rounded-lg bg-purple-600 hover:bg-purple-700 text-white font-semibold transition-colors disabled:bg-gray-600 disabled:cursor-not-allowed">
                  {isSaving ? 'Generating...' : 'Generate Video'}
                </button>
              </div>
            </div>
          </div>

          <nav className="px-4 md:px-8 mb-8 flex justify-center border-b border-gray-700">
            <button
              onClick={() => setView('gallery')}
              className={`px-4 py-2 text-lg font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 rounded-t-md ${
                view === 'gallery'
                  ? 'text-purple-400 border-b-2 border-purple-400'
                  : 'text-gray-400 hover:text-white'
              }`}>
              Gallery
            </button>
            <button
              onClick={() => setView('history')}
              className={`px-4 py-2 text-lg font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 rounded-t-md ${
                view === 'history'
                  ? 'text-purple-400 border-b-2 border-purple-400'
                  : 'text-gray-400 hover:text-white'
              }`}>
              History
            </button>
          </nav>
          <main className="px-4 md:px-8 pb-8">
            {view === 'gallery' ? (
              <VideoGrid
                videos={videos}
                onPlayVideo={handlePlayVideo}
                loadingVideoId={loadingVideoId}
              />
            ) : (
              <HistoryPage
                videos={generatedVideosHistory}
                onPlayVideo={handlePlayVideo}
                loadingVideoId={loadingVideoId}
              />
            )}
          </main>
        </div>
      )}

      {isPlaying && playingVideo && (
        <VideoPlayer
          video={playingVideo}
          onClose={handleClosePlayer}
          onEdit={handleStartEdit}
          onVideoLoaded={handleVideoLoaded}
        />
      )}

      {generationError && (
        <ErrorModal
          message={generationError}
          onClose={() => setGenerationError(null)}
          onSelectKey={async () => await window.aistudio?.openSelectKey()}
        />
      )}
    </div>
  );
};