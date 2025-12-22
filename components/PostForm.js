"use client";

import { useState } from "react";
import { db, auth } from "@/lib/firebase";
import { collection, addDoc, serverTimestamp, doc, getDoc } from "firebase/firestore";
import { Image as ImageIcon, Loader2 } from "lucide-react";

export default function PostForm() {
  const [content, setContent] = useState("");
  const [image, setImage] = useState(null);
  const [loading, setLoading] = useState(false);

  const handlePost = async (e) => {
    e.preventDefault();
    if (!content && !image) return;
    setLoading(true);

    try {
      // 1. 投稿前に現在のユーザーの最新プロフィール（名前・アイコン）を取得
      const userRef = doc(db, "users", auth.currentUser.uid);
      const userSnap = await getDoc(userRef);
      const userData = userSnap.data();

      let imageUrl = "";

      // 2. 画像がある場合はCloudinaryにアップロード
      if (image) {
        const formData = new FormData();
        formData.append("file", image);
        formData.append("upload_preset", process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET);

        const res = await fetch(
          `https://api.cloudinary.com/v1_1/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload`,
          { method: "POST", body: formData }
        );
        const data = await res.json();
        imageUrl = data.secure_url;
      }

      // 3. Firestoreにツイートデータを保存（名前とアイコンURLをセットで保存！）
      await addDoc(collection(db, "posts"), {
        text: content,
        image: imageUrl,
        uid: auth.currentUser.uid,
        username: userData?.username || "名無しのユーザー", 
        userPhoto: userData?.photoURL || "", 
        createdAt: serverTimestamp(),
        likes: [],
      });

      setContent("");
      setImage(null);
    } catch (error) {
      console.error(error);
      alert("投稿に失敗しました: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    // 修正箇所抜粋
<div className="p-4 border-b border-gray-200 dark:border-gray-800">
  <form onSubmit={handlePost}>
    <textarea
      className="w-full text-xl outline-none resize-none bg-transparent dark:text-white"
      placeholder="いまどうしてる？"
      // ...以下略
          rows="3"
          value={content}
          onChange={(e) => setContent(e.target.value)}
        />
        
        {image && (
          <div className="relative mb-2">
            <img src={URL.createObjectURL(image)} alt="preview" className="rounded-2xl max-h-80 object-cover" />
            <button type="button" onClick={() => setImage(null)} className="absolute top-2 left-2 bg-black/50 text-white rounded-full p-1 w-6 h-6 flex items-center justify-center">✕</button>
          </div>
        )}

        <div className="flex justify-between items-center pt-2 border-t mt-2">
          <label className="cursor-pointer hover:bg-blue-50 p-2 rounded-full text-blue-500 transition">
            <ImageIcon size={20} />
            <input type="file" className="hidden" accept="image/*" onChange={(e) => setImage(e.target.files[0])} />
          </label>
          
          <button
            type="submit"
            disabled={loading || (!content && !image)}
            className="bg-blue-500 text-white px-6 py-2 rounded-full font-bold disabled:opacity-50 transition hover:bg-blue-600"
          >
            {loading ? <Loader2 className="animate-spin" size={20} /> : "投稿する"}
          </button>
        </div>
      </form>
    </div>
  );
}