"use client";

import { useEffect, useState } from "react";

export function SplashScreen() {
  const [visible, setVisible] = useState(true);
  const [fadeOut, setFadeOut] = useState(false);

  useEffect(() => {
    // Don't show splash when navigating between pages — only on first mount
    const isPWA =
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as Navigator & { standalone?: boolean }).standalone === true;

    // Show splash for 1.8s, then fade out over 400ms
    const fadeTimer = setTimeout(() => setFadeOut(true), isPWA ? 1800 : 900);
    const hideTimer = setTimeout(() => setVisible(false), isPWA ? 2200 : 1300);

    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(hideTimer);
    };
  }, []);

  if (!visible) return null;

  return (
    <div
      aria-hidden="true"
      className="fixed inset-0 z-[99999] flex flex-col items-center justify-center"
      style={{
        background: "linear-gradient(135deg, #0f172a 0%, #172554 50%, #1e3a8a 100%)",
        transition: "opacity 400ms ease-out",
        opacity: fadeOut ? 0 : 1,
        pointerEvents: fadeOut ? "none" : "auto",
      }}
    >
      {/* Animated background orbs */}
      <div
        style={{
          position: "absolute",
          width: 400,
          height: 400,
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(16,185,129,0.15) 0%, transparent 70%)",
          top: "10%",
          right: "-10%",
          animation: "pulse 3s ease-in-out infinite",
        }}
      />
      <div
        style={{
          position: "absolute",
          width: 300,
          height: 300,
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(59,130,246,0.1) 0%, transparent 70%)",
          bottom: "10%",
          left: "-5%",
          animation: "pulse 3s ease-in-out infinite 1.5s",
        }}
      />

      {/* Logo */}
      <div
        style={{
          width: 96,
          height: 96,
          borderRadius: 24,
          overflow: "hidden",
          boxShadow: "0 25px 60px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.1)",
          animation: "logoEntrance 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) forwards",
          opacity: 0,
          transform: "scale(0.5)",
          marginBottom: 24,
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/logo.jpg"
          alt="EduGenie"
          style={{ width: "100%", height: "100%", objectFit: "cover" }}
        />
      </div>

      {/* App name */}
      <div
        style={{
          animation: "textEntrance 0.5s ease-out 0.3s forwards",
          opacity: 0,
          transform: "translateY(10px)",
          textAlign: "center",
        }}
      >
        <h1
          style={{
            fontSize: 32,
            fontWeight: 800,
            color: "white",
            letterSpacing: "-0.5px",
            fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
          }}
        >
          EduGenie
        </h1>
        <p
          style={{
            fontSize: 14,
            color: "rgba(147, 197, 253, 0.8)",
            marginTop: 6,
            fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
          }}
        >
          نظام إدارة المراكز التعليمية
        </p>
      </div>

      {/* Loading dots */}
      <div
        style={{
          display: "flex",
          gap: 8,
          marginTop: 48,
          animation: "textEntrance 0.5s ease-out 0.6s forwards",
          opacity: 0,
        }}
      >
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            style={{
              width: 8,
              height: 8,
              borderRadius: "50%",
              background: "#10b981",
              animation: `dots 1.2s ease-in-out ${i * 0.2}s infinite`,
            }}
          />
        ))}
      </div>

      <style>{`
        @keyframes logoEntrance {
          to { opacity: 1; transform: scale(1); }
        }
        @keyframes textEntrance {
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes dots {
          0%, 80%, 100% { transform: scale(0.6); opacity: 0.4; }
          40% { transform: scale(1); opacity: 1; }
        }
        @keyframes pulse {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.1); opacity: 0.7; }
        }
      `}</style>
    </div>
  );
}
