import { createContext, useContext, useState, ReactNode } from 'react';

type VideoContextType = {
  playingVideos: string[];
  addPlayingVideo: (channelName: string) => void;
  removePlayingVideo: (channelName: string) => void;
};

const VideoContext = createContext<VideoContextType | undefined>(undefined);

export const useVideo = () => {
  const context = useContext(VideoContext);
  if (!context) {
    throw new Error('useVideo must be used within a VideoProvider');
  }
  return context;
};

type VideoProviderProps = {
  children: ReactNode;
};

export const VideoProvider = ({ children }: VideoProviderProps) => {
  const [playingVideos, setPlayingVideos] = useState<string[]>([]);

  const addPlayingVideo = (channelName: string) => {
    setPlayingVideos((prev) => {
      if (prev.includes(channelName)) {
        return prev;
      }
      if (prev.length >= 4) {
        const [, ...rest] = prev;
        return [...rest, channelName];
      }
      return [...prev, channelName];
    });
  };

  const removePlayingVideo = (channelName: string) => {
    setPlayingVideos((prev) => prev.filter((name) => name !== channelName));
  };

  return (
    <VideoContext.Provider value={{ playingVideos, addPlayingVideo, removePlayingVideo }}>
      {children}
    </VideoContext.Provider>
  );
}; 