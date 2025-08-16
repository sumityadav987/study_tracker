import React from 'react';

interface GaugeProps {
  value: number; // 0-100
  size?: number;
  strokeWidth?: number;
  className?: string;
}

export const Gauge: React.FC<GaugeProps> = ({ 
  value, 
  size = 80, 
  strokeWidth = 8,
  className = '' 
}) => {
  const normalizedValue = Math.max(0, Math.min(100, value));
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDasharray = circumference;
  const strokeDashoffset = circumference - (normalizedValue / 100) * circumference;

  // Color based on value
  const getColor = (val: number): string => {
    if (val >= 70) return '#10b981'; // Green
    if (val >= 40) return '#f97316'; // Orange
    return '#ef4444'; // Red
  };

  const color = getColor(normalizedValue);

  return (
    <div className={`relative ${className}`} style={{ width: size, height: size }}>
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="transform -rotate-90"
      >
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#e5e7eb"
          strokeWidth={strokeWidth}
        />
        
        {/* Progress circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={strokeDasharray}
          strokeDashoffset={strokeDashoffset}
          className="transition-all duration-500 ease-in-out"
        />
      </svg>
      
      {/* Center text */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="text-center">
          <div className="text-sm font-bold text-gray-900">
            {Math.round(normalizedValue)}
          </div>
          <div className="text-xs text-gray-500">
            Focus
          </div>
        </div>
      </div>
    </div>
  );
};