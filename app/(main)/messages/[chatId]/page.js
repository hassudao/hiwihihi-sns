"use client";

import { useEffect, useState, useRef } from "react";
import { db, auth } from "@/lib/firebase";
import { 
  collection, 
  addDoc, 
  query, 
  orderBy, 
  onSnapshot, 
  serverTimestamp, 
  doc, 
  updateDoc,
  getDoc 
} from "firebase/firestore";
import { useParams } from "next/navigation";
import { Send, Loader2 } from "lucide-react";

export default function ChatPage() {
  const { chatId } = useParams();
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState("");
  const [partner, setPartner] = useState(null);
  const scrollRef = useRef(null);

  // 1. チャット相手の情報を取得（通知を送るためにIDも保存するように修正）
  useEffect(() => {
    const fetchPartner = async () => {
      const chatDoc = await getDoc(doc(db, "chats", chatId));
      if (chatDoc.exists()) {
        const partnerId = chatDoc.data().users.find(uid => uid !== auth.currentUser?.uid);
        if (partnerId) {
          const userDoc = await getDoc(doc(db, "users", partnerId));
          if (userDoc.exists()) {
            // IDも含めてセットすることで通知の宛先に使いやすくします
            setPartner({ id: userDoc.id, ...userDoc.data() });
          }
        }
      }
    };
    fetchPartner();
  }, [chatId]);

  // 2. メッセージのリアルタイム取得
  useEffect(() => {
    const q = query(
      collection(db, "chats", chatId, "messages"),
      orderBy("createdAt", "asc")
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setMessages(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    return () => unsubscribe();
  }, [chatId]);

  // 3. メッセージ送信後の自動スクロール
  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // メッセージ送信処理 ＆ 通知送信ロジックを統合
  const sendMessage = async (e) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    const user = auth.currentUser;
    const text = inputText;
    setInputText("");

    try {
      // ① messagesサブコレクションにメッセージを追加
      await addDoc(collection(db, "chats", chatId, "messages"), {
        text: text,
        senderId: user.uid,
        createdAt: serverTimestamp(),
      });

      // ② 親のchatsドキュメントを更新（一覧画面のプレビュー用）
      await updateDoc(doc(db, "chats", chatId), {
        lastMessage: text,
        updatedAt: serverTimestamp(),
      });

      // ③ 【統合ポイント】相手に通知を送る
      if (partner) {
        await addDoc(collection(db, "notifications"), {
          type: "message",
          fromUserId: user.uid,
          fromUserName: user.displayName || "誰か",
          toUserId: partner.id, // 相手のUID
          chatId: chatId,
          text: text, // メッセージのプレビューとして表示
          createdAt: serverTimestamp(),
          read: false
        });
      }

    } catch (err) {
      console.error("Send error:", err);
    }
  };

  return (
    <div className="flex flex-col h-screen max-w-2xl border-x border-gray-100 bg-white relative">
      {/* ヘッダー */}
      <div className="p-4 border-b font-bold sticky top-0 bg-white/80 backdrop-blur-md z-10 flex items-center gap-3">
        {partner && (
          <>
            <img src={partner.photoURL} className="w-8 h-8 rounded-full object-cover" alt="" />
            <span>{partner.username}</span>
          </>
        )}
      </div>
      
      {/* メッセージ表示エリア */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 pb-24">
        {messages.map((m) => {
          const isMe = m.senderId === auth.currentUser?.uid;
          return (
            <div key={m.id} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[75%] p-3 rounded-2xl text-sm ${
                isMe ? "bg-blue-500 text-white rounded-br-none" : "bg-gray-100 text-black rounded-bl-none"
              }`}>
                {m.text}
                <div className={`text-[10px] mt-1 ${isMe ? "text-blue-100" : "text-gray-400"}`}>
                  {m.createdAt?.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            </div>
          );
        })}
        <div ref={scrollRef} />
      </div>

      {/* 送信フォーム */}
      <form onSubmit={sendMessage} className="p-4 border-t bg-white sticky bottom-0 flex gap-2">
        <input 
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder="新しいメッセージを作成"
          className="flex-1 bg-gray-100 rounded-full px-4 py-2 outline-none focus:ring-2 ring-blue-500 transition"
        />
        <button className="bg-blue-500 text-white p-2 rounded-full hover:bg-blue-600 transition disabled:opacity-50">
          <Send size={20} />
        </button>
      </form>
    </div>
  );
}