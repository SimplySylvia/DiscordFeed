'use client';

import { useSession } from 'next-auth/react';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

// Extend the Session type to include the user ID
interface ExtendedUser {
  id?: string;
  name?: string | null;
  email?: string | null;
  image?: string | null;
}

interface UserPreference {
  id: string;
  userId: string;
  refreshInterval: number;
  showUnreadOnly: boolean;
  notificationsEnabled: boolean;
  theme: string;
  createdAt: string;
  updatedAt: string;
}

export default function SettingsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [preferences, setPreferences] = useState({
    refreshInterval: 300,
    showUnreadOnly: true,
    notificationsEnabled: true,
    theme: 'system',
  });

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<'success' | 'error'>('success');

  // If not authenticated, redirect to login
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  // Fetch user preferences when session is available
  useEffect(() => {
    if (status === 'authenticated' && (session?.user as ExtendedUser)?.id) {
      fetchUserPreferences();
    }
  }, [status, session]);

  // Fetch user preferences from API
  const fetchUserPreferences = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/preferences');

      if (!response.ok) {
        throw new Error('Failed to fetch preferences');
      }

      const data = await response.json();

      if (data.preferences) {
        setPreferences({
          refreshInterval: data.preferences.refreshInterval,
          showUnreadOnly: data.preferences.showUnreadOnly,
          notificationsEnabled: data.preferences.notificationsEnabled,
          theme: data.preferences.theme,
        });
      }

      setIsLoading(false);
    } catch (error) {
      console.error('Error fetching preferences:', error);
      setIsLoading(false);
      setMessage('Failed to fetch preferences');
      setMessageType('error');

      // Clear error message after 3 seconds
      setTimeout(() => {
        setMessage('');
      }, 3000);
    }
  };

  // Save user preferences
  const savePreferences = async () => {
    try {
      setIsSaving(true);
      const response = await fetch('/api/preferences', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(preferences),
      });

      if (!response.ok) {
        throw new Error('Failed to save preferences');
      }

      setMessage('Preferences saved successfully');
      setMessageType('success');
      setIsSaving(false);

      // Clear success message after 3 seconds
      setTimeout(() => {
        setMessage('');
      }, 3000);
    } catch (error) {
      console.error('Error saving preferences:', error);
      setMessage('Failed to save preferences');
      setMessageType('error');
      setIsSaving(false);

      // Clear error message after 3 seconds
      setTimeout(() => {
        setMessage('');
      }, 3000);
    }
  };

  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    savePreferences();
  };

  // Update preference state when form fields change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target as HTMLInputElement;

    setPreferences({
      ...preferences,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value,
    });
  };

  if (status === 'loading' || isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-md mx-auto bg-white shadow-md rounded-lg p-6">
        <h1 className="text-2xl font-bold mb-6" data-testid="settings-heading">
          User Preferences
        </h1>

        {message && (
          <div
            className={`mb-4 p-2 rounded ${
              messageType === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
            }`}
          >
            {message}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-gray-700 mb-2" htmlFor="refreshInterval">
              Refresh Interval (seconds)
            </label>
            <input
              type="number"
              id="refreshInterval"
              name="refreshInterval"
              min="60"
              max="3600"
              value={preferences.refreshInterval}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="mb-4">
            <label className="flex items-center">
              <input
                type="checkbox"
                name="showUnreadOnly"
                checked={preferences.showUnreadOnly}
                onChange={handleInputChange}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <span className="ml-2 text-gray-700">Show unread messages only</span>
            </label>
          </div>

          <div className="mb-4">
            <label className="flex items-center">
              <input
                type="checkbox"
                name="notificationsEnabled"
                checked={preferences.notificationsEnabled}
                onChange={handleInputChange}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                data-testid="notifications-checkbox"
              />
              <span className="ml-2 text-gray-700">Enable notifications</span>
            </label>
          </div>

          <div className="mb-6">
            <label className="block text-gray-700 mb-2" htmlFor="theme">
              Theme
            </label>
            <select
              id="theme"
              name="theme"
              value={preferences.theme}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              data-testid="theme-select"
            >
              <option value="system">System Default</option>
              <option value="light">Light</option>
              <option value="dark">Dark</option>
            </select>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={isSaving}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
            >
              {isSaving ? 'Saving...' : 'Save Preferences'}
            </button>
          </div>
        </form>

        <div className="mt-8 pt-6 border-t border-gray-200">
          <h2 className="text-lg font-semibold mb-4">Discord Integration</h2>
          <button
            onClick={() => {
              fetch('/api/indexing', { method: 'POST' })
                .then((response) => {
                  if (response.ok) {
                    setMessage('Reindexing started in background');
                    setMessageType('success');
                  } else {
                    setMessage('Failed to start reindexing');
                    setMessageType('error');
                  }
                  setTimeout(() => setMessage(''), 3000);
                })
                .catch((error) => {
                  console.error('Error triggering reindexing:', error);
                  setMessage('Failed to start reindexing');
                  setMessageType('error');
                  setTimeout(() => setMessage(''), 3000);
                });
            }}
            className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
          >
            Re-index Discord Channels
          </button>
        </div>
      </div>
    </div>
  );
}
