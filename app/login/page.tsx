'use client';

import { signIn } from 'next-auth/react';
import { useState } from 'react';

export default function LoginPage() {
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async () => {
    setIsLoading(true);
    await signIn('discord', { callbackUrl: '/feed' });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="w-full max-w-md p-8 space-y-8 bg-white rounded-lg shadow-md">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">DiscordFeed</h1>
          <p className="text-gray-600 mb-8">A unified feed for all your Discord servers</p>
        </div>

        <button
          onClick={handleLogin}
          disabled={isLoading}
          className="w-full flex items-center justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-white bg-[#5865F2] hover:bg-[#4752c4] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#5865F2]"
          data-testid="login-discord"
          aria-label="Continue with Discord"
        >
          {isLoading ? (
            <div className="flex items-center">
              <svg
                className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
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
              Connecting...
            </div>
          ) : (
            <div className="flex items-center">
              <svg
                className="w-6 h-6 mr-2"
                viewBox="0 0 28 28"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M23.7539 4.45312C21.9181 3.58317 19.9648 2.93931 17.9262 2.55469C17.8913 2.54801 17.8564 2.56471 17.8394 2.59812C17.5907 3.04205 17.3144 3.61256 17.1182 4.0593C14.9223 3.70263 12.7376 3.70263 10.585 4.0593C10.3889 3.6014 10.1014 3.04205 9.85166 2.59812C9.83468 2.56582 9.79976 2.54912 9.76482 2.55469C7.72846 2.93819 5.77513 3.58206 3.93718 4.45312C3.9224 4.46091 3.90984 4.47314 3.90205 4.48851C0.571897 9.69873 -0.342203 14.7798 0.107542 19.8008C0.110431 19.8274 0.125264 19.8529 0.144986 19.8695C2.56446 21.6757 4.90379 22.7897 7.20349 23.5249C7.23843 23.536 7.27558 23.5249 7.29812 23.4961C7.84542 22.7385 8.33169 21.9406 8.748 21.1023C8.7701 21.0612 8.75088 21.0135 8.70928 20.9979C7.93541 20.6958 7.19719 20.3335 6.48659 19.9244C6.44054 19.8978 6.43609 19.8323 6.47769 19.8001C6.61158 19.7001 6.74547 19.5957 6.87267 19.4901C6.89744 19.469 6.93126 19.4646 6.95936 19.478C11.5434 21.6111 16.501 21.6111 21.0297 19.478C21.0578 19.4634 21.0916 19.4679 21.1175 19.489C21.2447 19.5946 21.3786 19.7001 21.5136 19.8001C21.5552 19.8323 21.5519 19.8978 21.5058 19.9244C20.7952 20.3402 20.057 20.6958 19.282 20.9968C19.2404 21.0124 19.2223 21.0612 19.2444 21.1023C19.6674 21.9394 20.1537 22.7374 20.6932 23.495C20.7146 23.5249 20.7529 23.536 20.7878 23.5249C23.0986 22.7897 25.4379 21.6757 27.8574 19.8695C27.8782 19.8529 27.8919 19.8285 27.8948 19.8019C28.4365 13.9549 27.0147 8.92105 23.8968 4.48962C23.8901 4.47314 23.8776 4.46091 23.8628 4.45312H23.7539ZM9.34982 16.7415C7.96584 16.7415 6.83149 15.4808 6.83149 13.9305C6.83149 12.3802 7.94439 11.1195 9.34982 11.1195C10.7663 11.1195 11.8896 12.3913 11.8681 13.9305C11.8681 15.4808 10.7552 16.7415 9.34982 16.7415ZM18.6636 16.7415C17.2796 16.7415 16.1452 15.4808 16.1452 13.9305C16.1452 12.3802 17.2581 11.1195 18.6636 11.1195C20.08 11.1195 21.2033 12.3913 21.1818 13.9305C21.1818 15.4808 20.08 16.7415 18.6636 16.7415Z"
                  fill="currentColor"
                />
              </svg>
              Continue with Discord
            </div>
          )}
        </button>

        <div className="mt-6 text-center text-sm text-gray-500">
          <p>By signing in, you agree to our Terms of Service and Privacy Policy.</p>
        </div>
      </div>
    </div>
  );
}
