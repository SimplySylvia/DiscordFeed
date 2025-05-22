import Link from 'next/link';

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <h1 className="text-4xl font-bold mb-8">Discord Feed</h1>
      <p className="text-lg text-center max-w-2xl mb-8">
        A unified feed interface for Discord that aggregates unread messages across all your servers
        into a single, organized view.
      </p>

      <Link
        href="/login"
        className="px-6 py-3 bg-[#5865F2] text-white rounded-md hover:bg-[#4752c4] focus:outline-none focus:ring-2 focus:ring-[#5865F2] focus:ring-offset-2"
        data-testid="get-started"
      >
        Get Started
      </Link>
    </main>
  );
}
