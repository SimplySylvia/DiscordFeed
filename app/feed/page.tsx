'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState, useRef } from 'react';
import { signOut } from 'next-auth/react';
import Image from 'next/image';

interface ServerWithChannels {
  id: string;
  name: string;
  icon: string | null;
  channels: Channel[];
}

interface Channel {
  id: string;
  name: string;
  type: number;
  unreadCount?: number;
}

export default function FeedPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [isLoading, setIsLoading] = useState(true);
  const [servers, setServers] = useState<ServerWithChannels[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [indexing, setIndexing] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const avatarDropdownRef = useRef<HTMLDivElement>(null);
  const dropdownMenuRef = useRef<HTMLDivElement>(null);
  const GRACE_BUFFER = 24; // px, adjust as needed

  // If not authenticated, redirect to login
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  // Fetch data when session is available
  useEffect(() => {
    if (status === 'authenticated') {
      fetchServersAndChannels();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

  // Helper to check if mouse is inside grace area
  function isInGraceArea(mouseX: number, mouseY: number) {
    if (!avatarDropdownRef.current || !dropdownMenuRef.current) return false;
    const avatarRect = avatarDropdownRef.current.getBoundingClientRect();
    const dropdownRect = dropdownMenuRef.current.getBoundingClientRect();
    // Calculate the union rectangle
    const left = Math.min(avatarRect.left, dropdownRect.left) - GRACE_BUFFER;
    const right = Math.max(avatarRect.right, dropdownRect.right) + GRACE_BUFFER;
    const top = Math.min(avatarRect.top, dropdownRect.top) - GRACE_BUFFER;
    const bottom = Math.max(avatarRect.bottom, dropdownRect.bottom) + GRACE_BUFFER;
    return mouseX >= left && mouseX <= right && mouseY >= top && mouseY <= bottom;
  }

  // Close dropdown on outside click
  useEffect(() => {
    if (!dropdownOpen) return;
    function handleClickOutside(event: MouseEvent) {
      if (
        avatarDropdownRef.current &&
        !avatarDropdownRef.current.contains(event.target as Node) &&
        dropdownMenuRef.current &&
        !dropdownMenuRef.current.contains(event.target as Node)
      ) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [dropdownOpen]);

  // Grace area mouse move logic
  useEffect(() => {
    if (!dropdownOpen) return;
    let timeoutId: NodeJS.Timeout | null = null;
    function handleMouseMove(e: MouseEvent) {
      if (isInGraceArea(e.clientX, e.clientY)) {
        if (timeoutId) {
          clearTimeout(timeoutId);
          timeoutId = null;
        }
      } else {
        // Add a small delay before closing to allow for fast mouse movement
        if (!timeoutId) {
          timeoutId = setTimeout(() => {
            setDropdownOpen(false);
          }, 80);
        }
      }
    }
    document.addEventListener('mousemove', handleMouseMove);
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [dropdownOpen]);

  // Fetch servers and channels
  const fetchServersAndChannels = async () => {
    try {
      setIsLoading(true);

      // First check if indexing has been done
      const indexingStatus = await fetch('/api/indexing');
      const indexingData = await indexingStatus.json();

      // If no data exists, trigger indexing
      if (indexingData?.needsIndexing) {
        setIndexing(true);
        await triggerIndexing();
      }

      // Fetch servers and channels from our database
      const response = await fetch('/api/servers');

      if (!response.ok) {
        throw new Error('Failed to fetch servers and channels');
      }

      const data = await response.json();

      // Transform the data into the format we need
      const serversWithChannels: ServerWithChannels[] = data.servers.map((server: any) => ({
        id: server.id,
        name: server.name,
        icon: server.icon,
        channels: server.channels.map((channel: any) => ({
          id: channel.id,
          name: channel.name,
          type: channel.type,
          unreadCount: channel.unreadCount || 0,
        })),
      }));

      setServers(serversWithChannels.length > 0 ? serversWithChannels : getMockData());
      setIndexing(false);
      setIsLoading(false);
    } catch (err) {
      console.error('Error fetching data:', err);
      setError('Failed to load data. Please try again later.');
      setServers(getMockData()); // Fallback to mock data
      setIndexing(false);
      setIsLoading(false);
    }
  };

  // Trigger Discord indexing
  const triggerIndexing = async () => {
    try {
      const response = await fetch('/api/indexing', {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error('Failed to trigger indexing');
      }

      const body = await response.json();
      console.log(body);

      // We'll use mock data until real data is indexed
      return getMockData();
    } catch (error) {
      console.error('Error triggering indexing:', error);
      return getMockData();
    }
  };

  // Mock data as fallback
  const getMockData = (): ServerWithChannels[] => {
    return [
      {
        id: '1',
        name: 'Discord Server 1',
        icon: null,
        channels: [
          { id: '101', name: 'general', type: 0, unreadCount: 5 },
          { id: '102', name: 'random', type: 0, unreadCount: 2 },
        ],
      },
      {
        id: '2',
        name: 'Discord Server 2',
        icon: null,
        channels: [
          { id: '201', name: 'general', type: 0, unreadCount: 0 },
          { id: '202', name: 'announcements', type: 0, unreadCount: 3 },
        ],
      },
    ];
  };

  // Render loading state
  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  // Render error state
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md w-full p-6 bg-white rounded-lg shadow-md">
          <div className="text-red-500 text-center mb-4">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-10 w-10 mx-auto"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-center text-gray-800 mb-2">
            Error Loading Feed
          </h2>
          <p className="text-gray-600 text-center">{error}</p>
          <div className="mt-6 text-center">
            <button
              onClick={() => fetchServersAndChannels()}
              className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Check if session is still loading
  if (!session) {
    return (
      <div className="flex flex-col justify-center items-center min-h-screen bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#5865F2]"></div>
        <p className="mt-4 text-gray-600">Connecting to Discord...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8 flex justify-between items-center">
          <h1 className="text-xl font-semibold text-gray-900">DiscordFeed</h1>

          <nav className="relative">
            {session?.user?.image && (
              <div
                ref={avatarDropdownRef}
                className="relative"
                onMouseEnter={() => setDropdownOpen(true)}
                onMouseLeave={() => {}} // No-op, handled by grace area
              >
                <Image
                  src={session.user.image}
                  alt="User avatar"
                  width={32}
                  height={32}
                  className="rounded-full cursor-pointer border-2 border-transparent hover:border-green-500"
                  onClick={() => setDropdownOpen((open) => !open)}
                  tabIndex={0}
                  onFocus={() => setDropdownOpen(true)}
                />
                {dropdownOpen && (
                  <div
                    ref={dropdownMenuRef}
                    className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50"
                  >
                    <a
                      href="/settings"
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      Settings
                    </a>
                    <button
                      onClick={() => signOut({ callbackUrl: '/login' })}
                      className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      Sign Out
                    </button>
                  </div>
                )}
              </div>
            )}
          </nav>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
        {indexing && (
          <div className="mb-4 p-3 bg-blue-100 text-blue-800 rounded-md flex items-center">
            <svg className="animate-spin h-5 w-5 mr-2" viewBox="0 0 24 24">
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              ></circle>
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              ></path>
            </svg>
            Indexing your Discord servers and channels in the background...
          </div>
        )}

        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Your Discord Feed</h2>
          <p className="text-gray-600">
            {servers.length === 0
              ? 'No servers found. Please make sure you have connected your Discord account properly.'
              : 'View your Discord servers and channels below. Unread message counts shown where available.'}
          </p>
        </div>

        <div className="space-y-6" data-testid="feed-list">
          {servers.map((server) => (
            <div key={server.id} className="bg-white shadow rounded-lg overflow-hidden">
              <div className="p-4 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">{server.name}</h3>
              </div>

              <div className="divide-y divide-gray-200">
                {server.channels.map((channel) => (
                  <div
                    key={channel.id}
                    className="p-4 flex justify-between items-center hover:bg-gray-50"
                    data-testid="feed-message"
                  >
                    <div>
                      <span className="text-gray-800">#{channel.name}</span>
                    </div>
                    {channel.unreadCount && channel.unreadCount > 0 ? (
                      <span
                        className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                        data-testid="feed-message-unread"
                      >
                        {channel.unreadCount} unread
                      </span>
                    ) : (
                      <span className="text-sm text-gray-500">No unread messages</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
