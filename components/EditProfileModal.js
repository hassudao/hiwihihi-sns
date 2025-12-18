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

      // 1. 画像が新しく選択されていればCloudinaryにアップロード
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

      // 2. Firestoreのユーザー情報を更新
      await updateDoc(doc(db, "users", auth.currentUser.uid), {
        username: username,
        bio: bio,
        photoURL: photoURL,
      });

      alert("プロフィールを更新しました！");
      onClose(); // モーダルを閉じる
      window.location.reload(); // 画面をリロードして反映
    } catch (error) {
      console.error(error);
      alert("更新に失敗しました");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white w-full max-w-lg rounded-2xl overflow-hidden">
        {/* ヘッダー */}
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center gap-4">
            <button onClick={onClose} className="hover:bg-gray-100 p-2 rounded-full"><X /></button>
            <h2 className="text-xl font-bold">プロフィールを編集</h2>
          </div>
          <button 
            onClick={handleSave}
            disabled={loading}
            className="bg-black text-white px-4 py-1.5 rounded-full font-bold hover:bg-gray-800 disabled:opacity-50"
          >
            {loading ? <Loader2 className="animate-spin" size={18} /> : "保存"}
          </button>
        </div>

        {/* 編集フォーム */}
        <div className="p-4 flex flex-col gap-6">
          {/* アイコン選択 */}
          <div className="relative w-32 h-32 self-center">
            <img 
              src={image ? URL.createObjectURL(image) : (userProfile.photoURL || "https://abs.twimg.com/sticky/default_profile_images/default_profile_400x400.png")} 
              className="w-full h-full rounded-full object-cover brightness-75"
            />
            <label className="absolute inset-0 flex items-center justify-center cursor-pointer text-white">
              <Camera size={30} />
              <input type="file" className="hidden" accept="image/*" onChange={(e) => setImage(e.target.files[0])} />
            </label>
          </div>

          <div className="flex flex-col gap-4">
            <input 
              type="text" 
              placeholder="名前" 
              className="border p-3 rounded-md focus:outline-blue-500"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
            <textarea 
              placeholder="自己紹介" 
              rows="4"
              className="border p-3 rounded-md focus:outline-blue-500 resize-none"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
            />
          </div>
        </div>
      </div>
    </div>
  );
}