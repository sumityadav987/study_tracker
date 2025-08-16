import React from 'react';
import { EngagementMetrics, EngagementState } from '../lib/cv/engagementEngine';
import { Gauge } from './Gauge';
import { Eye, EyeOff, Zap, UserX, Brain } from 'lucide-react';

interface OverlayHUDProps {
  metrics: EngagementMetrics | null;
  duration: number;
  className?: string;
  showLandmarks?: boolean;
}

const stateConfig = {
  engaged: {
    color: 'text-focus-green-600',
    bg: 'bg-focus-green-50',
    border: 'border-focus-green-200',
    icon: Brain,
    label: 'Engaged'
  },
  distracted: {
    color: 'text-distracted-orange-600',
    bg: 'bg-distracted-orange-50',
    border: 'border-distracted-orange-200',
    icon: Zap,
    label: 'Distracted'
  },
  sleepy: {
    color: 'text-sleepy-blue-600',
    bg: 'bg-sleepy-blue-50',
    border: 'border-sleepy-blue-200',
    icon: EyeOff,
    label: 'Sleepy'
  },
  away: {
    color: 'text-away-red-600',
    bg: 'bg-away-red-50',
    border: 'border-away-red-200',
    icon: UserX,
    label: 'Away'
  }
};

export const OverlayHUD: React.FC<OverlayHUDProps> = ({ 
  metrics, 
  duration, 
  className = '',
  showLandmarks = false 
}) => {
  const formatTime = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hrs > 0) {
      return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const currentState = metrics?.state || 'away';
  const currentScore = metrics?.score || 0;
  const config = stateConfig[currentState];
  const Icon = config.icon;

  return (
    <div className={`hud-overlay ${className}`}>
      {/* Top HUD Bar */}
      <div className="absolute top-4 left-4 right-4 z-20">
        <div className="flex justify-between items-start">
          {/* State Badge */}
          <div className={`glass-card px-3 py-2 ${config.bg} ${config.border} border backdrop-blur-md`}>
            <div className="flex items-center space-x-2">
              <Icon className={`w-4 h-4 ${config.color}`} />
              <span className={`text-sm font-medium ${config.color}`}>
                {config.label}
              </span>
            </div>
          </div>

          {/* Timer */}
          <div className="glass-card px-4 py-2 text-center">
            <div className="text-xs text-gray-500 uppercase tracking-wide mb-1">
              Session Time
            </div>
            <div className="text-lg font-mono font-bold text-gray-900">
              {formatTime(duration)}
            </div>
          </div>
        </div>
      </div>

      {/* Bottom HUD Bar */}
      <div className="absolute bottom-4 left-4 right-4 z-20">
        <div className="flex justify-center">
          {/* Engagement Gauge */}
          <div className="glass-card px-6 py-4">
            <div className="flex items-center space-x-4">
              <div className="text-center">
                <div className="text-xs text-gray-500 uppercase tracking-wide mb-1">
                  Focus Score
                </div>
                <Gauge 
                  value={currentScore} 
                  size={60}
                  strokeWidth={6}
                  className="mx-auto"
                />
              </div>
              
              {metrics && (
                <div className="text-xs text-gray-600">
                  <div className="mb-1">
                    <span className="font-medium">Confidence:</span> {Math.round(metrics.confidence * 100)}%
                  </div>
                  <div>
                    <span className="font-medium">Updated:</span> {new Date(metrics.timestamp).toLocaleTimeString()}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Landmarks overlay (optional) */}
      {showLandmarks && (
        <div className="absolute inset-0 z-10 pointer-events-none">
          <canvas className="w-full h-full" id="landmarks-canvas" />
        </div>
      )}
    </div>
  );
};