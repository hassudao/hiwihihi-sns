"use client";

import { useEffect, useState } from "react";
import { db, auth } from "@/lib/firebase";
import { collection, query, where, orderBy, onSnapshot, doc, getDoc } from "firebase/firestore";
import Link from "next/link";
import { Loader2 } from "lucide-react";

export default function MessagesPage() {
  const [chats, setChats] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const user = auth.currentUser;
    if (!user) return;

    const q = query(
      collection(db, "chats"),
      where("users", "array-contains", user.uid),
      orderBy("updatedAt", "desc")
    );

    const unsubscribe = onSnapshot(q, async (snapshot) => {
      const chatData = await Promise.all(
        snapshot.docs.map(async (chatDoc) => {
          const data = chatDoc.data();
          const partnerId = data.users.find((uid) => uid !== user.uid);
          
          let partnerInfo = { username: "ユーザー", photoURL: "" };
          if (partnerId) {
            const userSnap = await getDoc(doc(db, "users", partnerId));
            if (userSnap.exists()) {
              partnerInfo = userSnap.data();
            }
          }

          return {
            id: chatDoc.id,
            ...data,
            partner: partnerInfo,
          };
        })
      );
      setChats(chatData);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  if (loading) return <div className="flex justify-center p-10 bg-white dark:bg-black min-h-screen"><Loader2 className="animate-spin text-blue-500" /></div>;

  return (
    <div className="max-w-2xl border-x border-gray-100 dark:border-gray-800 min-h-screen bg-white dark:bg-black transition-colors">
      <h1 className="text-xl font-bold p-4 border-b dark:border-gray-800 bg-white/80 dark:bg-black/80 backdrop-blur-md sticky top-0 z-10 dark:text-white">メッセージ</h1>
      <div className="flex flex-col">
        {chats.map((chat) => (
          <Link 
            key={chat.id} 
            href={`/messages/${chat.id}`}
            className="p-4 hover:bg-gray-50 dark:hover:bg-gray-900 border-b dark:border-gray-800 flex items-center gap-3 transition group text-black dark:text-white"
          >
            <img 
              src={chat.partner.photoURL || "https://abs.twimg.com/sticky/default_profile_images/default_profile_400x400.png"} 
              className="w-12 h-12 rounded-full object-cover bg-gray-200 dark:bg-gray-800"
              alt=""
            />
            
            <div className="flex flex-col overflow-hidden flex-1">
              <div className="flex justify-between items-center">
                <span className="font-bold group-hover:underline">{chat.partner.username}</span>
                <span className="text-xs text-gray-400">
                  {chat.updatedAt?.toDate().toLocaleDateString()}
                </span>
              </div>
              <p className="text-gray-500 dark:text-gray-400 text-sm truncate">
                {chat.lastMessage || "メッセージを送りましょう"}
              </p>
            </div>
          </Link>
        ))}
        {chats.length === 0 && (
          <div className="p-10 text-center">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">メッセージへようこそ</h2>
            <p className="text-gray-500 dark:text-gray-400 mt-2">既存のチャットが見つかりません。誰かのプロフィールから会話を始めてみましょう！</p>
          </div>
        )}
      </div>
    </div>
  );
}