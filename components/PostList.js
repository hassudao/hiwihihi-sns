"use client";

import { useEffect, useState } from "react";
import { db, auth } from "@/lib/firebase";
import { 
  collection, query, orderBy, onSnapshot, doc, 
  updateDoc, arrayUnion, arrayRemove, getDoc,
  addDoc, serverTimestamp, deleteDoc // deleteDocを追加
} from "firebase/firestore";
import { Heart, MessageCircle, Repeat2, Share, Loader2, Trash2 } from "lucide-react";

export default function PostList() {
  const [posts, setPosts] = useState([]);
  const [userCache, setUserCache] = useState({});

  useEffect(() => {
    const q = query(collection(db, "posts"), orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(q, async (snapshot) => {
      const postData = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      const updatedPosts = await Promise.all(
        postData.map(async (post) => {
          if (userCache[post.uid]) return { ...post, ...userCache[post.uid] };
          try {
            const userRef = doc(db, "users", post.uid);
            const userSnap = await getDoc(userRef);
            if (userSnap.exists()) {
              const userData = {
                username: userSnap.data().username,
                userPhoto: userSnap.data().photoURL,
              };
              setUserCache((prev) => ({ ...prev, [post.uid]: userData }));
              return { ...post, ...userData };
            }
          } catch (err) { console.error(err); }
          return post;
        })
      );
      setPosts(updatedPosts);
    });
    return () => unsubscribe();
  }, [userCache]);

  // ★削除処理を追加
  const handleDelete = async (postId) => {
    if (!confirm("投稿を削除してもよろしいですか？")) return;
    try {
      await deleteDoc(doc(db, "posts", postId));
    } catch (error) {
      alert("削除に失敗しました");
    }
  };

  const handleLike = async (postId, likes = [], postOwnerId) => {
    const user = auth.currentUser;
    if (!user) return alert("ログインが必要です");
    const postRef = doc(db, "posts", postId);
    const isLiked = likes.includes(user.uid);
    try {
      if (isLiked) {
        await updateDoc(postRef, { likes: arrayRemove(user.uid) });
      } else {
        await updateDoc(postRef, { likes: arrayUnion(user.uid) });
        if (user.uid !== postOwnerId) {
          const senderName = user.displayName || userCache[user.uid]?.username || "誰か";
          await addDoc(collection(db, "notifications"), {
            type: "like", fromUserId: user.uid, fromUserName: senderName,
            toUserId: postOwnerId, postId: postId, createdAt: serverTimestamp(), read: false
          });
        }
      }
    } catch (error) { console.error(error); }
  };
    
  return (
    <div className="flex flex-col">
      {posts.length === 0 && (
        <div className="flex justify-center p-10">
          <Loader2 className="animate-spin text-gray-500" />
        </div>
      )}

      {posts.map((post) => {
        const isLiked = post.likes?.includes(auth.currentUser?.uid);
        const isMyPost = post.uid === auth.currentUser?.uid; // 自分の投稿か判定
        
        return (
          <div key={post.id} className="p-4 border-b border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-900/50 transition flex gap-3">
            <img 
              src={post.userPhoto || "https://abs.twimg.com/sticky/default_profile_images/default_profile_400x400.png"} 
              className="w-12 h-12 rounded-full object-cover bg-gray-200 dark:bg-gray-700 shadow-sm" 
              alt="avatar"
            />
            
            <div className="flex flex-col w-full">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="font-bold dark:text-white">{post.username}</span>
                  <span className="text-gray-500 text-sm">
                    {post.createdAt?.toDate().toLocaleString()}
                  </span>
                </div>
                {/* ★自分の投稿なら削除ボタンを表示 */}
                {isMyPost && (
                  <button onClick={() => handleDelete(post.id)} className="text-gray-400 hover:text-red-500 p-2 rounded-full hover:bg-red-50 dark:hover:bg-red-900/20 transition">
                    <Trash2 size={16} />
                  </button>
                )}
              </div>
              
              <p className="mt-1 text-gray-800 dark:text-gray-200 whitespace-pre-wrap leading-normal">
                {post.text}
              </p>
              
              {post.image && (
                <img src={post.image} alt="post" className="mt-3 rounded-2xl max-h-96 w-full object-cover border border-gray-100 dark:border-gray-800" />
              )}

              <div className="flex justify-between mt-3 text-gray-500 dark:text-gray-400 max-w-md">
                <button className="hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 p-2 rounded-full transition">
                  <MessageCircle size={18} />
                </button>
                <button className="hover:text-green-500 hover:bg-green-50 dark:hover:bg-green-900/20 p-2 rounded-full transition">
                  <Repeat2 size={18} />
                </button>
                <button 
                  onClick={() => handleLike(post.id, post.likes, post.uid)}
                  className={`flex items-center gap-1 p-2 rounded-full transition ${isLiked ? "text-pink-500" : "hover:text-pink-500 hover:bg-pink-50 dark:hover:bg-pink-900/20"}`}
                >
                  <Heart size={18} fill={isLiked ? "currentColor" : "none"} />
                  <span className="text-xs">{post.likes?.length || 0}</span>
                </button>
                <button className="hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 p-2 rounded-full transition">
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