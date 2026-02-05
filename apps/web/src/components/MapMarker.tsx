'use client';

import React, { useState } from "react";
import {
    motion,
    useTransform,
    AnimatePresence,
    useMotionValue,
    useSpring,
} from "motion/react";
import { SoundMarker } from "./Map";

interface MapMarkerProps {
    sound: SoundMarker;
    onClick: () => void;
}

export const MapMarker = ({ sound, onClick }: MapMarkerProps) => {
    const [isHovered, setIsHovered] = useState(false);
    const springConfig = { stiffness: 100, damping: 15 };
    const x = useMotionValue(0);

    const rotate = useSpring(
        useTransform(x, [-100, 100], [-45, 45]),
        springConfig
    );
    const translateX = useSpring(
        useTransform(x, [-100, 100], [-50, 50]),
        springConfig
    );

    const handleMouseMove = (event: React.MouseEvent<HTMLDivElement>) => {
        const halfWidth = event.currentTarget.offsetWidth / 2;
        x.set(event.nativeEvent.offsetX - halfWidth);
    };

    return (
        <div
            style={{ width: '40px', height: '40px', position: 'relative' }}
            className="group cursor-pointer"
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            onClick={(e) => {
                e.stopPropagation();
                onClick();
            }}
        >
            {/* Wrapper for centering */}
            <div
                style={{
                    position: 'absolute',
                    bottom: '100%',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    marginBottom: '12px',
                    pointerEvents: isHovered ? 'auto' : 'none',
                }}
            >
                <AnimatePresence>
                    {isHovered && (
                        <motion.div
                            initial={{ opacity: 0, y: 20, scale: 0.6 }}
                            animate={{
                                opacity: 1,
                                y: 0,
                                scale: 1,
                                transition: {
                                    type: "spring",
                                    stiffness: 260,
                                    damping: 10,
                                },
                            }}
                            exit={{ opacity: 0, y: 20, scale: 0.6 }}
                            style={{
                                translateX: translateX,
                                rotate: rotate,
                            }}
                            className="z-50 flex flex-col items-center rounded-xl bg-gradient-to-b from-zinc-900 to-black px-5 py-3 shadow-2xl border border-white/10 w-56"
                        >
                            {/* Lightbeams - violet/fuchsia theme */}
                            <div className="absolute inset-x-10 -bottom-px z-30 h-px w-[20%] bg-gradient-to-r from-transparent via-violet-500 to-transparent" />
                            <div className="absolute -bottom-px left-10 z-30 h-px w-[40%] bg-gradient-to-r from-transparent via-fuchsia-500 to-transparent" />

                            {/* Category & Environment Badges */}
                            <div className="flex flex-wrap justify-center gap-1.5 mb-2">
                                {sound.category && (
                                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium uppercase bg-violet-500/20 text-violet-300 border border-violet-500/30">
                                        {sound.category}
                                    </span>
                                )}
                                {sound.environment && (
                                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium uppercase bg-fuchsia-500/20 text-fuchsia-300 border border-fuchsia-500/30">
                                        {sound.environment}
                                    </span>
                                )}
                            </div>

                            {/* Title */}
                            <div className="text-base font-bold text-white text-center leading-tight w-full">
                                {sound.title}
                            </div>

                            {/* Author */}
                            <div className="text-[10px] text-white/50 mt-1 mb-1 font-medium">
                                Por: {sound.authorName}
                            </div>

                            {/* CTA */}
                            <div className="mt-2 flex items-center gap-1.5 text-xs text-violet-400 font-medium">
                                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                                </svg>
                                <span>Escuchar</span>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Marker Icon */}
            <div
                onMouseMove={handleMouseMove}
                className="w-full h-full rounded-full bg-gradient-to-br from-violet-600 to-fuchsia-600 border-[3px] border-white shadow-[0_4px_12px_rgba(139,92,246,0.6)] flex items-center justify-center transition-transform duration-200 group-hover:scale-110 group-hover:shadow-[0_0_20px_rgba(217,70,239,0.5)]"
            >
                <svg width="20" height="20" fill="white" viewBox="0 0 20 20">
                    <path d="M18 3a1 1 0 00-1.196-.98l-10 2A1 1 0 006 5v9.114A4.369 4.369 0 005 14c-1.657 0-3 .895-3 2s1.343 2 3 2 3-.895 3-2V7.82l8-1.6v5.894A4.37 4.37 0 0015 12c-1.657 0-3 .895-3 2s1.343 2 3 2 3-.895 3-2V3z" />
                </svg>
            </div>
        </div>
    );
};
