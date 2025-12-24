"use client";

import { useEffect, useState } from "react";
import { db, auth } from "@/lib/firebase";
import { 
  collection, query, orderBy, onSnapshot, doc, 
  updateDoc, arrayUnion, arrayRemove, getDoc,
  addDoc, serverTimestamp, deleteDoc 
} from "firebase/firestore";
import { Heart, MessageCircle, Repeat2, Share, Loader2, Trash2, Send } from "lucide-react";

// --- リプライ一覧を表示する内部コンポーネント ---
function ReplyList({ postId }) {
  const [replies, setReplies] = useState([]);

  useEffect(() => {
    const q = query(
      collection(db, "posts", postId, "replies"),
      orderBy("createdAt", "asc")
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setReplies(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    return () => unsubscribe();
  }, [postId]);

  if (replies.length === 0) return null;

  return (
    <div className="mt-2 space-y-3 ml-2 border-l-2 border-gray-100 dark:border-gray-800 pl-4">
      {replies.map((reply) => (
        <div key={reply.id} className="flex gap-2 py-2 animate-in fade-in duration-300">
          <img 
            src={reply.userPhoto || "https://abs.twimg.com/sticky/default_profile_images/default_profile_400x400.png"} 
            className="w-8 h-8 rounded-full object-cover" 
            alt=""
          />
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm dark:text-white">{reply.username}</span>
              <span className="text-gray-500 text-xs">
                {reply.createdAt?.toDate().toLocaleString()}
              </span>
            </div>
            <p className="text-sm text-gray-800 dark:text-gray-200">{reply.text}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

// --- メインの投稿リストコンポーネント ---
export default function PostList() {
  const [posts, setPosts] = useState([]);
  const [userCache, setUserCache] = useState({});
  const [replyingTo, setReplyingTo] = useState(null); 
  const [replyText, setReplyText] = useState("");

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

  const handleSendReply = async (postId, postOwnerId) => {
    if (!replyText.trim()) return;
    const user = auth.currentUser;
    if (!user) return alert("ログインが必要です");

    try {
      await addDoc(collection(db, "posts", postId, "replies"), {
        text: replyText,
        uid: user.uid,
        username: user.displayName || userCache[user.uid]?.username || "ユーザー",
        userPhoto: user.photoURL || "",
        createdAt: serverTimestamp(),
      });

      if (user.uid !== postOwnerId) {
        await addDoc(collection(db, "notifications"), {
          type: "reply",
          fromUserId: user.uid,
          fromUserName: user.displayName || userCache[user.uid]?.username || "誰か",
          toUserId: postOwnerId,
          postId: postId,
          text: replyText,
          createdAt: serverTimestamp(),
          read: false
        });
      }

      setReplyText("");
      setReplyingTo(null);
    } catch (err) {
      console.error(err);
      alert("リプライの送信に失敗しました");
    }
  };

  // ★追加：共有（リンクコピー）処理
  const handleShare = async (postId) => {
    const shareUrl = `${window.location.origin}/post/${postId}`;
    try {
      await navigator.clipboard.writeText(shareUrl);
      alert("リンクをクリップボードにコピーしました！");
    } catch (err) {
      console.error("コピーに失敗しました", err);
    }
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
        const isMyPost = post.uid === auth.currentUser?.uid;
        
        return (
          <div key={post.id} className="p-4 border-b border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-900/50 transition flex flex-col gap-3">
            <div className="flex gap-3">
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
                  {/* リプライボタン */}
                  <button 
                    onClick={() => setReplyingTo(replyingTo === post.id ? null : post.id)}
                    className={`flex items-center gap-1 p-2 rounded-full transition ${replyingTo === post.id ? "text-blue-500 bg-blue-50 dark:bg-blue-900/20" : "hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20"}`}
                  >
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

                  {/* ★修正：共有ボタン */}
                  <button 
                    onClick={() => handleShare(post.id)}
                    className="hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 p-2 rounded-full transition"
                    title="リンクをコピー"
                  >
                    <Share size={18} />
                  </button>
                </div>

                {replyingTo === post.id && (
                  <div className="mt-4 flex gap-2 animate-in fade-in slide-in-from-top-2 duration-200">
                    <input 
                      autoFocus
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                      placeholder="返信を送信"
                      className="flex-1 bg-gray-100 dark:bg-gray-800 dark:text-white rounded-full px-4 py-2 text-sm outline-none focus:ring-2 ring-blue-500"
                    />
                    <button 
                      onClick={() => handleSendReply(post.id, post.uid)}
                      disabled={!replyText.trim()}
                      className="bg-blue-500 text-white p-2 rounded-full disabled:opacity-50 hover:bg-blue-600 transition"
                    >
                      <Send size={16} />
                    </button>
                  </div>
                )}

                <ReplyList postId={post.id} />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}