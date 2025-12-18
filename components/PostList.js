"use client";

import { useEffect, useState } from "react";
import { db, auth } from "@/lib/firebase";
import { collection, query, orderBy, onSnapshot, doc, updateDoc, arrayUnion, arrayRemove } from "firebase/firestore";
import { Heart, MessageCircle, Repeat2, Share } from "lucide-react";

export default function PostList() {
  const [posts, setPosts] = useState([]);

  useEffect(() => {
    const q = query(collection(db, "posts"), orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setPosts(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
    });
    return () => unsubscribe();
  }, []);

  const handleLike = async (postId, likes = []) => {
    const user = auth.currentUser;
    if (!user) return alert("ログインが必要です");

    const postRef = doc(db, "posts", postId);
    const isLiked = likes.includes(user.uid);

    try {
      if (isLiked) {
        await updateDoc(postRef, { likes: arrayRemove(user.uid) });
      } else {
        await updateDoc(postRef, { likes: arrayUnion(user.uid) });
      }
    } catch (error) {
      console.error("Like error:", error);
    }
  };

  return (
    <div className="flex flex-col">
      {posts.map((post) => {
        const isLiked = post.likes?.includes(auth.currentUser?.uid);
        
        return (
          <div key={post.id} className="p-4 border-b border-gray-200 hover:bg-gray-50 transition flex gap-3">
            {/* 投稿者のアイコンを表示 */}
            <img 
              src={post.userPhoto || "https://abs.twimg.com/sticky/default_profile_images/default_profile_400x400.png"} 
              className="w-12 h-12 rounded-full object-cover bg-gray-200" 
              alt="avatar"
            />
            
            <div className="flex flex-col w-full">
              <div className="flex items-center gap-2">
                <span className="font-bold">{post.username}</span>
                <span className="text-gray-500 text-sm">
                  {post.createdAt?.toDate().toLocaleString()}
                </span>
              </div>
              
              <p className="mt-1 text-gray-800 whitespace-pre-wrap">{post.text}</p>
              
              {post.image && (
                <img src={post.image} alt="post" className="mt-3 rounded-2xl max-h-96 w-full object-cover border" />
              )}

              <div className="flex justify-between mt-3 text-gray-500 max-w-md">
                <button className="hover:text-blue-500 hover:bg-blue-50 p-2 rounded-full transition"><MessageCircle size={18} /></button>
                <button className="hover:text-green-500 hover:bg-green-50 p-2 rounded-full transition"><Repeat2 size={18} /></button>
                <button 
                  onClick={() => handleLike(post.id, post.likes)}
                  className={`flex items-center gap-1 p-2 rounded-full transition ${isLiked ? "text-pink-500" : "hover:text-pink-500 hover:bg-pink-50"}`}
                >
                  <Heart size={18} fill={isLiked ? "currentColor" : "none"} />
                  <span className="text-xs">{post.likes?.length || 0}</span>
                </button>
                <button className="hover:text-blue-500 hover:bg-blue-50 p-2 rounded-full transition"><Share size={18} /></button>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}