"use client";

import { useEffect, useState } from "react";
import { db, auth } from "@/lib/firebase"; // authをインポート
import { collection, query, orderBy, onSnapshot, doc, deleteDoc } from "firebase/firestore";

const DEFAULT_AVATAR = "https://abs.twimg.com/sticky/default_profile_images/default_profile_400x400.png";

export default function ReplyList({ postId }) {
  const [replies, setReplies] = useState([]);

  useEffect(() => {
    if (!postId) return;

    const q = query(
      collection(db, "posts", postId, "replies"),
      orderBy("createdAt", "asc")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      setReplies(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    return () => unsubscribe();
  }, [postId]);

  const handleDelete = async (replyId) => {
    if (!window.confirm("この返信を削除しますか？")) return;
    try {
      await deleteDoc(doc(db, "posts", postId, "replies", replyId));
    } catch (err) {
      console.error(err);
      alert("削除に失敗しました");
    }
  };

  if (replies.length === 0) return null;

  return (
    <div className="mt-2 space-y-3 ml-2 border-l-2 border-gray-100 dark:border-gray-800 pl-4">
      {replies.map((reply) => (
        <div key={reply.id} className="flex gap-2 py-2">
          <img 
            src={reply.photoURL || reply.userPhoto || DEFAULT_AVATAR} 
            className="w-8 h-8 rounded-full object-cover" 
            alt=""
            onError={(e) => { e.target.src = DEFAULT_AVATAR }}
          />
          <div className="flex flex-col flex-1">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm dark:text-white">
                  {reply.username || "ユーザー"}
                </span>
                <span className="text-gray-500 text-xs">
                  {reply.createdAt?.toDate ? reply.createdAt.toDate().toLocaleString() : "..."}
                </span>
              </div>

              {/* アイコンを使わず「削除」という文字ボタンにする（エラー防止） */}
              {auth.currentUser?.uid === reply.uid && (
                <button 
                  onClick={() => handleDelete(reply.id)}
                  className="text-xs text-red-500 hover:underline px-2"
                >
                  削除
                </button>
              )}
            </div>
            <p className="text-sm text-gray-800 dark:text-gray-200">
              {reply.text}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}