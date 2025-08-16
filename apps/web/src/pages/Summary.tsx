import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getSessionById, getTimeSeriesBySession, Session, TimeSeriesPoint } from '../lib/idb';
import { FocusTimeline } from '../components/Charts/FocusTimeline';
import { FocusPie } from '../components/Charts/FocusPie';
import { ArrowLeft, Download, Trash2, Clock, Target, TrendingUp, Lightbulb } from 'lucide-react';

export const Summary: React.FC = () => {
  const { sessionId } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();
  
  const [session, setSession] = useState<Session | null>(null);
  const [timeSeries, setTimeSeries] = useState<TimeSeriesPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [tips, setTips] = useState<string[]>([]);

  useEffect(() => {
    if (sessionId) {
      loadSessionData(sessionId);
    }
  }, [sessionId]);

  const loadSessionData = async (id: string) => {
    try {
      const [sessionData, timeSeriesData] = await Promise.all([
        getSessionById(id),
        getTimeSeriesBySession(id)
      ]);

      if (sessionData) {
        setSession(sessionData);
        setTimeSeries(timeSeriesData);
        generateTips(sessionData, timeSeriesData);
      }
    } catch (error) {
      console.error('Failed to load session data:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateTips = (session: Session, timeSeries: TimeSeriesPoint[]) => {
    const tips: string[] = [];
    const totalDuration = session.durationSec;
    
    if (totalDuration === 0) return;

    // Tip 1: Overall performance
    const focusPercentage = (session.engagedSec / totalDuration) * 100;
    if (focusPercentage >= 80) {
      tips.push('Excellent focus! You maintained high engagement throughout the session.');
    } else if (focusPercentage >= 60) {
      tips.push('Good focus overall. Try to minimize distractions for even better results.');
    } else {
      tips.push('Consider shorter study sessions or taking breaks to improve focus.');
    }

    // Tip 2: Break recommendations
    if (totalDuration > 3600) { // More than 1 hour
      tips.push('For sessions over an hour, try the Pomodoro technique: 25 minutes study, 5 minutes break.');
    }

    // Tip 3: Distraction patterns
    if (session.distractedEpisodes > 5) {
      tips.push('Multiple distractions detected. Try putting your phone in another room or using website blockers.');
    }

    // Tip 4: Sleepiness
    if (session.sleepySec > totalDuration * 0.2) {
      tips.push('You showed signs of fatigue. Ensure you\'re well-rested and stay hydrated while studying.');
    }

    setTips(tips.slice(0, 3)); // Limit to 3 tips
  };

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}h ${minutes}m ${secs}s`;
    }
    return `${minutes}m ${secs}s`;
  };

  const downloadData = () => {
    if (!session || !timeSeries.length) return;

    const csvContent = [
      'Time (seconds),State,Score',
      ...timeSeries.map(point => `${point.tSec},${point.state},${point.score}`)
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `study-session-${session.id}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading session data...</p>
        </div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 mb-4">Session not found</p>
          <button onClick={() => navigate('/history')} className="btn-primary">
            View History
          </button>
        </div>
      </div>
    );
  }

  const stats = {
    engaged: Math.round((session.engagedSec / session.durationSec) * 100),
    distracted: Math.round((session.distractedSec / session.durationSec) * 100),
    sleepy: Math.round((session.sleepySec / session.durationSec) * 100),
    away: Math.round((session.awaySec / session.durationSec) * 100)
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => navigate('/history')}
              className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Session Summary</h1>
              <p className="text-gray-600">
                {new Date(session.startedAt).toLocaleString()}
              </p>
            </div>
          </div>

          <div className="flex space-x-2">
            <button
              onClick={downloadData}
              className="btn-secondary px-4 py-2 flex items-center space-x-2"
            >
              <Download className="w-4 h-4" />
              <span>Export Data</span>
            </button>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center">
              <Clock className="w-8 h-8 text-blue-600 mr-3" />
              <div>
                <p className="text-sm text-gray-600">Duration</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatDuration(session.durationSec)}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center">
              <Target className="w-8 h-8 text-green-600 mr-3" />
              <div>
                <p className="text-sm text-gray-600">Focus Time</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatDuration(session.engagedSec)}
                </p>
                <p className="text-sm text-green-600">{stats.engaged}% of session</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center">
              <TrendingUp className="w-8 h-8 text-orange-600 mr-3" />
              <div>
                <p className="text-sm text-gray-600">Distractions</p>
                <p className="text-2xl font-bold text-gray-900">
                  {session.distractedEpisodes}
                </p>
                <p className="text-sm text-gray-600">episodes</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center">
              <Lightbulb className="w-8 h-8 text-yellow-600 mr-3" />
              <div>
                <p className="text-sm text-gray-600">Focus Score</p>
                <p className="text-2xl font-bold text-gray-900">
                  {stats.engaged}%
                </p>
                <p className="text-sm text-gray-600">average</p>
              </div>
            </div>
          </div>
        </div>

        {/* Charts */}
        <div className="grid lg:grid-cols-3 gap-8 mb-8">
          <div className="lg:col-span-2">
            <FocusTimeline data={timeSeries} />
          </div>
          <div>
            <FocusPie data={stats} />
          </div>
        </div>

        {/* Tips & Insights */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
            <Lightbulb className="w-5 h-5 mr-2 text-yellow-500" />
            Personalized Tips
          </h3>
          <div className="space-y-3">
            {tips.map((tip, index) => (
              <div key={index} className="flex items-start space-x-3">
                <div className="flex-shrink-0 w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
                  <span className="text-sm font-medium text-blue-600">{index + 1}</span>
                </div>
                <p className="text-gray-700">{tip}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="mt-8 flex justify-center space-x-4">
          <button
            onClick={() => navigate('/study')}
            className="btn-primary px-8 py-3"
          >
            Start Another Session
          </button>
          <button
            onClick={() => navigate('/history')}
            className="btn-secondary px-8 py-3"
          >
            View All Sessions
          </button>
        </div>
      </div>
    </div>
  );
};