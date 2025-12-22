"use client";

import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import { collection, query, orderBy, onSnapshot } from "firebase/firestore";

export default function ReplyList({ postId }) {
  const [replies, setReplies] = useState([]);

  useEffect(() => {
    // 特定の投稿(postId)の中にある replies サブコレクションを監視
    const q = query(
      collection(db, "posts", postId, "replies"),
      orderBy("createdAt", "asc") // 古い順（会話の流れ順）に並べる
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
        <div key={reply.id} className="flex gap-2 py-2">
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