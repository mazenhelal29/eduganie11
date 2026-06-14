"use client";

import { useEffect, useRef, useState } from "react";
import { Html5Qrcode, Html5QrcodeSupportedFormats } from "html5-qrcode";
import { Camera, CameraOff, RefreshCw } from "lucide-react";

interface CameraScannerProps {
  onScan: (decodedText: string) => void;
  paused?: boolean;
}

export function CameraScanner({ onScan, paused = false }: CameraScannerProps) {
  const [hasError, setHasError] = useState<string | null>(null);
  const [hasCameras, setHasCameras] = useState(true);
  const [facingMode, setFacingMode] = useState<"environment" | "user">("environment");
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const regionRef = useRef<HTMLDivElement>(null);
  const [isInitializing, setIsInitializing] = useState(true);

  useEffect(() => {
    let mounted = true;
    
    const initScanner = async () => {
      try {
        const cameras = await Html5Qrcode.getCameras();
        if (cameras && cameras.length > 0) {
          if (!mounted) return;
          setHasCameras(true);
          
          if (!scannerRef.current) {
            scannerRef.current = new Html5Qrcode("qr-reader");
          }

          const html5QrCode = scannerRef.current;
          
          if (html5QrCode.isScanning) {
            await html5QrCode.stop();
          }

          html5QrCode.start(
            { facingMode: facingMode },
            {
              fps: 10,
              qrbox: { width: 250, height: 250 },
              formatsToSupport: [Html5QrcodeSupportedFormats.QR_CODE],
            },
            (decodedText) => {
              // Ignore scans if paused
              if (!paused) {
                onScan(decodedText);
              }
            },
            () => {
              // Ignore scan failures (happens every frame when no QR is found)
            }
          ).then(() => {
            if (mounted) setIsInitializing(false);
          }).catch((err) => {
            console.error("Failed to start camera:", err);
            if (mounted) setHasError("تعذر تشغيل الكاميرا. تأكد من إعطاء الصلاحيات.");
            if (mounted) setIsInitializing(false);
          });
        } else {
          if (mounted) {
            setHasCameras(false);
            setHasError("لم يتم العثور على كاميرا في جهازك.");
            setIsInitializing(false);
          }
        }
      } catch (err) {
        console.error("Camera permissions error:", err);
        if (mounted) {
          setHasError("الرجاء السماح للمتصفح باستخدام الكاميرا.");
          setIsInitializing(false);
        }
      }
    };

    initScanner();

    return () => {
      mounted = false;
      if (scannerRef.current?.isScanning) {
        scannerRef.current.stop().catch(console.error);
      }
    };
  }, [facingMode]); // Restart when facingMode changes

  // Handle pause/resume efficiently without restarting camera
  useEffect(() => {
    if (scannerRef.current && scannerRef.current.isScanning) {
      if (paused) {
        scannerRef.current.pause();
      } else {
        scannerRef.current.resume();
      }
    }
  }, [paused]);

  const toggleCamera = () => {
    setFacingMode(prev => prev === "environment" ? "user" : "environment");
    setIsInitializing(true);
  };

  if (hasError && !isInitializing) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center bg-red-50 rounded-2xl border-2 border-red-100">
        <CameraOff className="w-12 h-12 text-red-400 mb-4" />
        <p className="text-red-600 font-medium">{hasError}</p>
        <button 
          onClick={() => { setHasError(null); setIsInitializing(true); }}
          className="mt-4 px-4 py-2 bg-red-100 text-red-700 rounded-lg font-medium hover:bg-red-200"
        >
          حاول مرة أخرى
        </button>
      </div>
    );
  }

  return (
    <div className="relative w-full max-w-sm mx-auto overflow-hidden rounded-2xl bg-black shadow-xl border-4 border-slate-800">
      
      {/* Scanner Element */}
      <div id="qr-reader" ref={regionRef} className="w-full" style={{ minHeight: '300px' }}></div>
      
      {/* Overlays */}
      {isInitializing && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-slate-900/80 backdrop-blur-sm text-white">
          <RefreshCw className="w-8 h-8 animate-spin mb-2" />
          <p>جاري تشغيل الكاميرا...</p>
        </div>
      )}

      {paused && !isInitializing && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-emerald-900/80 backdrop-blur-md text-white transition-all duration-300">
          <p className="text-lg font-bold">تم التقاط الكود! ✨</p>
        </div>
      )}

      {/* Controls */}
      <div className="absolute top-4 right-4 z-20">
        <button 
          onClick={toggleCamera}
          className="p-3 bg-black/50 hover:bg-black/80 backdrop-blur text-white rounded-full transition-colors"
          title="تبديل الكاميرا"
        >
          <Camera className="w-5 h-5" />
        </button>
      </div>

    </div>
  );
}
