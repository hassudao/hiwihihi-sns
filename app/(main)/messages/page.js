"use client";

import { useEffect, useState } from "react";
import { db, auth } from "@/lib/firebase";
import { collection, query, where, orderBy, onSnapshot } from "firebase/firestore";
import Link from "next/link";

export default function MessagesPage() {
  const [chats, setChats] = useState([]);

  useEffect(() => {
    const user = auth.currentUser;
    if (!user) return;

    // 自分が参加しているチャットルームを新しい順に取得
    const q = query(
      collection(db, "chats"),
      where("users", "array-contains", user.uid),
      orderBy("updatedAt", "desc")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      setChats(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    return () => unsubscribe();
  }, []);

  return (
    <div className="max-w-2xl border-x border-gray-100 min-h-screen">
      <h1 className="text-xl font-bold p-4 border-b">メッセージ</h1>
      <div className="flex flex-col">
        {chats.map((chat) => (
          <Link 
            key={chat.id} 
            href={`/messages/${chat.id}`}
            className="p-4 hover:bg-gray-50 border-b flex items-center gap-3 transition"
          >
            <div className="w-12 h-12 bg-gray-200 rounded-full flex-shrink-0" />
            <div className="flex flex-col overflow-hidden">
              <span className="font-bold">チャット相手</span>
              <p className="text-gray-500 text-sm truncate">{chat.lastMessage || "メッセージを送りましょう"}</p>
            </div>
          </Link>
        ))}
        {chats.length === 0 && (
          <p className="p-10 text-center text-gray-500">まだメッセージはありません</p>
        )}
      </div>
    </div>
  );
}