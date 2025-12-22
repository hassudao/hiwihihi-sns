"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Home, Search, Bell, Mail, User, Settings, LogOut } from "lucide-react";
import { auth, db } from "@/lib/firebase";
import { signOut, onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { useRouter } from "next/navigation";

export default function Sidebar() {
  const router = useRouter();
  const [me, setMe] = useState(null);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (user) {
        const snap = await getDoc(doc(db, "users", user.uid));
        if (snap.exists()) {
          setMe(snap.data());
        }
      }
    });
    return () => unsub();
  }, []);

  const handleLogout = async () => {
    if (confirm("ログアウトしますか？")) {
      await signOut(auth);
      router.push("/login");
    }
  };

  return (
    <nav className="
      /* スマホ：画面下部に固定 */
      fixed bottom-0 left-0 right-0 h-16 bg-white dark:bg-black border-t border-gray-200 dark:border-gray-800 z-50 flex flex-row justify-around items-center px-2
      /* PC・タブレット：左側に固定 */
      sm:relative sm:flex-col sm:justify-between sm:h-screen sm:p-4 sm:border-r sm:border-t-0 sm:w-20 md:w-64 sm:sticky sm:top-0
      transition-colors
    ">
      {/* 上部メニューグループ */}
      <div className="flex flex-row sm:flex-col gap-1 sm:gap-2 w-full sm:w-auto justify-around sm:justify-start items-center sm:items-stretch">
        {/* ロゴ：スマホでは非表示 */}
        <div className="p-2 mb-4 hidden sm:block">
          <Link href="/home" className="inline-block hover:opacity-80 transition text-center lg:text-left">
            <img 
              src="/logo.png" 
              alt="Logo" 
              className="w-40 md:w-60 h-auto object-contain mx-auto lg:mx-0" 
            />
          </Link>
        </div>
        
        {/* 主要ナビゲーション：スマホではアイコンのみ */}
        <SidebarItem icon={<Home />} label="ホーム" href="/home" />
        <SidebarItem icon={<Search />} label="検索" href="/search" />
        <SidebarItem icon={<Bell />} label="通知" href="/notifications" />
        <SidebarItem icon={<Mail />} label="DM" href="/messages" />
        
        {/* プロフィール・設定：スマホでは非表示（右上のメニュー等に逃がすのが一般的ですが、まずは非表示化） */}
        <div className="hidden sm:block">
          <SidebarItem icon={<User />} label="プロフィール" href="/profile/me" />
          <SidebarItem icon={<Settings />} label="設定" href="/settings" />
        </div>
      </div>

      {/* 下部（ユーザー情報・ログアウト）：スマホでは非表示 */}
      <div className="hidden sm:flex flex-col gap-2">
        {me && (
          <div className="flex items-center gap-3 p-3 rounded-full hidden md:flex">
            <img 
              src={me.photoURL || "https://abs.twimg.com/sticky/default_profile_images/default_profile_400x400.png"} 
              className="w-10 h-10 rounded-full object-cover border dark:border-gray-700"
              alt="my icon"
            />
            <div className="flex flex-col overflow-hidden">
              <span className="font-bold text-sm truncate dark:text-white">{me.username}</span>
              <span className="text-gray-500 text-xs truncate">@{me.email?.split('@')[0]}</span>
            </div>
          </div>
        )}

        <button 
          onClick={handleLogout}
          className="flex items-center gap-4 p-3 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-full text-red-500 transition w-full"
        >
          <LogOut />
          <span className="hidden md:inline font-bold">ログアウト</span>
        </button>
      </div>
    </nav>
  );
}

function SidebarItem({ icon, label, href }) {
  return (
    <Link 
      href={href} 
      className="flex items-center justify-center sm:justify-start gap-4 p-3 hover:bg-gray-100 dark:hover:bg-gray-900 rounded-full transition text-gray-800 dark:text-gray-200 group"
    >
      <span className="dark:text-white group-hover:scale-110 transition-transform">{icon}</span>
      <span className="hidden md:inline text-lg">{label}</span>
    </Link>
  );
}