"use client";

import { useEffect, useState } from "react";
import { auth, db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";
import { signOut } from "firebase/auth";
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

  const handleLogout = async () => {
    if (confirm("ログアウトしますか？")) {
      await signOut(auth);
      router.push("/login");
    }
  };

  if (loading) return <div className="flex justify-center p-10"><Loader2 className="animate-spin text-blue-500" /></div>;

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
          />
          <div className="flex flex-col">
            {/* これでProfile画面と同じ名前が表示されます */}
            <span className="font-bold text-gray-900">{userData?.username || "ユーザー"}</span>
            <span className="text-sm text-gray-500">{auth.currentUser?.email}</span>
          </div>
        </div>

        {/* 飛べない理由は href が設定されていないためです。
          もし変更画面を作りたい場合は、新しいページファイルを作って Link で繋ぎます。
        */}
        <div className="p-4 border-b flex items-center justify-between group cursor-pointer hover:bg-gray-50 transition">
          <div className="flex items-center gap-3">
            <Mail size={20} className="text-gray-400" />
            <span>メールアドレス（変更不可）</span>
          </div>
          <span className="text-xs text-gray-400">編集には認証が必要です</span>
        </div>

        {/* セキュリティセクション */}
        <div className="p-4 bg-gray-50 text-xs font-bold text-gray-500 uppercase tracking-wider">
          セキュリティ
        </div>
        
        <div className="p-4 border-b flex items-center justify-between group cursor-pointer hover:bg-gray-50 transition">
          <div className="flex items-center gap-3">
            <ShieldCheck size={20} className="text-gray-400" />
            <span>パスワード再設定（準備中）</span>
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