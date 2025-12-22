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
        if (snap.exists()) setMe({ id: user.uid, ...snap.data() });
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
    <>
      {/* スマホ用トップヘッダー */}
      <div className="sm:hidden fixed top-0 left-0 right-0 h-14 bg-white/80 dark:bg-black/80 backdrop-blur-md border-b border-gray-100 dark:border-gray-800 z-50 flex items-center justify-between px-4">
        <Link href="/home">
          <img src="/logo.png" alt="Logo" className="h-8 object-contain" />
        </Link>
        <Link href="/settings" className="text-gray-700 dark:text-white p-2">
          <Settings size={24} />
        </Link>
      </div>

      {/* ナビゲーション本体 */}
      <nav className="
        /* スマホ：下に固定 */
        fixed bottom-0 left-0 right-0 h-16 bg-white dark:bg-black border-t border-gray-200 dark:border-gray-800 z-50
        /* PC：Stickyに変更してLayoutのFlexに従う */
        sm:sticky sm:top-0 sm:h-screen sm:w-20 md:w-64 sm:border-r sm:border-t-0
        flex flex-row sm:flex-col justify-around sm:justify-between sm:p-4 transition-colors
      ">
        <div className="flex flex-row sm:flex-col gap-1 sm:gap-2 w-full sm:w-auto justify-around sm:justify-start">
          <div className="p-2 mb-4 hidden sm:block">
            <Link href="/home" className="inline-block hover:opacity-80 transition">
              <img src="/logo.png" alt="Logo" className="w-40 md:w-52 h-auto object-contain" />
            </Link>
          </div>
          
          <SidebarItem icon={<Home />} label="ホーム" href="/home" />
          <SidebarItem icon={<Search />} label="検索" href="/search" />
          <SidebarItem icon={<Bell />} label="通知" href="/notifications" />
          <SidebarItem icon={<Mail />} label="メッセージ" href="/messages" />
          
          {/* スマホ版のみプロフィールを表示 */}
          <div className="sm:hidden">
            <SidebarItem icon={<User />} label="プロフ" href="/profile/me" />
          </div>
          
          {/* PC版のみプロフィールと設定を表示 */}
          <div className="hidden sm:block">
            <SidebarItem icon={<User />} label="プロフィール" href="/profile/me" />
            <SidebarItem icon={<Settings />} label="設定" href="/settings" />
          </div>
        </div>

        {/* PC用ログアウトエリア */}
        <div className="hidden sm:flex flex-col gap-2">
          {me && (
            <div className="hidden md:flex items-center gap-3 p-3">
              <img src={me.photoURL || "/default-avatar.png"} className="w-10 h-10 rounded-full object-cover border dark:border-gray-700" alt="" />
              <div className="flex flex-col overflow-hidden">
                <span className="font-bold text-sm truncate dark:text-white">{me.username}</span>
                <span className="text-gray-500 text-xs truncate">@{me.email?.split('@')[0]}</span>
              </div>
            </div>
          )}
          <button onClick={handleLogout} className="flex items-center gap-4 p-3 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-full text-red-500 transition w-full">
            <LogOut /><span className="hidden md:inline font-bold">ログアウト</span>
          </button>
        </div>
      </nav>
    </>
  );
}

function SidebarItem({ icon, label, href }) {
  return (
    <Link href={href} className="flex items-center justify-center sm:justify-start gap-4 p-3 hover:bg-gray-100 dark:hover:bg-gray-900 rounded-full transition text-gray-800 dark:text-gray-200 group">
      <span className="dark:text-white group-hover:scale-110 transition-transform">{icon}</span>
      <span className="hidden md:inline text-lg">{label}</span>
    </Link>
  );
}