'use client';

import { useRef, useEffect, useState, useCallback } from 'react';
import WaveSurfer from 'wavesurfer.js';
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { Volume2, VolumeX, Play, Pause, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface WaveformPlayerProps {
    audioUrl: string;
    onError?: () => void;
}

function formatTime(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
}

export default function WaveformPlayer({ audioUrl, onError }: WaveformPlayerProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const wavesurferRef = useRef<WaveSurfer | null>(null);
    const closeTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [isReady, setIsReady] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [volume, setVolume] = useState(0.8);
    const [showVolume, setShowVolume] = useState(false);

    useEffect(() => {
        if (!containerRef.current) return;

        let wavesurfer: WaveSurfer | null = null;
        let isDestroyed = false;

        const initWaveSurfer = async () => {
            if (isDestroyed) return;

            wavesurfer = WaveSurfer.create({
                container: containerRef.current!,
                waveColor: 'rgba(100, 100, 120, 0.5)',
                progressColor: '#d946ef',
                cursorColor: '#d946ef',
                cursorWidth: 2,
                barWidth: 3,
                barGap: 2,
                barRadius: 3,
                height: 48,
                normalize: true,
                interact: true,
            });

            wavesurferRef.current = wavesurfer;

            wavesurfer.on('ready', () => {
                if (isDestroyed) return;
                setIsReady(true);
                setDuration(wavesurfer!.getDuration());
                wavesurfer!.setVolume(volume);
            });

            wavesurfer.on('audioprocess', () => {
                if (isDestroyed) return;
                setCurrentTime(wavesurfer!.getCurrentTime());
            });

            wavesurfer.on('seeking', () => {
                if (isDestroyed) return;
                setCurrentTime(wavesurfer!.getCurrentTime());
            });

            wavesurfer.on('play', () => !isDestroyed && setIsPlaying(true));
            wavesurfer.on('pause', () => !isDestroyed && setIsPlaying(false));
            wavesurfer.on('finish', () => !isDestroyed && setIsPlaying(false));

            wavesurfer.on('error', (err: Error) => {
                if (isDestroyed) return;
                console.error('WaveSurfer error:', err);
                onError?.();
            });

            try {
                await wavesurfer.load(audioUrl);
            } catch (err) {
                if (!isDestroyed) {
                    console.error('WaveSurfer load error:', err);
                }
            }
        };

        initWaveSurfer();

        return () => {
            isDestroyed = true;
            wavesurferRef.current = null;
            if (wavesurfer) {
                try {
                    wavesurfer.destroy();
                } catch {
                    // Ignore errors during cleanup
                }
            }
        };
    }, [audioUrl, onError]);

    // Effect to update volume when state changes
    useEffect(() => {
        if (wavesurferRef.current && isReady) {
            wavesurferRef.current.setVolume(volume);
        }
    }, [volume, isReady]);

    const togglePlayPause = useCallback(() => {
        if (wavesurferRef.current) {
            wavesurferRef.current.playPause();
        }
    }, []);

    // Manual click-to-seek handler - bypasses any event capturing issues
    const handleWaveformClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
        if (!wavesurferRef.current || !isReady || !containerRef.current) return;

        // Get click position relative to container
        const rect = containerRef.current.getBoundingClientRect();
        const clickX = e.clientX - rect.left;
        const containerWidth = rect.width;

        // Calculate seek position (0 to 1)
        const seekPosition = Math.max(0, Math.min(1, clickX / containerWidth));

        // Seek to position
        wavesurferRef.current.seekTo(seekPosition);
    }, [isReady]);

    return (
        <div className="w-full space-y-3">
            {/* Waveform Container */}
            <div className="relative bg-secondary/50 rounded-xl p-3 border border-border/50">
                {!isReady && (
                    <div className="absolute inset-0 flex items-center justify-center bg-background/50 backdrop-blur-[1px] rounded-xl z-10 transition-all pointer-events-none">
                        <div className="flex items-center gap-2 text-muted-foreground text-sm">
                            <Loader2 className="h-4 w-4 animate-spin text-primary" />
                            <span>Cargando audio...</span>
                        </div>
                    </div>
                )}
                {/* 
                    Manual onClick handler for seeking - works as fallback
                    when WaveSurfer's internal click handling is blocked
                */}
                <div
                    ref={containerRef}
                    className="w-full cursor-pointer relative z-20"
                    onClick={handleWaveformClick}
                    data-vaul-no-drag
                />
            </div>

            {/* Controls */}
            <div className="flex items-center gap-4">
                {/* Play/Pause Button */}
                <Button
                    onClick={togglePlayPause}
                    disabled={!isReady}
                    size="icon"
                    className={cn(
                        "rounded-full h-12 w-12 shadow-lg hover:scale-105 transition-all duration-200",
                        isPlaying ? "bg-primary text-primary-foreground" : "bg-gradient-to-br from-violet-500 to-fuchsia-600 border-0 text-white"
                    )}
                >
                    {isPlaying ? (
                        <Pause className="h-5 w-5 fill-current" />
                    ) : (
                        <Play className="h-5 w-5 fill-current ml-0.5" />
                    )}
                </Button>

                {/* Time Display */}
                <div className="flex-1 font-mono text-sm text-muted-foreground bg-secondary/30 px-3 py-1.5 rounded-md border border-border/30 w-fit">
                    <span className="text-foreground font-medium">{formatTime(currentTime)}</span>
                    <span className="mx-1 opacity-50">/</span>
                    <span>{formatTime(duration)}</span>
                </div>

                {/* Volume Control */}
                <div
                    className="relative flex items-center gap-2 group"
                    onMouseEnter={() => {
                        if (closeTimeoutRef.current) {
                            clearTimeout(closeTimeoutRef.current);
                            closeTimeoutRef.current = null;
                        }
                        setShowVolume(true);
                    }}
                    onMouseLeave={() => {
                        closeTimeoutRef.current = setTimeout(() => {
                            setShowVolume(false);
                        }, 300);
                    }}
                >
                    <div className={cn(
                        "absolute right-full top-1/2 -translate-y-1/2 mr-3 p-3 rounded-xl border bg-popover shadow-xl transition-all duration-200 origin-right flex items-center gap-2 z-50",
                        showVolume ? "scale-100 opacity-100 translate-x-0" : "scale-95 opacity-0 translate-x-2 pointer-events-none"
                    )}>
                        <div className="w-[100px]">
                            <Slider
                                orientation="horizontal"
                                defaultValue={[volume]}
                                max={1}
                                step={0.01}
                                onValueChange={(vals) => setVolume(vals[0])}
                                className="w-full"
                            />
                        </div>
                    </div>

                    <Button
                        variant="ghost"
                        size="icon"
                        className="text-muted-foreground hover:text-foreground relative z-10"
                        onClick={() => setShowVolume(!showVolume)}
                    >
                        {volume === 0 ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
                    </Button>
                </div>
            </div>
        </div>
    );
}
