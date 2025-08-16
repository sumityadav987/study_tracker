import React from 'react';
import { Line } from 'react-chartjs-2';
import { TimeSeriesPoint } from '../../lib/idb';
import { chartOptions } from '../../lib/charts';

interface FocusTimelineProps {
  data: TimeSeriesPoint[];
  className?: string;
}

export const FocusTimeline: React.FC<FocusTimelineProps> = ({ data, className = '' }) => {
  const chartData = {
    labels: data.map(point => {
      const minutes = Math.floor(point.tSec / 60);
      const seconds = point.tSec % 60;
      return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    }),
    datasets: [
      {
        label: 'Focus Score',
        data: data.map(point => point.score),
        borderColor: '#3b82f6',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        borderWidth: 2,
        fill: true,
        tension: 0.4,
        pointRadius: 1,
        pointHoverRadius: 4,
      }
    ]
  };

  const options = {
    ...chartOptions,
    scales: {
      ...chartOptions.scales,
      y: {
        ...chartOptions.scales.y,
        min: 0,
        max: 100,
        title: {
          display: true,
          text: 'Focus Score'
        }
      },
      x: {
        ...chartOptions.scales.x,
        title: {
          display: true,
          text: 'Time (mm:ss)'
        }
      }
    },
    plugins: {
      ...chartOptions.plugins,
      tooltip: {
        callbacks: {
          afterLabel: (context: any) => {
            const point = data[context.dataIndex];
            return `State: ${point.state.charAt(0).toUpperCase() + point.state.slice(1)}`;
          }
        }
      }
    }
  };

  return (
    <div className={`bg-white p-6 rounded-lg shadow-sm border ${className}`}>
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Focus Over Time</h3>
      <div className="h-64">
        <Line data={chartData} options={options} />
      </div>
    </div>
  );
};