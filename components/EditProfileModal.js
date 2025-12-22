"use client";

import { useState } from "react";
import { db, auth } from "@/lib/firebase";
import { doc, updateDoc } from "firebase/firestore";
import { X, Camera, Loader2 } from "lucide-react";

export default function EditProfileModal({ userProfile, onClose }) {
  const [username, setUsername] = useState(userProfile.username);
  const [bio, setBio] = useState(userProfile.bio || "");
  const [image, setImage] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSave = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      let photoURL = userProfile.photoURL;

      if (image) {
        const formData = new FormData();
        formData.append("file", image);
        formData.append("upload_preset", process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET);

        const res = await fetch(
          `https://api.cloudinary.com/v1_1/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload`,
          { method: "POST", body: formData }
        );
        const data = await res.json();
        photoURL = data.secure_url;
      }

      await updateDoc(doc(db, "users", auth.currentUser.uid), {
        username: username,
        bio: bio,
        photoURL: photoURL,
      });

      onClose(); 
      window.location.reload(); 
    } catch (error) {
      console.error(error);
      alert("更新に失敗しました");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      {/* 修正：bg-white dark:bg-black / dark:border-gray-800 */}
      <div className="bg-white dark:bg-black w-full max-w-lg rounded-2xl overflow-hidden border dark:border-gray-800 shadow-2xl">
        
        {/* ヘッダー */}
        <div className="flex items-center justify-between p-4 border-b dark:border-gray-800">
          <div className="flex items-center gap-4">
            {/* 修正：dark:text-white dark:hover:bg-gray-900 */}
            <button onClick={onClose} className="hover:bg-gray-100 dark:hover:bg-gray-900 p-2 rounded-full dark:text-white transition">
              <X size={20} />
            </button>
            <h2 className="text-xl font-bold dark:text-white">プロフィールを編集</h2>
          </div>
          {/* 修正：ダークモードではボタンを白にする（X風） */}
          <button 
            onClick={handleSave}
            disabled={loading}
            className="bg-black dark:bg-white text-white dark:text-black px-4 py-1.5 rounded-full font-bold hover:opacity-90 disabled:opacity-50 transition"
          >
            {loading ? <Loader2 className="animate-spin" size={18} /> : "保存"}
          </button>
        </div>

        {/* 編集フォーム */}
        <div className="p-4 flex flex-col gap-6">
          {/* アイコン選択 */}
          <div className="relative w-32 h-32 self-center group">
            <img 
              src={image ? URL.createObjectURL(image) : (userProfile.photoURL || "https://abs.twimg.com/sticky/default_profile_images/default_profile_400x400.png")} 
              className="w-full h-full rounded-full object-cover brightness-75 group-hover:brightness-50 transition"
            />
            <label className="absolute inset-0 flex items-center justify-center cursor-pointer text-white drop-shadow-md">
              <Camera size={30} />
              <input type="file" className="hidden" accept="image/*" onChange={(e) => setImage(e.target.files[0])} />
            </label>
          </div>

          <div className="flex flex-col gap-4">
            {/* 修正：input/textarea の背景と文字色をダーク対応 */}
            <div className="flex flex-col gap-1">
              <label className="text-xs text-gray-500 px-1">名前</label>
              <input 
                type="text" 
                placeholder="名前" 
                className="bg-transparent border dark:border-gray-700 p-3 rounded-md focus:outline-blue-500 dark:text-white transition"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
            </div>
            
            <div className="flex flex-col gap-1">
              <label className="text-xs text-gray-500 px-1">自己紹介</label>
              <textarea 
                placeholder="自己紹介" 
                rows="4"
                className="bg-transparent border dark:border-gray-700 p-3 rounded-md focus:outline-blue-500 dark:text-white resize-none transition"
                value={bio}
                onChange={(e) => setBio(e.target.value)}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}