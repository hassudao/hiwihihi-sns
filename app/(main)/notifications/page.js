"use client";

import { useEffect, useState } from "react";
import { auth, db } from "@/lib/firebase";
import { collection, query, where, orderBy, onSnapshot } from "firebase/firestore";
import { Heart, UserPlus, Mail } from "lucide-react";
import Link from "next/link";

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    const user = auth.currentUser;
    if (!user) return;

    const q = query(
      collection(db, "notifications"),
      where("toUserId", "==", user.uid),
      orderBy("createdAt", "desc")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      setNotifications(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    return () => unsubscribe();
  }, []);

  return (
    <div className="max-w-2xl border-x border-gray-100 dark:border-gray-800 min-h-screen bg-white dark:bg-black transition-colors">
      <h1 className="text-xl font-bold p-4 sticky top-0 bg-white/80 dark:bg-black/80 backdrop-blur-md z-10 border-b dark:border-gray-800 dark:text-white">通知</h1>
      
      <div className="flex flex-col">
        {notifications.map((notif) => {
          const isMessage = notif.type === "message";
          
          const Content = (
            <div className="p-4 border-b border-gray-50 dark:border-gray-800 flex items-start gap-3 hover:bg-gray-50 dark:hover:bg-gray-900/50 transition cursor-pointer">
              {/* アイコンの配色を調整 */}
              {notif.type === "like" && <Heart className="text-pink-500 fill-current mt-1" size={24} />}
              {notif.type === "follow" && <UserPlus className="text-blue-500 mt-1" size={24} />}
              {notif.type === "message" && <Mail className="text-green-500 mt-1" size={24} />}
              
              <div className="flex flex-col flex-1">
                <span className="font-bold dark:text-white">{notif.fromUserName} さん</span>
                <p className="text-gray-600 dark:text-gray-400">
                  {notif.type === "like" && "あなたの投稿をいいねしました"}
                  {notif.type === "follow" && "あなたをフォローしました"}
                  {notif.type === "message" && `メッセージ: ${notif.text}`}
                </p>
                <span className="text-xs text-gray-400 mt-1">
                  {notif.createdAt?.toDate().toLocaleString()}
                </span>
              </div>
            </div>
          );

          if (isMessage && notif.chatId) {
            return (
              <Link key={notif.id} href={`/messages/${notif.chatId}`}>
                {Content}
              </Link>
            );
          }

          return <div key={notif.id}>{Content}</div>;
        })}

        {notifications.length === 0 && (
          <div className="p-20 text-center flex flex-col items-center">
            <p className="text-gray-500 dark:text-gray-400 text-lg font-bold">まだ通知はありません</p>
            <p className="text-gray-400 dark:text-gray-500 text-sm">いいねやフォローされるとここに表示されます</p>
          </div>
        )}
      </div>
    </div>
  );
}