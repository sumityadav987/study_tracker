import React from 'react';
import { Bar } from 'react-chartjs-2';
import { Session } from '../../lib/idb';
import { chartOptions } from '../../lib/charts';

interface WeeklyBarsProps {
  sessions: Session[];
  className?: string;
}

export const WeeklyBars: React.FC<WeeklyBarsProps> = ({ sessions, className = '' }) => {
  // Group sessions by day for the last 7 days
  const today = new Date();
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const date = new Date(today);
    date.setDate(today.getDate() - (6 - i));
    return date;
  });

  const dailyData = last7Days.map(date => {
    const dateStr = date.toDateString();
    const daySessions = sessions.filter(session => 
      new Date(session.startedAt).toDateString() === dateStr
    );
    
    const totalFocusHours = daySessions.reduce((sum, session) => 
      sum + (session.engagedSec / 3600), 0
    );

    return {
      date: dateStr,
      label: date.toLocaleDateString('en', { weekday: 'short' }),
      focusHours: Math.round(totalFocusHours * 10) / 10 // Round to 1 decimal
    };
  });

  const chartData = {
    labels: dailyData.map(day => day.label),
    datasets: [
      {
        label: 'Focus Hours',
        data: dailyData.map(day => day.focusHours),
        backgroundColor: '#10b981',
        borderColor: '#059669',
        borderWidth: 1,
        borderRadius: 4,
      }
    ]
  };

  const options = {
    ...chartOptions,
    scales: {
      ...chartOptions.scales,
      y: {
        ...chartOptions.scales.y,
        beginAtZero: true,
        title: {
          display: true,
          text: 'Hours'
        }
      },
      x: {
        ...chartOptions.scales.x,
        title: {
          display: true,
          text: 'Day'
        }
      }
    }
  };

  return (
    <div className={`bg-white p-6 rounded-lg shadow-sm border ${className}`}>
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Weekly Focus Progress</h3>
      <div className="h-64">
        <Bar data={chartData} options={options} />
      </div>
      <div className="mt-4 text-center text-sm text-gray-600">
        Last 7 days • Total: {dailyData.reduce((sum, day) => sum + day.focusHours, 0).toFixed(1)} hours
      </div>
    </div>
  );
};