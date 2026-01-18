"use client";

import React from "react";
import { cn } from "@/utils/cn";

interface GradientTechBackgroundProps {
  className?: string;
}

/**
 * Gradient Tech Background Component
 * A fallback background for devices without WebGL support
 * Uses CSS gradients and animations for a tech-inspired look
 */
export function GradientTechBackground({ className }: GradientTechBackgroundProps) {
  return (
    <div className={cn("absolute inset-0 overflow-hidden", className)}>
      {/* Main gradient background with animation - theme-aware */}
      <div className="absolute inset-0 bg-gradient-tech-light dark:bg-gradient-tech-dark animate-gradient-shift" />

      {/* Overlay gradients for depth effect - theme-aware */}
      <div className="absolute inset-0 bg-gradient-radial-light dark:bg-gradient-radial-dark opacity-60" />

      {/* Animated glow spots - brighter in light mode */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-400/30 dark:bg-blue-500/20 rounded-full blur-3xl animate-pulse-slow" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-400/30 dark:bg-cyan-500/20 rounded-full blur-3xl animate-pulse-slow animation-delay-2000" />

      {/* Subtle grid overlay for tech feel */}
      <div className="absolute inset-0 opacity-10">
        <div
          className="w-full h-full"
          style={{
            backgroundImage: `
              linear-gradient(rgba(255, 255, 255, 0.1) 1px, transparent 1px),
              linear-gradient(90deg, rgba(255, 255, 255, 0.1) 1px, transparent 1px)
            `,
            backgroundSize: '50px 50px'
          }}
        />
      </div>

      {/* Add styles for custom animations */}
      <style jsx>{`
        @keyframes gradient-shift {
          0%, 100% {
            background-position: 0% 50%;
          }
          50% {
            background-position: 100% 50%;
          }
        }

        @keyframes pulse-slow {
          0%, 100% {
            opacity: 0.6;
            transform: scale(1);
          }
          50% {
            opacity: 0.8;
            transform: scale(1.1);
          }
        }

        .bg-gradient-tech-light {
          background: linear-gradient(
            135deg,
            #e0f2fe 0%,
            #bae6fd 25%,
            #7dd3fc 50%,
            #93c5fd 75%,
            #dbeafe 100%
          );
          background-size: 400% 400%;
        }

        .bg-gradient-tech-dark {
          background: linear-gradient(
            135deg,
            #001a33 0%,
            #003366 25%,
            #004d7a 50%,
            #003d5c 75%,
            #001a33 100%
          );
          background-size: 400% 400%;
        }

        .bg-gradient-radial-light {
          background: radial-gradient(
            circle at 50% 50%,
            transparent 0%,
            rgba(186, 230, 253, 0.5) 100%
          );
        }

        .bg-gradient-radial-dark {
          background: radial-gradient(
            circle at 50% 50%,
            transparent 0%,
            rgba(0, 26, 51, 0.8) 100%
          );
        }

        .animate-gradient-shift {
          animation: gradient-shift 15s ease infinite;
        }

        .animate-pulse-slow {
          animation: pulse-slow 8s ease-in-out infinite;
        }

        .animation-delay-2000 {
          animation-delay: 2s;
        }
      `}</style>
    </div>
  );
}
