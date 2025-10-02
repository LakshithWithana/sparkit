"use client";

import dynamic from 'next/dynamic';

// Dynamically import with SSR disabled to prevent hydration mismatch
const HomePageClient = dynamic(() => import('./HomePageClient'), {
  ssr: false,
  loading: () => (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
  ),
});

export default function HomePage() {
  return <HomePageClient />;
}