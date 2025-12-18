"use client";

import { useEffect, useState } from "react";
import { db, auth } from "@/lib/firebase";
import { collection, query, where, orderBy, onSnapshot } from "firebase/firestore";
import { Heart, UserPlus } from "lucide-react";

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    const user = auth.currentUser;
    if (!user) return;

    // 自分宛ての通知を新しい順に取得
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
    <div className="max-w-2xl border-x border-gray-100 min-h-screen">
      <h1 className="text-xl font-bold p-4 sticky top-0 bg-white/80 backdrop-blur-md">通知</h1>
      
      <div className="flex flex-col">
        {notifications.map((notif) => (
          <div key={notif.id} className="p-4 border-b border-gray-50 flex items-start gap-3 hover:bg-gray-50 transition">
            {notif.type === "like" && <Heart className="text-pink-500 fill-current mt-1" size={24} />}
            {notif.type === "follow" && <UserPlus className="text-blue-500 mt-1" size={24} />}
            
            <div className="flex flex-col">
              <span className="font-bold">{notif.fromUserName} さん</span>
              <p className="text-gray-600">
                {notif.type === "like" ? "あなたの投稿をいいねしました" : "あなたをフォローしました"}
              </p>
              <span className="text-xs text-gray-400 mt-1">
                {notif.createdAt?.toDate().toLocaleString()}
              </span>
            </div>
          </div>
        ))}
        {notifications.length === 0 && (
          <p className="p-10 text-center text-gray-500">まだ通知はありません</p>
        )}
      </div>
    </div>
  );
}