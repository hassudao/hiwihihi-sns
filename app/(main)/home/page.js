"use client";

import PostForm from "@/components/PostForm";
import PostList from "@/components/PostList";

export default function HomePage() {
  return (
    // ml-0 (スマホ) / sm:ml-20 (タブレット) / md:ml-64 (PC)
    // pt-14 (スマホのトップヘッダー分) / pb-16 (スマホのボトムナビ分)
    <div className="min-h-screen ml-0 sm:ml-20 md:ml-64 pt-14 sm:pt-0 pb-16 sm:pb-0 transition-all">
      
      {/* スマホでは上のロゴヘッダーと重複するので、PCのみ「ホーム」を表示、またはスマホでは非表示にする */}
      <div className="hidden sm:block sticky top-0 bg-white/80 dark:bg-black/80 backdrop-blur-md p-4 border-b border-gray-200 dark:border-gray-800 z-10">
        <h1 className="text-xl font-bold dark:text-white">ホーム</h1>
      </div>
      
      <PostForm />
      <PostList />
    </div>
  );
}