'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation'; // ✅ App Router 전용

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/main');
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-pink-50 to-purple-50">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-500 mx-auto mb-4"></div>
        <p className="text-gray-600 text-lg">돗하이로 이동중...</p>
      </div>
    </div>
  );
}
