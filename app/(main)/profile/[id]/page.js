"use client";

import { useState } from "react";
import { db } from "@/lib/firebase";
import { doc, updateDoc } from "firebase/firestore";
import { X, Loader2 } from "lucide-react";

export default function EditProfileModal({ userProfile, onClose }) {
  const [username, setUsername] = useState(userProfile.username || "");
  const [bio, setBio] = useState(userProfile.bio || "");
  const [loading, setLoading] = useState(false);

  const handleUpdate = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const userRef = doc(db, "users", userProfile.id);
      await updateDoc(userRef, {
        username,
        bio,
      });
      onClose();
      window.location.reload(); // 情報を反映させるためにリロード
    } catch (error) {
      console.error(error);
      alert("更新に失敗しました");
    } finally {
      setLoading(false);
    }
  };

  return (
    /* モーダル背景（オーバーレイ） */
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
      
      {/* モーダル本体：bg-white dark:bg-black */}
      <div className="bg-white dark:bg-black w-full max-w-lg rounded-2xl overflow-hidden border dark:border-gray-800 shadow-xl">
        
        {/* ヘッダー部分 */}
        <div className="flex items-center justify-between p-4 border-b dark:border-gray-800">
          <div className="flex items-center gap-4">
            <button 
              onClick={onClose} 
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-900 rounded-full transition dark:text-white"
            >
              <X size={20} />
            </button>
            <h2 className="text-xl font-bold dark:text-white">プロフィールを編集</h2>
          </div>
          <button
            onClick={handleUpdate}
            disabled={loading}
            className="bg-black dark:bg-white text-white dark:text-black px-4 py-1.5 rounded-full font-bold hover:opacity-80 disabled:opacity-50 transition"
          >
            {loading ? <Loader2 className="animate-spin" size={20} /> : "保存"}
          </button>
        </div>

        {/* フォーム部分 */}
        <form onSubmit={handleUpdate} className="p-4 flex flex-col gap-6">
          
          {/* 名前入力 */}
          <div className="relative border dark:border-gray-700 rounded-md p-2 focus-within:border-blue-500 transition">
            <label className="block text-xs text-gray-500">名前</label>
            <input
              type="text"
              className="w-full bg-transparent outline-none text-lg dark:text-white"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </div>

          {/* 自己紹介入力 */}
          <div className="relative border dark:border-gray-700 rounded-md p-2 focus-within:border-blue-500 transition">
            <label className="block text-xs text-gray-500">自己紹介</label>
            <textarea
              className="w-full bg-transparent outline-none text-lg dark:text-white resize-none"
              rows="4"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
            />
          </div>

        </form>
      </div>
    </div>
  );
}