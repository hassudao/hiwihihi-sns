"use client";
import Sidebar from "@/components/Sidebar";

export default function MainLayout({ children }) {
  return (
    /* 全体の背景をダーク対応 */
    <div className="flex min-h-screen max-w-7xl mx-auto bg-white dark:bg-black transition-colors">
      
      {/* 左側：サイドバー */}
      <header>
        <Sidebar />
      </header>

      {/* 中央：メインコンテンツ */}
      {/* 修正ポイント：border-gray-200 dark:border-gray-800 */}
      <main className="flex-grow border-r border-gray-200 dark:border-gray-800 ml-20 md:ml-64">
        {children}
      </main>

      {/* 右側：おすすめユーザーやトレンド */}
      <aside className="hidden lg:block w-80 p-4">
        {/* 修正ポイント：bg-gray-50 dark:bg-gray-900 / dark:text-white */}
        <div className="bg-gray-50 dark:bg-gray-900 rounded-2xl p-4 border border-transparent dark:border-gray-800">
          <h2 className="font-bold text-xl mb-4 dark:text-white">おすすめ</h2>
          <p className="text-gray-500 dark:text-gray-400 text-sm">
            （ここにトレンドなどを表示）
          </p>
        </div>
      </aside>
    </div>
  );
}