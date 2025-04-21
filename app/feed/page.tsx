"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

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

  // If not authenticated, redirect to login
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  // Fetch data when session is available
  useEffect(() => {
    if (status === "authenticated") {
      fetchServersAndChannels();
    }
  }, [status]);

  // Placeholder function to fetch servers and channels
  const fetchServersAndChannels = async () => {
    try {
      setIsLoading(true);
      // In a real implementation, this would be an API call
      // For now, we'll simulate it with some placeholder data

      // Simulate API call delay
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Placeholder data
      const mockServers: ServerWithChannels[] = [
        {
          id: "1",
          name: "Discord Server 1",
          icon: null,
          channels: [
            { id: "101", name: "general", type: 0, unreadCount: 5 },
            { id: "102", name: "random", type: 0, unreadCount: 2 },
          ],
        },
        {
          id: "2",
          name: "Discord Server 2",
          icon: null,
          channels: [
            { id: "201", name: "general", type: 0, unreadCount: 0 },
            { id: "202", name: "announcements", type: 0, unreadCount: 3 },
          ],
        },
      ];

      setServers(mockServers);
      setIsLoading(false);
    } catch (err) {
      console.error("Error fetching data:", err);
      setError("Failed to load data. Please try again later.");
      setIsLoading(false);
    }
  };

  // Render loading state
  if (isLoading) {
    return (
      <div className='flex justify-center items-center min-h-screen bg-gray-50'>
        <div className='animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gray-900'></div>
      </div>
    );
  }

  // Render error state
  if (error) {
    return (
      <div className='min-h-screen bg-gray-50 flex items-center justify-center'>
        <div className='max-w-md w-full p-6 bg-white rounded-lg shadow-md'>
          <div className='text-red-500 text-center mb-4'>
            <svg
              xmlns='http://www.w3.org/2000/svg'
              className='h-10 w-10 mx-auto'
              fill='none'
              viewBox='0 0 24 24'
              stroke='currentColor'
            >
              <path
                strokeLinecap='round'
                strokeLinejoin='round'
                strokeWidth={2}
                d='M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z'
              />
            </svg>
          </div>
          <h2 className='text-xl font-semibold text-center text-gray-800 mb-2'>
            Error Loading Feed
          </h2>
          <p className='text-gray-600 text-center'>{error}</p>
          <div className='mt-6 text-center'>
            <button
              onClick={() => fetchServersAndChannels()}
              className='px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2'
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className='min-h-screen bg-gray-50'>
      <header className='bg-white shadow-sm'>
        <div className='max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8 flex justify-between items-center'>
          <h1 className='text-xl font-semibold text-gray-900'>DiscordFeed</h1>

          <nav className='flex space-x-4'>
            <a href='/settings' className='text-gray-500 hover:text-gray-700'>
              Settings
            </a>
            <button
              onClick={() => {
                // In a real implementation, this would sign out the user
                router.push("/login");
              }}
              className='text-gray-500 hover:text-gray-700'
            >
              Sign Out
            </button>
          </nav>
        </div>
      </header>

      <main className='max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8'>
        <div className='mb-8'>
          <h2 className='text-2xl font-bold text-gray-900 mb-4'>
            Your Discord Feed
          </h2>
          <p className='text-gray-600'>
            This is a placeholder for the full feed implementation coming in
            Phase 3. Currently displaying mock data.
          </p>
        </div>

        <div className='space-y-6'>
          {servers.map((server) => (
            <div
              key={server.id}
              className='bg-white shadow rounded-lg overflow-hidden'
            >
              <div className='p-4 border-b border-gray-200'>
                <h3 className='text-lg font-medium text-gray-900'>
                  {server.name}
                </h3>
              </div>

              <div className='divide-y divide-gray-200'>
                {server.channels.map((channel) => (
                  <div
                    key={channel.id}
                    className='p-4 flex justify-between items-center hover:bg-gray-50'
                  >
                    <div>
                      <span className='text-gray-800'>#{channel.name}</span>
                    </div>
                    {channel.unreadCount && channel.unreadCount > 0 ? (
                      <span className='inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800'>
                        {channel.unreadCount} unread
                      </span>
                    ) : (
                      <span className='text-sm text-gray-500'>
                        No unread messages
                      </span>
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
