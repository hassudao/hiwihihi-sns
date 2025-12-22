"use client";

import { auth } from "@/lib/firebase";
import { signOut } from "firebase/auth";
import { useRouter } from "next/navigation";
import { LogOut, User, Mail, ShieldCheck, ChevronRight } from "lucide-react";

export default function SettingsPage() {
  const router = useRouter();
  const user = auth.currentUser;

  const handleLogout = async () => {
    if (confirm("ログアウトしますか？")) {
      await signOut(auth);
      router.push("/login"); // ログイン画面へ戻る
    }
  };

  return (
    <div className="max-w-2xl border-x border-gray-100 min-h-screen bg-white">
      <h1 className="text-xl font-bold p-4 border-b sticky top-0 bg-white/80 backdrop-blur-md z-10">設定</h1>

      <div className="flex flex-col">
        {/* アカウント情報セクション */}
        <div className="p-4 bg-gray-50 text-xs font-bold text-gray-500 uppercase tracking-wider">
          アカウント情報
        </div>
        
        <div className="flex items-center gap-4 p-4 border-b">
          <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center text-blue-500">
            <User size={24} />
          </div>
          <div className="flex flex-col">
            <span className="font-bold text-gray-900">{user?.displayName || "ユーザー名未設定"}</span>
            <span className="text-sm text-gray-500">{user?.email}</span>
          </div>
        </div>

        <div className="p-4 border-b flex items-center justify-between hover:bg-gray-50 transition cursor-not-allowed text-gray-400">
          <div className="flex items-center gap-3">
            <Mail size={20} />
            <span>メールアドレスの変更</span>
          </div>
          <ChevronRight size={18} />
        </div>

        {/* セキュリティセクション */}
        <div className="p-4 bg-gray-50 text-xs font-bold text-gray-500 uppercase tracking-wider">
          セキュリティ
        </div>
        
        <div className="p-4 border-b flex items-center justify-between hover:bg-gray-50 transition cursor-not-allowed text-gray-400">
          <div className="flex items-center gap-3">
            <ShieldCheck size={20} />
            <span>パスワードの再設定</span>
          </div>
          <ChevronRight size={18} />
        </div>

        {/* アクションセクション */}
        <div className="mt-8 px-4">
          <button 
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 p-4 text-red-500 font-bold border border-red-100 rounded-2xl hover:bg-red-50 transition"
          >
            <LogOut size={20} />
            ログアウト
          </button>
        </div>

        <p className="text-center text-gray-400 text-xs mt-8">
          X-Clone Version 1.0.0
        </p>
      </div>
    </div>
  );
}