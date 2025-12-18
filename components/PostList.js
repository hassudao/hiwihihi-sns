"use client";

import { useEffect, useState } from "react";
import { db, auth } from "@/lib/firebase";
import { 
  collection, 
  query, 
  orderBy, 
  onSnapshot, 
  doc, 
  updateDoc, 
  arrayUnion, 
  arrayRemove, 
  getDoc,
  addDoc,           // これが必要！
  serverTimestamp   // これが必要！
} from "firebase/firestore";
import { Heart, MessageCircle, Repeat2, Share, Loader2 } from "lucide-react";

export default function PostList() {
  const [posts, setPosts] = useState([]);
  const [userCache, setUserCache] = useState({}); // 取得したユーザー情報をメモしておく場所

  useEffect(() => {
    const q = query(collection(db, "posts"), orderBy("createdAt", "desc"));
    
    // リアルタイム購読を開始
    const unsubscribe = onSnapshot(q, async (snapshot) => {
      const postData = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));

      // 各投稿のUIDを元に、最新のユーザー情報を合体させる
      const updatedPosts = await Promise.all(
        postData.map(async (post) => {
          // すでにキャッシュにある場合はそれを使う（何度もDBを見に行かないため）
          if (userCache[post.uid]) {
            return { ...post, ...userCache[post.uid] };
          }

          // キャッシュになければ、usersコレクションから直接取得
          try {
            const userRef = doc(db, "users", post.uid);
            const userSnap = await getDoc(userRef);

            if (userSnap.exists()) {
              const userData = {
                username: userSnap.data().username,
                userPhoto: userSnap.data().photoURL,
              };
              // メモ（キャッシュ）に保存
              setUserCache((prev) => ({ ...prev, [post.uid]: userData }));
              return { ...post, ...userData };
            }
          } catch (err) {
            console.error("User fetch error:", err);
          }
          return post;
        })
      );

      setPosts(updatedPosts);
    });

    return () => unsubscribe();
  }, [userCache]); // キャッシュが更新された際にも反応するように設定

  // components/PostList.js 内の handleLike 関数を修正

const handleLike = async (postId, likes = [], postOwnerId) => { // 引数に postOwnerId を追加
  const user = auth.currentUser;
  if (!user) return alert("ログインが必要です");

  const postRef = doc(db, "posts", postId);
  const isLiked = likes.includes(user.uid);

  try {
    if (isLiked) {
      await updateDoc(postRef, { likes: arrayRemove(user.uid) });
    } else {
      await updateDoc(postRef, { likes: arrayUnion(user.uid) });

      // 【追加】いいねした時だけ通知を送る（自分の投稿へのいいね以外）
      if (user.uid !== postOwnerId) {
        await addDoc(collection(db, "notifications"), {
          type: "like",
          fromUserId: user.uid,
          fromUserName: user.displayName || "誰か",
          toUserId: postOwnerId,
          postId: postId,
          createdAt: serverTimestamp(),
          read: false // 未読フラグ
        });
      }
    }
  } catch (error) {
    console.error("Like error:", error);
  }
};
    
  return (
    <div className="flex flex-col">
      {posts.length === 0 && (
        <div className="flex justify-center p-10">
          <Loader2 className="animate-spin text-gray-300" />
        </div>
      )}

      {posts.map((post) => {
        const isLiked = post.likes?.includes(auth.currentUser?.uid);
        
        return (
          <div key={post.id} className="p-4 border-b border-gray-200 hover:bg-gray-50 transition flex gap-3">
            {/* 常に最新のユーザーアイコンを表示 */}
            <img 
              src={post.userPhoto || "https://abs.twimg.com/sticky/default_profile_images/default_profile_400x400.png"} 
              className="w-12 h-12 rounded-full object-cover bg-gray-200 shadow-sm" 
              alt="avatar"
            />
            
            <div className="flex flex-col w-full">
              <div className="flex items-center gap-2">
                {/* 常に最新のユーザー名を表示 */}
                <span className="font-bold">{post.username}</span>
                <span className="text-gray-500 text-sm">
                  {post.createdAt?.toDate().toLocaleString()}
                </span>
              </div>
              
              <p className="mt-1 text-gray-800 whitespace-pre-wrap leading-normal">
                {post.text}
              </p>
              
              {post.image && (
                <img 
                  src={post.image} 
                  alt="post" 
                  className="mt-3 rounded-2xl max-h-96 w-full object-cover border border-gray-100" 
                />
              )}

              <div className="flex justify-between mt-3 text-gray-500 max-w-md">
                <button className="hover:text-blue-500 hover:bg-blue-50 p-2 rounded-full transition">
                  <MessageCircle size={18} />
                </button>
                <button className="hover:text-green-500 hover:bg-green-50 p-2 rounded-full transition">
                  <Repeat2 size={18} />
                </button>
                
                <button 
                  onClick={() => handleLike(post.id, post.likes)}
                  className={`flex items-center gap-1 p-2 rounded-full transition ${
                    isLiked ? "text-pink-500" : "hover:text-pink-500 hover:bg-pink-50"
                  }`}
                >
                  <Heart size={18} fill={isLiked ? "currentColor" : "none"} />
                  <span className="text-xs">{post.likes?.length || 0}</span>
                </button>

                <button className="hover:text-blue-500 hover:bg-blue-50 p-2 rounded-full transition">
                  <Share size={18} />
                </button>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}