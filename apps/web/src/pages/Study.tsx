import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { CameraPreview } from '../components/CameraPreview';
import { OverlayHUD } from '../components/OverlayHUD';
import { SessionControls } from '../components/SessionControls';
import { useSessionStore } from '../store/sessionStore';
import { useUserPrefsStore } from '../store/userPrefsStore';
import { useAuthState } from '../lib/firebase';
import { faceAPILoader } from '../lib/cv/faceApiLoader';
import { mediaPipeHands } from '../lib/cv/mediapipeHands';
import { EngagementEngine, EngagementMetrics } from '../lib/cv/engagementEngine';
import { showNotification } from '../lib/notifications';
import { audioManager } from '../lib/audio';
import { ArrowLeft, Settings } from 'lucide-react';

export const Study: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuthState();
  const { settings } = useUserPrefsStore();
  const { 
    currentSession, 
    startSession, 
    pauseSession, 
    resumeSession, 
    stopSession, 
    addMetrics,
    recordNudge,
    shouldShowNudge 
  } = useSessionStore();

  const [videoElement, setVideoElement] = useState<HTMLVideoElement | null>(null);
  const [currentMetrics, setCurrentMetrics] = useState<EngagementMetrics | null>(null);
  const [processingActive, setProcessingActive] = useState(false);
  
  const engagementEngineRef = useRef<EngagementEngine | null>(null);
  const processingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastNudgeStateRef = useRef<string>('');

  // Initialize engagement engine
  useEffect(() => {
    if (settings) {
      engagementEngineRef.current = new EngagementEngine({
        eyeClosedDuration: 1.0,
        yawnDuration: 1.0,
        lookAwayDuration: 1.5,
        baselineScore: 70,
      });
    }
  }, [settings]);

  // Start/stop processing based on session state
  useEffect(() => {
    if (currentSession?.isActive && !currentSession.isPaused && videoElement) {
      startProcessing();
    } else {
      stopProcessing();
    }

    return () => stopProcessing();
  }, [currentSession?.isActive, currentSession?.isPaused, videoElement]);

  const startProcessing = useCallback(() => {
    if (processingActive || !videoElement || !engagementEngineRef.current) return;

    setProcessingActive(true);
    processingIntervalRef.current = setInterval(async () => {
      try {
        // Run face detection
        const faceResult = await faceAPILoader.detectFace(videoElement);
        const cvMetrics = faceAPILoader.extractMetrics(faceResult, videoElement, {
          eyeClosedThreshold: settings?.thresholds.eyeClosedThreshold || 0.2,
          yawnThreshold: settings?.thresholds.yawnThreshold || 0.6,
          lookAwayThreshold: settings?.thresholds.lookAwayThreshold || 1.0,
        });

        // Run hand detection if enabled
        let handMetrics = { handsPresent: false, handsFidgeting: false, handOverFace: false, fidgetingIntensity: 0 };
        if (settings?.handsEnabled) {
          const handResult = await mediaPipeHands.detectHands(videoElement);
          handMetrics = mediaPipeHands.extractHandMetrics(handResult, {
            fidgetingThreshold: settings?.thresholds.fidgetingThreshold || 0.3,
          });
        }

        // Process engagement metrics
        const metrics = engagementEngineRef.current!.processFrame(
          cvMetrics,
          handMetrics,
          Date.now()
        );

        setCurrentMetrics(metrics);
        addMetrics(metrics);

        // Check for nudges
        await checkForNudges(metrics);

      } catch (error) {
        console.error('Processing error:', error);
      }
    }, 1000); // Process at 1 FPS to save CPU
  }, [videoElement, settings, addMetrics]);

  const stopProcessing = useCallback(() => {
    setProcessingActive(false);
    if (processingIntervalRef.current) {
      clearInterval(processingIntervalRef.current);
      processingIntervalRef.current = null;
    }
  }, []);

  const checkForNudges = async (metrics: EngagementMetrics) => {
    if (!settings?.notificationsEnabled) return;
    if (!shouldShowNudge(Date.now())) return;

    const needsNudge = 
      metrics.state === 'distracted' || 
      metrics.state === 'sleepy' || 
      metrics.state === 'away';

    // Only nudge if state changed or it's been consistently bad
    if (needsNudge && lastNudgeStateRef.current !== metrics.state) {
      let message = 'Stay focused!';
      
      switch (metrics.state) {
        case 'sleepy':
          message = 'Looking tired. Take a short break?';
          break;
        case 'away':
          message = 'Welcome back! Let\'s focus.';
          break;
        case 'distracted':
          message = 'Gentle reminder: stay on task.';
          break;
      }

      showNotification(message, {
        tag: 'focus-nudge',
        requireInteraction: false,
      });
      
      await audioManager.playPing();
      recordNudge();
    }

    lastNudgeStateRef.current = metrics.state;
  };

  const handleStart = () => {
    if (!user) return;
    startSession(user.uid);
  };

  const handleStop = async () => {
    try {
      const sessionId = await stopSession();
      navigate(`/summary/${sessionId}`);
    } catch (error) {
      console.error('Failed to stop session:', error);
    }
  };

  const handleSettings = () => {
    navigate('/settings');
  };

  return (
    <div className="min-h-screen bg-gray-900 relative overflow-hidden">
      {/* Header */}
      <div className="absolute top-4 left-4 z-30">
        <button
          onClick={() => navigate('/')}
          className="glass-card p-2 text-white hover:bg-white/10 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
      </div>

      {/* Camera Feed */}
      <div className="absolute inset-0">
        <CameraPreview
          onVideoReady={setVideoElement}
          className="w-full h-full"
        />
      </div>

      {/* HUD Overlay */}
      {currentSession && (
        <OverlayHUD
          metrics={currentMetrics}
          duration={currentSession.duration}
          className="absolute inset-0"
        />
      )}

      {/* Bottom Controls */}
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 z-30">
        <div className="glass-card p-6">
          <SessionControls
            isActive={currentSession?.isActive || false}
            isPaused={currentSession?.isPaused || false}
            onStart={handleStart}
            onPause={pauseSession}
            onResume={resumeSession}
            onStop={handleStop}
            onSettings={handleSettings}
          />
        </div>
      </div>

      {/* Status Indicator */}
      {currentSession?.isActive && (
        <div className="absolute top-4 right-4 z-30">
          <div className={`glass-card px-3 py-2 flex items-center space-x-2 ${
            currentSession.isPaused ? 'bg-yellow-500/20' : 'bg-green-500/20'
          }`}>
            <div className={`w-3 h-3 rounded-full ${
              currentSession.isPaused ? 'bg-yellow-500' : 'bg-green-500 animate-pulse'
            }`} />
            <span className="text-white text-sm font-medium">
              {currentSession.isPaused ? 'Paused' : 'Recording'}
            </span>
          </div>
        </div>
      )}

      {/* Instructions Overlay (when not started) */}
      {!currentSession?.isActive && (
        <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-20">
          <div className="glass-card p-8 max-w-md text-center">
            <h2 className="text-2xl font-bold text-white mb-4">Ready to Study?</h2>
            <p className="text-gray-300 mb-6">
              Your AI study tracker will monitor your engagement and provide gentle nudges to help you stay focused.
            </p>
            <div className="space-y-2 text-sm text-gray-400">
              <p>✓ Face detection ready</p>
              <p>✓ Privacy-first processing</p>
              <p>✓ Smart notifications enabled</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};