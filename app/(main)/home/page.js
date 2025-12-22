"use client";

import PostForm from "@/components/PostForm";
import PostList from "@/components/PostList";

export default function HomePage() {
  return (
    <div className="min-h-screen transition-all">
      {/* PC版のみホーム見出しを表示 */}
      <div className="hidden sm:block sticky top-0 bg-white/80 dark:bg-black/80 backdrop-blur-md p-4 border-b border-gray-200 dark:border-gray-800 z-10">
        <h1 className="text-xl font-bold dark:text-white">ホーム</h1>
      </div>
      
      <PostForm />
      <PostList />
    </div>
  );
}