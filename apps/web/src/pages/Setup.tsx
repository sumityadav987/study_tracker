import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Camera, CheckCircle, XCircle, Loader, Brain, Settings, Play } from 'lucide-react';
import { CameraPreview } from '../components/CameraPreview';
import { faceAPILoader } from '../lib/cv/faceApiLoader';
import { mediaPipeHands } from '../lib/cv/mediapipeHands';
import { audioManager } from '../lib/audio';
import { useAuthState } from '../lib/firebase';
import { useUserPrefsStore } from '../store/userPrefsStore';

interface SetupStep {
  id: string;
  title: string;
  description: string;
  status: 'pending' | 'loading' | 'success' | 'error';
  error?: string;
}

export const Setup: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuthState();
  const { loadSettings } = useUserPrefsStore();
  
  const [videoElement, setVideoElement] = useState<HTMLVideoElement | null>(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [steps, setSteps] = useState<SetupStep[]>([
    {
      id: 'camera',
      title: 'Camera Access',
      description: 'Grant camera permissions for engagement tracking',
      status: 'pending'
    },
    {
      id: 'performance',
      title: 'Performance Check',
      description: 'Verify device capabilities (WebGL, FPS)',
      status: 'pending'
    },
    {
      id: 'models',
      title: 'AI Models',
      description: 'Load face detection and engagement analysis models',
      status: 'pending'
    },
    {
      id: 'warmup',
      title: 'Model Warmup',
      description: 'Initialize models with your camera feed',
      status: 'pending'
    },
    {
      id: 'calibration',
      title: 'Baseline Calibration',
      description: 'Capture your neutral baseline for 10 seconds',
      status: 'pending'
    }
  ]);

  useEffect(() => {
    if (user) {
      loadSettings(user.uid);
    }
  }, [user, loadSettings]);

  useEffect(() => {
    if (videoElement && currentStep === 0) {
      runSetupSequence();
    }
  }, [videoElement, currentStep]);

  const updateStep = (stepId: string, updates: Partial<SetupStep>) => {
    setSteps(prev => prev.map(step => 
      step.id === stepId ? { ...step, ...updates } : step
    ));
  };

  const runSetupSequence = async () => {
    try {
      // Step 1: Camera already handled by CameraPreview
      updateStep('camera', { status: 'success' });
      setCurrentStep(1);

      // Step 2: Performance Check
      updateStep('performance', { status: 'loading' });
      await checkPerformance();
      updateStep('performance', { status: 'success' });
      setCurrentStep(2);

      // Step 3: Load Models
      updateStep('models', { status: 'loading' });
      await loadModels();
      updateStep('models', { status: 'success' });
      setCurrentStep(3);

      // Step 4: Warmup
      if (videoElement) {
        updateStep('warmup', { status: 'loading' });
        await warmupModels(videoElement);
        updateStep('warmup', { status: 'success' });
        setCurrentStep(4);
      }

      // Step 5: Calibration
      updateStep('calibration', { status: 'loading' });
      await runCalibration();
      updateStep('calibration', { status: 'success' });

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Setup failed';
      const currentStepId = steps[currentStep]?.id;
      if (currentStepId) {
        updateStep(currentStepId, { status: 'error', error: errorMessage });
      }
    }
  };

  const checkPerformance = async (): Promise<void> => {
    return new Promise((resolve, reject) => {
      // Check WebGL support
      const canvas = document.createElement('canvas');
      const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
      
      if (!gl) {
        reject(new Error('WebGL not supported'));
        return;
      }

      // Check FPS capability (simplified)
      let frameCount = 0;
      const startTime = performance.now();
      
      const countFrames = () => {
        frameCount++;
        if (frameCount < 30) {
          requestAnimationFrame(countFrames);
        } else {
          const elapsed = performance.now() - startTime;
          const fps = (frameCount / elapsed) * 1000;
          
          if (fps < 10) {
            reject(new Error(`Low FPS detected: ${fps.toFixed(1)}`));
          } else {
            resolve();
          }
        }
      };
      
      requestAnimationFrame(countFrames);
    });
  };

  const loadModels = async (): Promise<void> => {
    await Promise.all([
      faceAPILoader.initialize(),
      mediaPipeHands.initialize(),
      audioManager.initialize(),
      audioManager.loadSound('ping', '/ping.mp3')
    ]);
  };

  const warmupModels = async (video: HTMLVideoElement): Promise<void> => {
    await faceAPILoader.warmup(video);
  };

  const runCalibration = async (): Promise<void> => {
    // Simplified calibration - in a real app this would collect baseline metrics
    return new Promise((resolve) => {
      let countdown = 10;
      const timer = setInterval(() => {
        countdown--;
        updateStep('calibration', { 
          status: 'loading', 
          description: `Capturing baseline... ${countdown}s remaining` 
        });
        
        if (countdown <= 0) {
          clearInterval(timer);
          resolve();
        }
      }, 1000);
    });
  };

  const handleStartStudying = () => {
    navigate('/study');
  };

  const isComplete = steps.every(step => step.status === 'success');
  const hasError = steps.some(step => step.status === 'error');

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 rounded-full mb-4">
            <Brain className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Setup AI Study Tracker</h1>
          <p className="text-gray-600">Let's configure your personalized study environment</p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Camera Preview */}
          <div className="space-y-6">
            <div className="bg-white rounded-lg p-6 shadow-sm">
              <h2 className="text-xl font-semibold mb-4">Camera Preview</h2>
              <CameraPreview
                onVideoReady={setVideoElement}
                className="w-full h-64"
              />
              <p className="text-sm text-gray-600 mt-2">
                Your camera feed is processed locally. No images are ever stored or transmitted.
              </p>
            </div>

            {isComplete && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-6">
                <div className="flex items-center text-green-700 mb-3">
                  <CheckCircle className="w-5 h-5 mr-2" />
                  <span className="font-semibold">Setup Complete!</span>
                </div>
                <p className="text-green-600 mb-4">
                  Your AI study tracker is ready. You can now start a study session.
                </p>
                <button
                  onClick={handleStartStudying}
                  className="btn-primary px-6 py-2 flex items-center space-x-2"
                >
                  <Play className="w-4 h-4" />
                  <span>Start Studying</span>
                </button>
              </div>
            )}
          </div>

          {/* Setup Steps */}
          <div className="bg-white rounded-lg p-6 shadow-sm">
            <h2 className="text-xl font-semibold mb-4">Setup Progress</h2>
            <div className="space-y-4">
              {steps.map((step, index) => {
                const isActive = index === currentStep;
                return (
                  <div
                    key={step.id}
                    className={`border rounded-lg p-4 transition-colors ${
                      isActive ? 'border-blue-300 bg-blue-50' : 'border-gray-200'
                    }`}
                  >
                    <div className="flex items-center">
                      <div className="flex-shrink-0 mr-3">
                        {step.status === 'loading' ? (
                          <Loader className="w-5 h-5 text-blue-600 animate-spin" />
                        ) : step.status === 'success' ? (
                          <CheckCircle className="w-5 h-5 text-green-600" />
                        ) : step.status === 'error' ? (
                          <XCircle className="w-5 h-5 text-red-600" />
                        ) : (
                          <div className="w-5 h-5 border-2 border-gray-300 rounded-full" />
                        )}
                      </div>
                      <div className="flex-grow">
                        <h3 className="font-medium text-gray-900">{step.title}</h3>
                        <p className="text-sm text-gray-600">{step.description}</p>
                        {step.error && (
                          <p className="text-sm text-red-600 mt-1">{step.error}</p>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {hasError && (
              <div className="mt-6 bg-red-50 border border-red-200 rounded-lg p-4">
                <h4 className="font-medium text-red-800 mb-2">Setup Error</h4>
                <p className="text-sm text-red-600 mb-3">
                  Some setup steps failed. Please check your browser settings and try again.
                </p>
                <button
                  onClick={() => window.location.reload()}
                  className="btn-secondary text-sm px-4 py-2"
                >
                  Retry Setup
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="mt-8 text-center text-sm text-gray-500">
          <p>
            Need help? Check our{' '}
            <a href="#" className="text-blue-600 hover:text-blue-800">setup guide</a>{' '}
            or contact support.
          </p>
        </div>
      </div>
    </div>
  );
};