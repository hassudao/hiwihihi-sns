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

  // ログイン中のユーザー情報を取得
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
    await signOut(auth);
    router.push("/login");
  };

  return (
    <div className="flex flex-col justify-between h-screen p-4 border-r border-gray-200 w-20 md:w-64 fixed bg-white">
      <div className="flex flex-col gap-2">
        {/* ロゴ部分：テキストから画像へ差し替え */}
        <div className="p-2 mb-4">
          <Link href="/home" className="inline-block hover:opacity-80 transition">
            <img 
              src="/logo.png" 
              alt="Logo" 
              className="w-16 h-10 object-contain" 
            />
          </Link>
        </div>
        
        <SidebarItem icon={<Home />} label="ホーム" href="/home" />
        <SidebarItem icon={<Search />} label="話題を検索" href="/search" />
        <SidebarItem icon={<Bell />} label="通知" href="/notifications" />
        <SidebarItem icon={<Mail />} label="メッセージ" href="/messages" />
        <SidebarItem icon={<User />} label="プロフィール" href="/profile/me" />
        <SidebarItem icon={<Settings />} label="設定" href="/settings" />
      </div>

      <div className="flex flex-col gap-2">
        {/* ユーザー簡易プロフ（追加） */}
        {me && (
          <div className="flex items-center gap-3 p-3 rounded-full hidden md:flex">
            <img 
              src={me.photoURL || "https://abs.twimg.com/sticky/default_profile_images/default_profile_400x400.png"} 
              className="w-10 h-10 rounded-full object-cover border"
              alt="my icon"
            />
            <div className="flex flex-col overflow-hidden">
              <span className="font-bold text-sm truncate">{me.username}</span>
              <span className="text-gray-500 text-xs truncate">@{me.email?.split('@')[0]}</span>
            </div>
          </div>
        )}

        {/* ログアウトボタン */}
        <button 
          onClick={handleLogout}
          className="flex items-center gap-4 p-3 hover:bg-red-50 rounded-full text-red-500 transition w-full"
        >
          <LogOut />
          <span className="hidden md:inline font-bold">ログアウト</span>
        </button>
      </div>
    </div>
  );
}

function SidebarItem({ icon, label, href }) {
  return (
    <Link href={href} className="flex items-center gap-4 p-3 hover:bg-gray-100 rounded-full transition text-xl text-gray-800">
      {icon}
      <span className="hidden md:inline">{label}</span>
    </Link>
  );
}