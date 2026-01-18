"use client";

import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import { AnimatedBackground } from "./AmbientLightBg";
import { GradientTechBackground } from "./GradientTechBackground";
import { isWebGLSupported } from "@/utils/webglDetect";
import { useTheme } from "@/hooks/useTheme";

export function ChromeBrowserBackground() {
  const { effectiveTheme } = useTheme();
  const [backgroundReady, setBackgroundReady] = useState(false);
  const [webglSupported, setWebglSupported] = useState<boolean | null>(null);
  const [useFallback, setUseFallback] = useState(false);

  // Detect WebGL support on mount
  useEffect(() => {
    const supported = isWebGLSupported();
    setWebglSupported(supported);

    if (!supported) {
      console.warn('WebGL not supported, using fallback gradient background');
      setUseFallback(true);
      setBackgroundReady(true);
    }
  }, []);

  // Listen for background animation ready state
  useEffect(() => {
    const handleBackgroundReady = () => {
      setBackgroundReady(true);
    };

    const handleBackgroundError = (event: Event) => {
      const customEvent = event as CustomEvent;
      console.error('AnimatedBackground failed, falling back to gradient:', customEvent.detail?.error);
      setUseFallback(true);
      setBackgroundReady(true);
    };

    // Listen for ambient background loaded event
    window.addEventListener("ambientBgLoaded", handleBackgroundReady);
    window.addEventListener("ambientBgError", handleBackgroundError);

    return () => {
      window.removeEventListener("ambientBgLoaded", handleBackgroundReady);
      window.removeEventListener("ambientBgError", handleBackgroundError);
    };
  }, []);

  return (
    <>
      {/* Theme-aware background - always visible as fallback */}
      <div className="fixed inset-0 z-0 bg-white dark:bg-black" />

      {/* Render background based on WebGL support and fallback state */}
      {useFallback ? (
        /* Fallback: Gradient Tech Background (no WebGL required) */
        <motion.div
          className="fixed inset-0 z-0 overflow-hidden"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, ease: "easeInOut" }}
        >
          <GradientTechBackground />
          {/* Theme-aware overlay */}
          <div className="absolute inset-0 bg-white/5 dark:bg-black/40" />
        </motion.div>
      ) : webglSupported !== false ? (
        /* WebGL supported: AnimatedBackground with loading-based opacity control */
        <motion.div
          className="fixed inset-0 z-0 overflow-hidden"
          initial={{ opacity: 0 }}
          animate={{ opacity: backgroundReady ? 1 : 0 }}
          transition={{ duration: 0.8, ease: "easeInOut" }}
          style={{
            opacity: backgroundReady ? 1 : 0,
          }}
        >
          {/* Animated background - render at desktop size for mobile consistency */}
          <div
            className="absolute"
            style={{
              width: "100vw",
              height: "100vh",
              minWidth: "1440px", // Desktop width for consistent appearance
              minHeight: "900px",  // Desktop height for consistent appearance
              left: "50%",
              top: "50%",
              transform: "translate(-50%, -50%)"
            }}
          >
            <AnimatedBackground speed={0.25} theme={effectiveTheme} />
          </div>
          {/* Theme-aware overlay */}
          <div className="absolute inset-0 bg-white/5 dark:bg-black/40" />
        </motion.div>
      ) : null}
    </>
  );
}