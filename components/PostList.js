"use client";

import { useEffect, useState, useCallback } from "react";
import { db, auth } from "@/lib/firebase";
import { 
  collection, query, orderBy, onSnapshot, doc, 
  updateDoc, arrayUnion, arrayRemove, getDoc,
  addDoc, serverTimestamp, deleteDoc, where
} from "firebase/firestore";
import { Heart, MessageCircle, Repeat2, Share, Loader2, Trash2, Send } from "lucide-react";
import { useRouter } from "next/navigation";

const DEFAULT_AVATAR = "https://abs.twimg.com/sticky/default_profile_images/default_profile_400x400.png";

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
            src={reply.photoURL || reply.userPhoto || DEFAULT_AVATAR} 
            className="w-8 h-8 rounded-full object-cover shadow-sm bg-gray-100 dark:bg-gray-800" 
            alt=""
            onError={(e) => { e.target.src = DEFAULT_AVATAR }}
          />
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm dark:text-white">{reply.username}</span>
              <span className="text-gray-500 text-xs">
                {reply.createdAt?.toDate ? reply.createdAt.toDate().toLocaleString() : "..."}
              </span>
            </div>
            <p className="text-sm text-gray-800 dark:text-gray-200">{reply.text}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

export default function PostList({ userId = null, singlePostId = null }) {
  const [posts, setPosts] = useState([]);
  const [userCache, setUserCache] = useState({});
  const [openReplyId, setOpenReplyId] = useState(singlePostId); 
  const [replyText, setReplyText] = useState("");
  const router = useRouter();

  // ユーザー情報を取得してキャッシュする関数
  const fetchUserData = useCallback(async (uid) => {
    if (userCache[uid]) return userCache[uid];
    try {
      const userSnap = await getDoc(doc(db, "users", uid));
      if (userSnap.exists()) {
        const userData = {
          username: userSnap.data().username,
          userPhoto: userSnap.data().photoURL,
        };
        setUserCache(prev => ({ ...prev, [uid]: userData }));
        return userData;
      }
    } catch (err) { console.error(err); }
    return { username: "ユーザー", userPhoto: DEFAULT_AVATAR };
  }, [userCache]);

  useEffect(() => {
    let q;
    if (singlePostId) {
      const postRef = doc(db, "posts", singlePostId);
      return onSnapshot(postRef, async (snapshot) => {
        if (snapshot.exists()) {
          const post = { id: snapshot.id, ...snapshot.data() };
          const userData = await fetchUserData(post.uid);
          setPosts([{ ...post, ...userData }]);
          setOpenReplyId(singlePostId);
        } else {
          setPosts([]);
        }
      });
    } else {
      q = userId 
        ? query(collection(db, "posts"), where("uid", "==", userId), orderBy("createdAt", "desc"))
        : query(collection(db, "posts"), orderBy("createdAt", "desc"));

      return onSnapshot(q, async (snapshot) => {
        const postData = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
        // 全ての投稿のユーザー情報を並列で取得
        const enrichedPosts = await Promise.all(
          postData.map(async (p) => {
            const userData = await fetchUserData(p.uid);
            return { ...p, ...userData };
          })
        );
        setPosts(enrichedPosts);
      });
    }
  }, [userId, singlePostId, fetchUserData]);

  const handleLike = async (e, postId, likes = [], postOwnerId) => {
    e.stopPropagation();
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
          await addDoc(collection(db, "notifications"), {
            type: "like", fromUserId: user.uid, fromUserName: user.displayName || "誰か",
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
    // 【重要】送信する前に、自分の最新プロフィールをDBから取得する
    const userDoc = await getDoc(doc(db, "users", user.uid));
    const userData = userDoc.exists() ? userDoc.data() : {};

    await addDoc(collection(db, "posts", postId, "replies"), {
      text: replyText,
      uid: user.uid,
      // DBにある最新の名前、なければAuthの表示名、それもなければ「ユーザー」
      username: userData.username || user.displayName || "ユーザー",
      // DBにある最新のアイコン、なければAuthのアイコン、それもなければデフォルト
      photoURL: userData.photoURL || user.photoURL || "https://abs.twimg.com/sticky/default_profile_images/default_profile_400x400.png", 
      createdAt: serverTimestamp(),
    });

    if (user.uid !== postOwnerId) {
      await addDoc(collection(db, "notifications"), {
        type: "reply", fromUserId: user.uid, fromUserName: userData.username || "誰か",
        toUserId: postOwnerId, postId: postId, text: replyText, createdAt: serverTimestamp(), read: false
      });
    }
    setReplyText("");
  } catch (err) { console.error(err); }
};
  return (
    <div className="flex flex-col">
      {posts.length === 0 && !singlePostId && (
        <div className="flex justify-center p-10"><Loader2 className="animate-spin text-gray-500" /></div>
      )}

      {posts.map((post) => {
        const isLiked = post.likes?.includes(auth.currentUser?.uid);
        const isMyPost = post.uid === auth.currentUser?.uid;
        const isReplyOpen = openReplyId === post.id;

        return (
          <div 
            key={post.id} 
            onClick={() => router.push(`/post/${post.id}`)}
            className={`p-4 border-b border-gray-200 dark:border-gray-800 transition cursor-pointer ${!singlePostId && "hover:bg-gray-50 dark:hover:bg-gray-900/50"}`}
          >
            <div className="flex gap-3">
              <img 
                src={post.userPhoto || DEFAULT_AVATAR} 
                className="w-12 h-12 rounded-full object-cover bg-gray-200 dark:bg-gray-700 shadow-sm"
                alt=""
                onError={(e) => { e.target.src = DEFAULT_AVATAR }}
              />
              <div className="flex flex-col w-full">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-bold dark:text-white">{post.username}</span>
                    <span className="text-gray-500 text-sm">
                      {post.createdAt?.toDate ? post.createdAt.toDate().toLocaleString() : "just now"}
                    </span>
                  </div>
                  {isMyPost && (
                    <button onClick={(e) => handleDelete(e, post.id)} className="text-gray-400 hover:text-red-500 p-2 rounded-full transition">
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>
                <p className={`mt-1 text-gray-800 dark:text-gray-200 whitespace-pre-wrap ${singlePostId ? "text-xl" : "text-base"}`}>
                  {post.text}
                </p>
                {post.image && (
                  <img src={post.image} className="mt-3 rounded-2xl max-h-96 w-full object-cover border border-gray-100 dark:border-gray-800" alt="post" />
                )}

                <div className="flex justify-between mt-3 text-gray-500 dark:text-gray-400 max-w-md">
                  <button 
                    onClick={(e) => { e.stopPropagation(); setOpenReplyId(isReplyOpen ? null : post.id); }}
                    className={`flex items-center gap-1 p-2 rounded-full transition ${isReplyOpen ? "text-blue-500 bg-blue-50 dark:bg-blue-900/20" : "hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20"}`}
                  >
                    <MessageCircle size={18} />
                  </button>
                  <button onClick={(e) => e.stopPropagation()} className="hover:text-green-500 p-2 rounded-full transition"><Repeat2 size={18} /></button>
                  <button 
                    onClick={(e) => handleLike(e, post.id, post.likes, post.uid)} 
                    className={`flex items-center gap-1 p-2 rounded-full transition ${isLiked ? "text-pink-500" : "hover:text-pink-500"}`}
                  >
                    <Heart size={18} fill={isLiked ? "currentColor" : "none"} />
                    <span className="text-xs">{post.likes?.length || 0}</span>
                  </button>
                  <button 
                    onClick={(e) => { e.stopPropagation(); navigator.clipboard.writeText(`${window.location.origin}/post/${post.id}`); alert("リンクをコピーしました"); }} 
                    className="hover:text-blue-500 p-2 rounded-full transition"
                  >
                    <Share size={18} />
                  </button>
                </div>

                {isReplyOpen && (
                  <div className="mt-4 animate-in slide-in-from-top-2 duration-200" onClick={(e) => e.stopPropagation()}>
                    <div className="flex gap-2 mb-4">
                      <input 
                        autoFocus={!singlePostId}
                        value={replyText}
                        onChange={(e) => setReplyText(e.target.value)}
                        placeholder="返信を送信"
                        className="flex-1 bg-gray-100 dark:bg-gray-800 dark:text-white rounded-full px-4 py-2 text-sm outline-none focus:ring-2 ring-blue-500"
                        onKeyDown={(e) => e.key === 'Enter' && handleSendReply(post.id, post.uid)}
                      />
                      <button 
                        onClick={() => handleSendReply(post.id, post.uid)}
                        disabled={!replyText.trim()}
                        className="bg-blue-500 text-white p-2 rounded-full disabled:opacity-50 hover:bg-blue-600 transition"
                      >
                        <Send size={16} />
                      </button>
                    </div>
                    <ReplyList postId={post.id} />
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}