"use client";

import { useEffect, useState } from "react";
import { auth, db } from "@/lib/firebase";
import { 
  doc, getDoc, collection, query, where, orderBy, 
  onSnapshot, updateDoc, arrayUnion, arrayRemove, 
  addDoc, getDocs, serverTimestamp 
} from "firebase/firestore";
import { useParams, useRouter } from "next/navigation";
import { CalendarDays, Loader2, Mail, ArrowLeft } from "lucide-react";
import EditProfileModal from "@/components/EditProfileModal";
import PostList from "@/components/PostList"; // ★追加

export default function ProfilePage() {
  const { id } = useParams();
  const router = useRouter();
  const [userProfile, setUserProfile] = useState(null);
  const [myProfile, setMyProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isEditOpen, setIsEditOpen] = useState(false);

  // IDの解決（"me" の場合は自分のUIDを取得）
  const [targetUid, setTargetUid] = useState(null);

  useEffect(() => {
    const unsubscribeAuth = auth.onAuthStateChanged(async (user) => {
      let uid = id === "me" ? user?.uid : id;
      if (!uid) {
        if (id === "me" && !user) router.push("/"); // ログインしてないのに "me" に来たら戻す
        return;
      }
      setTargetUid(uid);

      if (user) {
        const myDoc = await getDoc(doc(db, "users", user.uid));
        setMyProfile(myDoc.data());
      }

      const userDoc = await getDoc(doc(db, "users", uid));
      if (userDoc.exists()) {
        setUserProfile({ id: userDoc.id, ...userDoc.data() });
      }
      setLoading(false);
    });

    return () => unsubscribeAuth();
  }, [id, router]);

  const handleFollow = async () => {
    if (!auth.currentUser || !userProfile) return;
    const myUid = auth.currentUser.uid;
    const targetUid = userProfile.id;
    const isFollowing = myProfile?.following?.includes(targetUid);
    const myRef = doc(db, "users", myUid);
    const targetRef = doc(db, "users", targetUid);

    try {
      if (isFollowing) {
        await updateDoc(myRef, { following: arrayRemove(targetUid) });
        await updateDoc(targetRef, { followers: arrayRemove(myUid) });
      } else {
        await updateDoc(myRef, { following: arrayUnion(targetUid) });
        await updateDoc(targetRef, { followers: arrayUnion(myUid) });
        if (myUid !== targetUid) {
          await addDoc(collection(db, "notifications"), {
            type: "follow", fromUserId: myUid, fromUserName: myProfile?.username || "誰か",
            toUserId: targetUid, createdAt: serverTimestamp(), read: false
          });
        }
      }
    } catch (error) { console.error("Follow error:", error); }
  };

  const handleStartMessage = async () => {
    const user = auth.currentUser;
    if (!user || !userProfile) return;
    const chatsRef = collection(db, "chats");
    const q = query(chatsRef, where("users", "array-contains", user.uid));
    const querySnapshot = await getDocs(q);
    let existingChat = querySnapshot.docs.find(doc => doc.data().users.includes(userProfile.id));

    if (existingChat) { router.push(`/messages/${existingChat.id}`); } 
    else {
      const newChatRef = await addDoc(chatsRef, {
        users: [user.uid, userProfile.id], updatedAt: serverTimestamp(), lastMessage: ""
      });
      router.push(`/messages/${newChatRef.id}`);
    }
  };

  if (loading || !userProfile) return (
    <div className="flex flex-col items-center justify-center h-screen gap-2 bg-white dark:bg-black">
      <Loader2 className="animate-spin text-blue-500" size={40} />
      <p className="text-gray-500">読み込み中...</p>
    </div>
  );

  const isMe = id === "me" || targetUid === auth.currentUser?.uid;
  const isFollowingNow = myProfile?.following?.includes(userProfile.id);

  return (
    <div className="min-h-screen bg-white dark:bg-black transition-colors">
      {/* ヘッダー */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-800 flex items-center gap-6 sticky top-0 bg-white/80 dark:bg-black/80 backdrop-blur-md z-10">
        <button onClick={() => router.back()} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-900 rounded-full transition">
          <ArrowLeft size={20} className="dark:text-white" />
        </button>
        <div>
          <h1 className="text-xl font-bold dark:text-white">{userProfile.username}</h1>
        </div>
      </div>

      <div className="relative">
        <div className="h-48 bg-gray-200 dark:bg-gray-800 w-full" />
        <div className="px-4">
          <div className="flex justify-between items-end -mt-16 mb-4">
            <img 
              src={userProfile.photoURL || "https://abs.twimg.com/sticky/default_profile_images/default_profile_400x400.png"} 
              className="w-32 h-32 rounded-full border-4 border-white dark:border-black bg-gray-300 object-cover" 
            />
            <div className="flex gap-2 mb-2 items-center">
              {isMe ? (
                <button onClick={() => setIsEditOpen(true)} className="border border-gray-300 dark:border-gray-700 font-bold px-4 py-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-900 dark:text-white transition">
                  プロフィールを編集
                </button>
              ) : (
                <>
                  <button onClick={handleStartMessage} className="p-2 border border-gray-300 dark:border-gray-700 rounded-full hover:bg-gray-100 dark:hover:bg-gray-900 dark:text-white transition">
                    <Mail size={20} />
                  </button>
                  <button 
                    onClick={handleFollow}
                    className={`font-bold px-6 py-2 rounded-full transition ${
                      isFollowingNow 
                        ? "border border-gray-300 dark:border-gray-700 dark:text-white hover:bg-red-50 dark:hover:bg-red-950/30 hover:text-red-500 hover:border-red-200" 
                        : "bg-black dark:bg-white text-white dark:text-black hover:opacity-90"
                    }`}
                  >
                    {isFollowingNow ? "フォロー中" : "フォローする"}
                  </button>
                </>
              )}
            </div>
          </div>
          
          <h2 className="text-xl font-bold dark:text-white">{userProfile.username}</h2>
          <p className="text-gray-500">@{userProfile.email?.split('@')[0] || "user"}</p>
          <p className="mt-3 text-lg dark:text-gray-200">{userProfile.bio || "自己紹介はまだありません"}</p>
          
          <div className="flex items-center gap-2 text-gray-500 mt-3">
            <CalendarDays size={18} />
            <span>{userProfile.createdAt?.toDate().toLocaleDateString()}から利用しています</span>
          </div>

          <div className="flex gap-4 mt-4 pb-4 border-b border-gray-200 dark:border-gray-800">
            <span className="dark:text-gray-400">
              <b className="text-black dark:text-white">{userProfile.following?.length || 0}</b> フォロー中
            </span>
            <span className="dark:text-gray-400">
              <b className="text-black dark:text-white">{userProfile.followers?.length || 0}</b> フォロワー
            </span>
          </div>
        </div>
      </div>

      {/* ★投稿一覧セクションを共通コンポーネントに差し替え */}
      <div className="mt-2">
        {targetUid && <PostList userId={targetUid} />}
      </div>

      {isEditOpen && <EditProfileModal userProfile={userProfile} onClose={() => setIsEditOpen(false)} />}
    </div>
  );
}