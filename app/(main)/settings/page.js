"use client";

import { useEffect, useState } from "react";
import { auth, db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";
import { signOut, sendPasswordResetEmail } from "firebase/auth"; // sendPasswordResetEmail を追加
import { useRouter } from "next/navigation";
import { LogOut, User, Mail, ShieldCheck, ChevronRight, Loader2 } from "lucide-react";

export default function SettingsPage() {
  const router = useRouter();
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUserData = async () => {
      const user = auth.currentUser;
      if (user) {
        // Firestoreからプロフィール情報を取得
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

  // ★追加：パスワード再設定メール送信処理
  const handleResetPassword = async () => {
    const email = auth.currentUser?.email;
    if (!email) return;

    try {
      await sendPasswordResetEmail(auth, email);
      alert("パスワード再設定用のメールを送信しました！メールボックスを確認してください。");
    } catch (error) {
      console.error("Reset error:", error);
      alert("メールの送信に失敗しました。しばらく時間を置いてから再度お試しください。");
    }
  };

  if (loading) return (
    <div className="flex justify-center p-10">
      <Loader2 className="animate-spin text-blue-500" />
    </div>
  );

  return (
    <div className="max-w-2xl border-x border-gray-100 min-h-screen bg-white">
      <h1 className="text-xl font-bold p-4 border-b sticky top-0 bg-white/80 backdrop-blur-md z-10">設定</h1>

      <div className="flex flex-col">
        {/* アカウント情報セクション */}
        <div className="p-4 bg-gray-50 text-xs font-bold text-gray-500 uppercase tracking-wider">
          アカウント情報
        </div>
        
        <div className="flex items-center gap-4 p-4 border-b">
          <img 
            src={userData?.photoURL || "https://abs.twimg.com/sticky/default_profile_images/default_profile_400x400.png"} 
            className="w-12 h-12 rounded-full object-cover bg-gray-200"
            alt="User avatar"
          />
          <div className="flex flex-col">
            <span className="font-bold text-gray-900">{userData?.username || "ユーザー"}</span>
            <span className="text-sm text-gray-500">{auth.currentUser?.email}</span>
          </div>
        </div>

        <div className="p-4 border-b flex items-center justify-between group cursor-default text-gray-400">
          <div className="flex items-center gap-3">
            <Mail size={20} />
            <span>メールアドレス（変更不可）</span>
          </div>
          <span className="text-xs">認証制限あり</span>
        </div>

        {/* セキュリティセクション */}
        <div className="p-4 bg-gray-50 text-xs font-bold text-gray-500 uppercase tracking-wider">
          セキュリティ
        </div>
        
        {/* ★修正：パスワード再設定を実行可能に */}
        <div 
          onClick={handleResetPassword}
          className="p-4 border-b flex items-center justify-between group cursor-pointer hover:bg-gray-50 transition"
        >
          <div className="flex items-center gap-3">
            <ShieldCheck size={20} className="text-blue-500" />
            <span className="font-medium text-gray-700">パスワードを再設定する</span>
          </div>
          <ChevronRight size={18} className="text-gray-300" />
        </div>

        {/* アクションセクション */}
        <div className="mt-8 px-4 pb-10">
          <button 
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 p-4 text-red-500 font-bold border border-red-100 rounded-2xl hover:bg-red-50 transition"
          >
            <LogOut size={20} />
            ログアウト
          </button>
        </div>
      </div>
    </div>
  );
}