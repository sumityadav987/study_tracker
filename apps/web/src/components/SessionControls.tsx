import React from 'react';
import { Play, Pause, Square, Settings } from 'lucide-react';

interface SessionControlsProps {
  isActive: boolean;
  isPaused: boolean;
  onStart: () => void;
  onPause: () => void;
  onResume: () => void;
  onStop: () => void;
  onSettings?: () => void;
  className?: string;
}

export const SessionControls: React.FC<SessionControlsProps> = ({
  isActive,
  isPaused,
  onStart,
  onPause,
  onResume,
  onStop,
  onSettings,
  className = ''
}) => {
  return (
    <div className={`flex items-center justify-center space-x-4 ${className}`}>
      {!isActive ? (
        <button
          onClick={onStart}
          className="btn-primary px-8 py-3 text-lg font-semibold rounded-xl flex items-center space-x-2 shadow-lg hover:shadow-xl transition-shadow"
        >
          <Play className="w-5 h-5" />
          <span>Start Session</span>
        </button>
      ) : (
        <div className="flex items-center space-x-3">
          {isPaused ? (
            <button
              onClick={onResume}
              className="btn-primary px-6 py-2 rounded-lg flex items-center space-x-2"
            >
              <Play className="w-4 h-4" />
              <span>Resume</span>
            </button>
          ) : (
            <button
              onClick={onPause}
              className="btn-secondary px-6 py-2 rounded-lg flex items-center space-x-2"
            >
              <Pause className="w-4 h-4" />
              <span>Pause</span>
            </button>
          )}
          
          <button
            onClick={onStop}
            className="bg-red-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-red-700 transition-colors duration-200 flex items-center space-x-2"
          >
            <Square className="w-4 h-4" />
            <span>Stop</span>
          </button>
        </div>
      )}

      {onSettings && (
        <button
          onClick={onSettings}
          className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <Settings className="w-5 h-5" />
        </button>
      )}
    </div>
  );
};