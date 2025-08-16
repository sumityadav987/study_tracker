import React from 'react';
import { Doughnut } from 'react-chartjs-2';
import { pieChartOptions, getEngagementColor } from '../../lib/charts';

interface FocusPieProps {
  data: {
    engaged: number;
    distracted: number;
    sleepy: number;
    away: number;
  };
  className?: string;
}

export const FocusPie: React.FC<FocusPieProps> = ({ data, className = '' }) => {
  const chartData = {
    labels: ['Engaged', 'Distracted', 'Sleepy', 'Away'],
    datasets: [
      {
        data: [data.engaged, data.distracted, data.sleepy, data.away],
        backgroundColor: [
          getEngagementColor('engaged'),
          getEngagementColor('distracted'),
          getEngagementColor('sleepy'),
          getEngagementColor('away')
        ],
        borderWidth: 2,
        borderColor: '#ffffff',
      }
    ]
  };

  return (
    <div className={`bg-white p-6 rounded-lg shadow-sm border ${className}`}>
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Engagement Distribution</h3>
      <div className="h-64 flex items-center justify-center">
        <div className="w-48 h-48">
          <Doughnut data={chartData} options={pieChartOptions} />
        </div>
      </div>
      <div className="mt-4 grid grid-cols-2 gap-2 text-sm">
        {Object.entries(data).map(([key, value]) => (
          <div key={key} className="flex items-center">
            <div 
              className="w-3 h-3 rounded-full mr-2"
              style={{ backgroundColor: getEngagementColor(key) }}
            />
            <span className="capitalize">{key}: {value}%</span>
          </div>
        ))}
      </div>
    </div>
  );
};