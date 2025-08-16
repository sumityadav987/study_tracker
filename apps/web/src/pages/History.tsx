import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getSessionsByUser, Session } from '../lib/idb';
import { WeeklyBars } from '../components/Charts/WeeklyBars';
import { useAuthState } from '../lib/firebase';
import { ArrowLeft, Calendar, Clock, Target, TrendingUp, Eye } from 'lucide-react';

export const History: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuthState();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterPeriod, setFilterPeriod] = useState<'week' | 'month' | 'all'>('week');

  useEffect(() => {
    if (user) {
      loadSessions();
    }
  }, [user]);

  const loadSessions = async () => {
    if (!user) return;
    
    try {
      const sessionData = await getSessionsByUser(user.uid, 100);
      setSessions(sessionData);
    } catch (error) {
      console.error('Failed to load sessions:', error);
    } finally {
      setLoading(false);
    }
  };

  const getFilteredSessions = () => {
    const now = new Date();
    const cutoff = new Date(now);

    switch (filterPeriod) {
      case 'week':
        cutoff.setDate(now.getDate() - 7);
        break;
      case 'month':
        cutoff.setDate(now.getDate() - 30);
        break;
      case 'all':
        return sessions;
    }

    return sessions.filter(session => new Date(session.startedAt) >= cutoff);
  };

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  const getEngagementRate = (session: Session) => {
    return Math.round((session.engagedSec / session.durationSec) * 100);
  };

  const filteredSessions = getFilteredSessions();
  
  const totalStats = filteredSessions.reduce(
    (acc, session) => ({
      totalTime: acc.totalTime + session.durationSec,
      totalFocused: acc.totalFocused + session.engagedSec,
      sessionCount: acc.sessionCount + 1,
      avgEngagement: 0 // Will calculate after
    }),
    { totalTime: 0, totalFocused: 0, sessionCount: 0, avgEngagement: 0 }
  );

  totalStats.avgEngagement = totalStats.totalTime > 0 
    ? Math.round((totalStats.totalFocused / totalStats.totalTime) * 100)
    : 0;

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your study history...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => navigate('/')}
              className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Study History</h1>
              <p className="text-gray-600">Track your focus and productivity over time</p>
            </div>
          </div>

          <button
            onClick={() => navigate('/study')}
            className="btn-primary px-4 py-2"
          >
            New Session
          </button>
        </div>

        {/* Filter Tabs */}
        <div className="flex space-x-1 bg-gray-200 p-1 rounded-lg mb-8 w-fit">
          {(['week', 'month', 'all'] as const).map(period => (
            <button
              key={period}
              onClick={() => setFilterPeriod(period)}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                filterPeriod === period
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              {period === 'week' ? 'Last 7 Days' : period === 'month' ? 'Last 30 Days' : 'All Time'}
            </button>
          ))}
        </div>

        {/* Stats Overview */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center">
              <Calendar className="w-8 h-8 text-blue-600 mr-3" />
              <div>
                <p className="text-sm text-gray-600">Sessions</p>
                <p className="text-2xl font-bold text-gray-900">{totalStats.sessionCount}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center">
              <Clock className="w-8 h-8 text-green-600 mr-3" />
              <div>
                <p className="text-sm text-gray-600">Total Time</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatDuration(totalStats.totalTime)}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center">
              <Target className="w-8 h-8 text-orange-600 mr-3" />
              <div>
                <p className="text-sm text-gray-600">Focused Time</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatDuration(totalStats.totalFocused)}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center">
              <TrendingUp className="w-8 h-8 text-purple-600 mr-3" />
              <div>
                <p className="text-sm text-gray-600">Avg Focus</p>
                <p className="text-2xl font-bold text-gray-900">{totalStats.avgEngagement}%</p>
              </div>
            </div>
          </div>
        </div>

        {/* Weekly Chart */}
        <div className="mb-8">
          <WeeklyBars sessions={filteredSessions} />
        </div>

        {/* Sessions List */}
        <div className="bg-white rounded-lg shadow-sm border">
          <div className="px-6 py-4 border-b">
            <h3 className="text-lg font-semibold text-gray-900">Recent Sessions</h3>
          </div>
          
          {filteredSessions.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <Calendar className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p className="text-lg font-medium mb-2">No sessions found</p>
              <p>Start your first study session to see your progress here.</p>
            </div>
          ) : (
            <div className="divide-y">
              {filteredSessions.map((session) => (
                <div
                  key={session.id}
                  className="px-6 py-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-4">
                        <div>
                          <p className="font-medium text-gray-900">
                            {new Date(session.startedAt).toLocaleDateString()}
                          </p>
                          <p className="text-sm text-gray-600">
                            {new Date(session.startedAt).toLocaleTimeString()} - {new Date(session.endedAt).toLocaleTimeString()}
                          </p>
                        </div>
                        
                        <div className="flex items-center space-x-6 text-sm">
                          <div className="flex items-center text-gray-600">
                            <Clock className="w-4 h-4 mr-1" />
                            {formatDuration(session.durationSec)}
                          </div>
                          
                          <div className="flex items-center text-green-600">
                            <Target className="w-4 h-4 mr-1" />
                            {getEngagementRate(session)}% focused
                          </div>
                          
                          <div className="flex items-center text-orange-600">
                            <TrendingUp className="w-4 h-4 mr-1" />
                            {session.distractedEpisodes} distractions
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <button
                      onClick={() => navigate(`/summary/${session.id}`)}
                      className="btn-secondary px-3 py-1 text-sm flex items-center space-x-1"
                    >
                      <Eye className="w-4 h-4" />
                      <span>View</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};