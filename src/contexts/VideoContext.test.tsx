import { renderHook, act } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { VideoProvider, useVideo } from './VideoContext';

describe('VideoContext', () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => <VideoProvider>{children}</VideoProvider>;

    it('should add a playing video', () => {
        const { result } = renderHook(() => useVideo(), { wrapper });

        act(() => {
            result.current.addPlayingVideo('channel1');
        });

        expect(result.current.playingVideos).toEqual(['channel1']);
    });

    it('should remove a playing video', () => {
        const { result } = renderHook(() => useVideo(), { wrapper });

        act(() => {
            result.current.addPlayingVideo('channel1');
        });
        act(() => {
            result.current.addPlayingVideo('channel2');
        });
        act(() => {
            result.current.removePlayingVideo('channel1');
        });

        expect(result.current.playingVideos).toEqual(['channel2']);
    });

    it('should not add a duplicate video', () => {
        const { result } = renderHook(() => useVideo(), { wrapper });

        act(() => {
            result.current.addPlayingVideo('channel1');
        });
        act(() => {
            result.current.addPlayingVideo('channel1');
        });

        expect(result.current.playingVideos).toEqual(['channel1']);
    });

    it('should enforce a concurrency limit of 4 videos', () => {
        const { result } = renderHook(() => useVideo(), { wrapper });

        act(() => {
            result.current.addPlayingVideo('channel1');
            result.current.addPlayingVideo('channel2');
            result.current.addPlayingVideo('channel3');
            result.current.addPlayingVideo('channel4');
        });

        expect(result.current.playingVideos).toEqual(['channel1', 'channel2', 'channel3', 'channel4']);

        act(() => {
            result.current.addPlayingVideo('channel5');
        });

        expect(result.current.playingVideos).toEqual(['channel2', 'channel3', 'channel4', 'channel5']);
    });
}); 