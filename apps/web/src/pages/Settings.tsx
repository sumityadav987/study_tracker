import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUserPrefsStore } from '../store/userPrefsStore';
import { useAuthState } from '../lib/firebase';
import { requestNotificationPermission, getNotificationPermission } from '../lib/notifications';
import { logout } from '../lib/firebase';
import { 
  ArrowLeft, 
  Bell, 
  Cloud, 
  Eye, 
  Hand, 
  Shield, 
  User, 
  Settings as SettingsIcon,
  Download,
  Trash2,
  AlertTriangle
} from 'lucide-react';

export const Settings: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuthState();
  const { settings, loadSettings, updateSettings, toggleCloudSync, toggleNotifications, toggleHandsEnabled } = useUserPrefsStore();
  
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>('default');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    if (user) {
      loadSettings(user.uid);
    }
    setNotificationPermission(getNotificationPermission());
  }, [user, loadSettings]);

  const handleNotificationToggle = async () => {
    if (!settings?.notificationsEnabled && notificationPermission !== 'granted') {
      const granted = await requestNotificationPermission();
      if (!granted) {
        alert('Please enable notifications in your browser settings to use this feature.');
        return;
      }
      setNotificationPermission('granted');
    }
    
    await toggleNotifications();
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const exportAllData = async () => {
    // Implementation would export all user data
    alert('Data export functionality would be implemented here');
  };

  const deleteAllData = async () => {
    // Implementation would delete all user data
    alert('Data deletion functionality would be implemented here');
    setShowDeleteConfirm(false);
  };

  if (!settings) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="flex items-center space-x-4 mb-8">
          <button
            onClick={() => navigate('/')}
            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
            <p className="text-gray-600">Customize your study experience</p>
          </div>
        </div>

        <div className="space-y-6">
          {/* Account Settings */}
          <div className="bg-white rounded-lg shadow-sm border">
            <div className="px-6 py-4 border-b">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                <User className="w-5 h-5 mr-2" />
                Account
              </h3>
            </div>
            <div className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-900">{user?.email}</p>
                  <p className="text-sm text-gray-600">Signed in with Firebase Auth</p>
                </div>
                <button
                  onClick={handleLogout}
                  className="btn-secondary px-4 py-2"
                >
                  Sign Out
                </button>
              </div>
            </div>
          </div>

          {/* Notifications */}
          <div className="bg-white rounded-lg shadow-sm border">
            <div className="px-6 py-4 border-b">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                <Bell className="w-5 h-5 mr-2" />
                Notifications
              </h3>
            </div>
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="font-medium text-gray-900">Focus Nudges</p>
                  <p className="text-sm text-gray-600">
                    Receive gentle reminders when you get distracted
                  </p>
                </div>
                <button
                  onClick={handleNotificationToggle}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    settings.notificationsEnabled ? 'bg-blue-600' : 'bg-gray-200'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      settings.notificationsEnabled ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
              
              {notificationPermission === 'denied' && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                  <div className="flex items-start">
                    <AlertTriangle className="w-5 h-5 text-yellow-600 mr-2 mt-0.5" />
                    <div className="text-sm">
                      <p className="text-yellow-800 font-medium">Notifications Blocked</p>
                      <p className="text-yellow-700">
                        Please enable notifications in your browser settings to receive focus nudges.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* AI Features */}
          <div className="bg-white rounded-lg shadow-sm border">
            <div className="px-6 py-4 border-b">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                <Eye className="w-5 h-5 mr-2" />
                AI Features
              </h3>
            </div>
            <div className="p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-900">Hand Gesture Detection</p>
                  <p className="text-sm text-gray-600">
                    Track hand movements to detect fidgeting and distractions
                  </p>
                </div>
                <button
                  onClick={toggleHandsEnabled}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    settings.handsEnabled ? 'bg-blue-600' : 'bg-gray-200'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      settings.handsEnabled ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              <div className="pt-4 border-t">
                <h4 className="font-medium text-gray-900 mb-3">Detection Thresholds</h4>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm text-gray-700 mb-1">
                      Eye Closed Threshold: {settings.thresholds.eyeClosedThreshold.toFixed(2)}
                    </label>
                    <input
                      type="range"
                      min="0.1"
                      max="0.5"
                      step="0.05"
                      value={settings.thresholds.eyeClosedThreshold}
                      onChange={(e) => updateSettings({
                        thresholds: {
                          ...settings.thresholds,
                          eyeClosedThreshold: parseFloat(e.target.value)
                        }
                      })}
                      className="w-full"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm text-gray-700 mb-1">
                      Yawn Threshold: {settings.thresholds.yawnThreshold.toFixed(2)}
                    </label>
                    <input
                      type="range"
                      min="0.3"
                      max="1.0"
                      step="0.1"
                      value={settings.thresholds.yawnThreshold}
                      onChange={(e) => updateSettings({
                        thresholds: {
                          ...settings.thresholds,
                          yawnThreshold: parseFloat(e.target.value)
                        }
                      })}
                      className="w-full"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Cloud Sync */}
          <div className="bg-white rounded-lg shadow-sm border">
            <div className="px-6 py-4 border-b">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                <Cloud className="w-5 h-5 mr-2" />
                Cloud Sync
              </h3>
            </div>
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="font-medium text-gray-900">Sync to Cloud</p>
                  <p className="text-sm text-gray-600">
                    Backup your session data and sync across devices
                  </p>
                </div>
                <button
                  onClick={toggleCloudSync}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    settings.cloudSync ? 'bg-blue-600' : 'bg-gray-200'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      settings.cloudSync ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
              
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <div className="flex items-start">
                  <Shield className="w-5 h-5 text-blue-600 mr-2 mt-0.5" />
                  <div className="text-sm">
                    <p className="text-blue-800 font-medium">Privacy Note</p>
                    <p className="text-blue-700">
                      Only aggregated metrics are synced. No raw video or images ever leave your device.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Privacy & Data */}
          <div className="bg-white rounded-lg shadow-sm border">
            <div className="px-6 py-4 border-b">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                <Shield className="w-5 h-5 mr-2" />
                Privacy & Data
              </h3>
            </div>
            <div className="p-6 space-y-4">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <h4 className="font-medium text-green-800 mb-2">What we store:</h4>
                <ul className="text-sm text-green-700 space-y-1">
                  <li>• Session timestamps and durations</li>
                  <li>• Engagement scores (per second)</li>
                  <li>• Aggregate statistics (focus time, distractions)</li>
                </ul>
              </div>
              
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <h4 className="font-medium text-red-800 mb-2">What we NEVER store:</h4>
                <ul className="text-sm text-red-700 space-y-1">
                  <li>• Video frames or screenshots</li>
                  <li>• Facial recognition data or embeddings</li>
                  <li>• Audio recordings</li>
                  <li>• Personal identifying information from camera</li>
                </ul>
              </div>

              <div className="flex space-x-3 pt-4 border-t">
                <button
                  onClick={exportAllData}
                  className="btn-secondary px-4 py-2 flex items-center space-x-2"
                >
                  <Download className="w-4 h-4" />
                  <span>Export My Data</span>
                </button>
                
                <button
                  onClick={() => setShowDeleteConfirm(true)}
                  className="bg-red-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-red-700 transition-colors flex items-center space-x-2"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Delete All Data</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Delete Confirmation Modal */}
        {showDeleteConfirm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-md w-full p-6">
              <div className="flex items-center text-red-600 mb-4">
                <AlertTriangle className="w-6 h-6 mr-2" />
                <h3 className="text-lg font-semibold">Delete All Data</h3>
              </div>
              <p className="text-gray-700 mb-6">
                This will permanently delete all your study sessions, settings, and data. 
                This action cannot be undone.
              </p>
              <div className="flex space-x-3">
                <button
                  onClick={deleteAllData}
                  className="flex-1 bg-red-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-red-700 transition-colors"
                >
                  Delete Everything
                </button>
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="flex-1 btn-secondary px-4 py-2"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};