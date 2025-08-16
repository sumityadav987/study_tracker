import React, { useRef, useEffect, useState } from 'react';
import { Camera, CameraOff, AlertTriangle } from 'lucide-react';

interface CameraPreviewProps {
  onVideoReady: (video: HTMLVideoElement) => void;
  className?: string;
}

export const CameraPreview: React.FC<CameraPreviewProps> = ({ onVideoReady, className = '' }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);

  useEffect(() => {
    let mounted = true;

    const startCamera = async () => {
      try {
        const mediaStream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: 'user',
            width: { ideal: 640 },
            height: { ideal: 480 },
            frameRate: { ideal: 30, max: 60 }
          },
          audio: false
        });

        if (!mounted) {
          mediaStream.getTracks().forEach(track => track.stop());
          return;
        }

        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream;
          setStream(mediaStream);
          
          videoRef.current.onloadedmetadata = () => {
            if (videoRef.current && mounted) {
              videoRef.current.play();
              setIsStreaming(true);
              onVideoReady(videoRef.current);
            }
          };
        }
      } catch (err) {
        if (!mounted) return;
        
        console.error('Camera access error:', err);
        setError(err instanceof Error ? err.message : 'Failed to access camera');
      }
    };

    startCamera();

    return () => {
      mounted = false;
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [onVideoReady]);

  if (error) {
    return (
      <div className={`bg-red-50 border border-red-200 rounded-lg p-6 ${className}`}>
        <div className="flex items-center text-red-700 mb-2">
          <AlertTriangle className="w-5 h-5 mr-2" />
          <span className="font-medium">Camera Error</span>
        </div>
        <p className="text-red-600 text-sm mb-4">{error}</p>
        <div className="text-sm text-red-600">
          <p className="mb-2">Please ensure:</p>
          <ul className="list-disc list-inside space-y-1">
            <li>Camera permissions are granted</li>
            <li>No other applications are using the camera</li>
            <li>You're using HTTPS or localhost</li>
          </ul>
        </div>
      </div>
    );
  }

  return (
    <div className={`relative bg-gray-900 rounded-lg overflow-hidden ${className}`}>
      <video
        ref={videoRef}
        className="w-full h-full object-cover"
        playsInline
        muted
      />
      
      {!isStreaming && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-900">
          <div className="text-center text-white">
            <Camera className="w-12 h-12 mx-auto mb-2 animate-pulse" />
            <p>Starting camera...</p>
          </div>
        </div>
      )}
    </div>
  );
};