"use client";

import PostForm from "@/components/PostForm";
import PostList from "@/components/PostList";

export default function HomePage() {
  return (
    <div className="min-h-screen">
      <div className="sticky top-0 bg-white/80 backdrop-blur-md p-4 border-b border-gray-200 z-10">
        <h1 className="text-xl font-bold">ホーム</h1>
      </div>
      
      <PostForm />
      <PostList />
    </div>
  );
}