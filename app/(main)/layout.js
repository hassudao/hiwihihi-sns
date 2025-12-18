"use client";
import Sidebar from "@/components/Sidebar";

export default function MainLayout({ children }) {
  return (
    <div className="flex min-h-screen max-w-7xl mx-auto">
      {/* 左側：サイドバー */}
      <header>
        <Sidebar />
      </header>

      {/* 中央：メインコンテンツ（ホーム、プロフィールなど） */}
      <main className="flex-grow border-r border-gray-200 ml-20 md:ml-64">
        {children}
      </main>

      {/* 右側：おすすめユーザーやトレンド（後で作成） */}
      <aside className="hidden lg:block w-80 p-4">
        <div className="bg-gray-50 rounded-2xl p-4">
          <h2 className="font-bold text-xl mb-4">おすすめ</h2>
          <p className="text-gray-500 text-sm">（ここにトレンドなどを表示）</p>
        </div>
      </aside>
    </div>
  );
}