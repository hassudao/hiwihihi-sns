"use client";

import { useEffect, useState } from "react";
import { auth, db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";
import { signOut, sendPasswordResetEmail } from "firebase/auth";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes"; // 追加
import { 
  LogOut, User, Mail, ShieldCheck, ChevronRight, 
  Loader2, Sun, Moon, Monitor 
} from "lucide-react"; // アイコン追加

export default function SettingsPage() {
  const router = useRouter();
  const { theme, setTheme } = useTheme(); // テーマ操作用
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false); // ハイドレーション対策

  // 1. 初回マウント確認 & データ取得
  useEffect(() => {
    setMounted(true); // マウント完了
    const fetchUserData = async () => {
      const user = auth.currentUser;
      if (user) {
        const userDoc = await getDoc(doc(db, "users", user.uid));
        if (userDoc.exists()) {
          setUserData(userDoc.data());
        }
      }
      setLoading(false);
    };
    fetchUserData();
  }, []);

  // ログアウト処理
  const handleLogout = async () => {
    if (confirm("ログアウトしますか？")) {
      await signOut(auth);
      router.push("/login");
    }
  };

  // パスワード再設定
  const handleResetPassword = async () => {
    const email = auth.currentUser?.email;
    if (!email) return;
    try {
      await sendPasswordResetEmail(auth, email);
      alert("パスワード再設定用のメールを送信しました！");
    } catch (error) {
      console.error("Reset error:", error);
      alert("メールの送信に失敗しました。");
    }
  };

  // マウントされる前は何も表示しない（テーマの不整合を防ぐため）
  if (!mounted || loading) return (
    <div className="flex justify-center p-10">
      <Loader2 className="animate-spin text-blue-500" />
    </div>
  );

  return (
    <div className="max-w-2xl border-x border-gray-100 dark:border-gray-800 min-h-screen bg-white dark:bg-black transition-colors">
      <h1 className="text-xl font-bold p-4 border-b dark:border-gray-800 sticky top-0 bg-white/80 dark:bg-black/80 backdrop-blur-md z-10 dark:text-white">
        設定
      </h1>

      <div className="flex flex-col">
        {/* --- 表示設定セクション --- */}
        <div className="p-4 bg-gray-50 dark:bg-gray-900 text-xs font-bold text-gray-500 uppercase tracking-wider">
          表示設定
        </div>
        
        <div className="p-4 border-b dark:border-gray-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Moon size={20} className="text-gray-400" />
            <span className="font-medium dark:text-gray-200">ダークモード</span>
          </div>
          
          {/* 切り替えスイッチ */}
          <div className="flex bg-gray-100 dark:bg-gray-800 p-1 rounded-full">
            <button 
              onClick={() => setTheme("light")}
              className={`p-2 rounded-full transition ${theme === "light" ? "bg-white text-blue-500 shadow-sm" : "text-gray-500"}`}
              title="ライトモード"
            >
              <Sun size={18} />
            </button>
            <button 
              onClick={() => setTheme("system")}
              className={`p-2 rounded-full transition ${theme === "system" ? "bg-white dark:bg-gray-700 text-blue-500 shadow-sm" : "text-gray-500"}`}
              title="システム設定"
            >
              <Monitor size={18} />
            </button>
            <button 
              onClick={() => setTheme("dark")}
              className={`p-2 rounded-full transition ${theme === "dark" ? "bg-gray-700 text-blue-400 shadow-sm" : "text-gray-500"}`}
              title="ダークモード"
            >
              <Moon size={18} />
            </button>
          </div>
        </div>

        {/* --- アカウント情報セクション --- */}
        <div className="p-4 bg-gray-50 dark:bg-gray-900 text-xs font-bold text-gray-500 uppercase tracking-wider">
          アカウント情報
        </div>
        
        <div className="flex items-center gap-4 p-4 border-b dark:border-gray-800">
          <img 
            src={userData?.photoURL || "https://abs.twimg.com/sticky/default_profile_images/default_profile_400x400.png"} 
            className="w-12 h-12 rounded-full object-cover bg-gray-200 dark:bg-gray-700"
            alt="User avatar"
          />
          <div className="flex flex-col">
            <span className="font-bold text-gray-900 dark:text-white">{userData?.username || "ユーザー"}</span>
            <span className="text-sm text-gray-500 dark:text-gray-400">{auth.currentUser?.email}</span>
          </div>
        </div>

        {/* --- セキュリティセクション --- */}
        <div className="p-4 bg-gray-50 dark:bg-gray-900 text-xs font-bold text-gray-500 uppercase tracking-wider">
          セキュリティ
        </div>
        
        <div 
          onClick={handleResetPassword}
          className="p-4 border-b dark:border-gray-800 flex items-center justify-between group cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-900 transition"
        >
          <div className="flex items-center gap-3">
            <ShieldCheck size={20} className="text-blue-500" />
            <span className="font-medium text-gray-700 dark:text-gray-200">パスワードを再設定する</span>
          </div>
          <ChevronRight size={18} className="text-gray-300 dark:text-gray-600" />
        </div>

        {/* --- アクションセクション --- */}
        <div className="mt-8 px-4 pb-10">
          <button 
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 p-4 text-red-500 font-bold border border-red-100 dark:border-red-900/30 rounded-2xl hover:bg-red-50 dark:hover:bg-red-950/20 transition"
          >
            <LogOut size={20} />
            ログアウト
          </button>
        </div>
      </div>
    </div>
  );
}