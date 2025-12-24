"use client";

import { useEffect, useState, useRef } from "react";
import { db, auth } from "@/lib/firebase";
import { collection, query, orderBy, onSnapshot, doc, deleteDoc } from "firebase/firestore";
import Link from "next/link"; // プロフィール移動用
import { Trash2 } from "lucide-react"; // アイコン（lucide-reactをインストールしている場合）

const DEFAULT_AVATAR = "https://abs.twimg.com/sticky/default_profile_images/default_profile_400x400.png";

export default function ReplyList({ postId }) {
  const [replies, setReplies] = useState([]);
  const scrollEndRef = useRef(null); // 自動スクロール用の目印

  useEffect(() => {
    const q = query(
      collection(db, "posts", postId, "replies"),
      orderBy("createdAt", "asc")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedReplies = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setReplies(fetchedReplies);
    });

    return () => unsubscribe();
  }, [postId]);

  // 返信が増えたら（最新の返信へ）自動スクロール
  useEffect(() => {
    if (replies.length > 0) {
      scrollEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [replies]);

  // 削除処理
  const handleDeleteReply = async (replyId) => {
    if (!confirm("この返信を削除しますか？")) return;
    try {
      await deleteDoc(doc(db, "posts", postId, "replies", replyId));
    } catch (err) {
      console.error("削除エラー:", err);
      alert("削除に失敗しました");
    }
  };

  if (replies.length === 0) return null;

  return (
    <div className="mt-2 space-y-3 ml-2 border-l-2 border-gray-100 dark:border-gray-800 pl-4 max-h-[400px] overflow-y-auto custom-scrollbar">
      {replies.map((reply) => (
        <div key={reply.id} className="group flex gap-2 py-2 animate-in fade-in duration-300 relative">
          {/* プロフィールへのリンク */}
          <Link href={`/profile/${reply.uid}`}>
            <img 
              src={reply.photoURL || reply.userPhoto || DEFAULT_AVATAR} 
              className="w-8 h-8 rounded-full object-cover shadow-sm hover:opacity-80 transition-opacity" 
              alt=""
              onError={(e) => { e.target.src = DEFAULT_AVATAR; }}
            />
          </Link>

          <div className="flex flex-col flex-1">
            <div className="flex items-center gap-2">
              <Link href={`/profile/${reply.uid}`} className="hover:underline">
                <span className="font-bold text-sm dark:text-white leading-none">
                  {reply.username || "ユーザー"}
                </span>
              </Link>
              <span className="text-gray-500 text-xs">
                {reply.createdAt?.toDate ? reply.createdAt.toDate().toLocaleString() : "..."}
              </span>
            </div>
            <p className="text-sm text-gray-800 dark:text-gray-200 whitespace-pre-wrap mt-0.5">
              {reply.text}
            </p>
          </div>

          {/* 自分の返信のみ削除ボタンを表示 */}
          {auth.currentUser?.uid === reply.uid && (
            <button 
              onClick={() => handleDeleteReply(reply.id)}
              className="opacity-0 group-hover:opacity-100 p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-full transition-all"
            >
              <Trash2 size={14} />
            </button>
          )}
        </div>
      ))}
      {/* スクロール位置を特定するための空タグ */}
      <div ref={scrollEndRef} />
    </div>
  );
}