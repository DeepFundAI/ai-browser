"use client";

import React, { useEffect, useRef } from "react";
import { cn } from "@/utils/cn";

interface AnimatedBackgroundProps {
  className?: string;
  scale?: number;
  blur?: number;
  noise?: number;
  opacity?: number;
  speed?: number;
  theme?: 'light' | 'dark';
}

export function AnimatedBackground({
  className,
  scale = 0.9,
  blur = 0.06,
  noise = 0.08,
  opacity = 0.0,
  speed = 0.25,
  theme = 'dark',
}: AnimatedBackgroundProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const colorBgRef = useRef<any>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    let isDestroyed = false;

    // 动态创建并加载脚本
    const script = document.createElement("script");
    script.type = "module";

    // 内联脚本来导入和初始化 AmbientLightBg
    script.textContent = `
      import { AmbientLightBg } from '/jsm/AmbientLightBg.module.js';

      // 将 AmbientLightBg 暴露到全局，以便我们可以使用它
      window.AmbientLightBg = AmbientLightBg;

      // 触发自定义事件通知加载完成
      window.dispatchEvent(new Event('ambientBgLoaded'));
    `;

    // 监听加载完成事件
    const handleLoaded = () => {
      if (isDestroyed || !containerRef.current || !window.AmbientLightBg) return;

      try {
        // Define color schemes for different themes
        const darkColors = ["#004880", "#CDCFCF", "#3390C0", "#2B71A1", "#005A92", "#004880"];
        const lightColors = ["#E8F4F8", "#B8D4E0", "#A0C4D8", "#7FB3CC", "#5FA3C0", "#E8F4F8"];

        // 创建 AmbientLightBg 实例
        colorBgRef.current = new window.AmbientLightBg({
          dom: containerRef.current.id,
          colors: theme === 'light' ? lightColors : darkColors,
          loop: true,
          speed: speed,
        });

        // 应用自定义参数
        if (colorBgRef.current && colorBgRef.current.update) {
          // Scale 参数对应 pattern scale
          colorBgRef.current.update("pattern scale", scale);

          // Blur 参数对应 edge blur
          colorBgRef.current.update("edge blur", blur);

          // Noise 参数
          colorBgRef.current.update("noise", noise);

          // Theme-specific brightness and darkness adjustments
          if (theme === 'light') {
            // Light theme: Increase brightness, minimize darkness
            colorBgRef.current.update("brightness", 0.2);
            colorBgRef.current.update("darkness", 0.8);
          }
        }
      } catch (error) {
        // Handle initialization error (likely WebGL not supported)
        console.error('AmbientLightBg initialization failed:', error);

        // Trigger fallback event to notify parent component
        window.dispatchEvent(new CustomEvent('ambientBgError', {
          detail: { error }
        }));
      }
    };

    window.addEventListener("ambientBgLoaded", handleLoaded);
    document.body.appendChild(script);

    // 清理函数
    return () => {
      isDestroyed = true;
      window.removeEventListener("ambientBgLoaded", handleLoaded);

      if (colorBgRef.current && colorBgRef.current.destroy) {
        colorBgRef.current.destroy();
      }

      // 移除脚本
      if (script.parentNode) {
        script.parentNode.removeChild(script);
      }

      // 清理全局变量
      if (window.AmbientLightBg) {
        delete window.AmbientLightBg;
      }
    };
  }, [scale, blur, noise, speed, theme]);

  return (
    <div className={cn("absolute inset-0", className)}>
      <div ref={containerRef} id="ambient-bg-container" className="absolute inset-0" />
      <div className="absolute inset-0 bg-black pointer-events-none" style={{ opacity }} />
    </div>
  );
}

// 添加全局类型声明
declare global {
  interface Window {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    AmbientLightBg?: any;
  }
}
