"use client";

import { useEffect, useState } from "react";
import { auth, db } from "@/lib/firebase";
import { 
  doc, 
  getDoc, 
  collection, 
  query, 
  where, 
  orderBy, 
  onSnapshot, 
  updateDoc, 
  arrayUnion, 
  arrayRemove, 
  addDoc, 
  getDocs, 
  serverTimestamp 
} from "firebase/firestore";
import { useParams, useRouter } from "next/navigation";
import { CalendarDays, Loader2, Mail } from "lucide-react"; // Mailアイコンを追加
import EditProfileModal from "@/components/EditProfileModal";

export default function ProfilePage() {
  const { id } = useParams();
  const router = useRouter();
  const [userProfile, setUserProfile] = useState(null);
  const [myProfile, setMyProfile] = useState(null);
  const [userPosts, setUserPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isEditOpen, setIsEditOpen] = useState(false);

  useEffect(() => {
    const unsubscribeAuth = auth.onAuthStateChanged(async (user) => {
      let targetUid = id === "me" ? user?.uid : id;
      if (!targetUid) return;

      if (user) {
        const myDoc = await getDoc(doc(db, "users", user.uid));
        setMyProfile(myDoc.data());
      }

      const userDoc = await getDoc(doc(db, "users", targetUid));
      if (userDoc.exists()) {
        setUserProfile({ id: userDoc.id, ...userDoc.data() });
      }

      const q = query(collection(db, "posts"), where("uid", "==", targetUid), orderBy("createdAt", "desc"));
      const unsubscribePosts = onSnapshot(q, (snapshot) => {
        setUserPosts(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
        setLoading(false);
      });

      return () => unsubscribePosts();
    });

    return () => unsubscribeAuth();
  }, [id]);

  // フォロー/フォロー解除 ＆ 通知処理
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

        // フォロー通知の送信
        if (myUid !== targetUid) {
          await addDoc(collection(db, "notifications"), {
            type: "follow",
            fromUserId: myUid,
            fromUserName: myProfile?.username || "誰か",
            toUserId: targetUid,
            createdAt: serverTimestamp(),
            read: false
          });
        }
      }
      window.location.reload();
    } catch (error) {
      console.error("Follow error:", error);
    }
  };

  // メッセージ開始処理
  const handleStartMessage = async () => {
    const user = auth.currentUser;
    if (!user || !userProfile) return;

    const chatsRef = collection(db, "chats");
    const q = query(chatsRef, where("users", "array-contains", user.uid));
    
    const querySnapshot = await getDocs(q);
    let existingChat = querySnapshot.docs.find(doc => 
      doc.data().users.includes(userProfile.id)
    );

    if (existingChat) {
      router.push(`/messages/${existingChat.id}`);
    } else {
      const newChatRef = await addDoc(chatsRef, {
        users: [user.uid, userProfile.id],
        updatedAt: serverTimestamp(),
        lastMessage: ""
      });
      router.push(`/messages/${newChatRef.id}`);
    }
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center h-screen gap-2">
      <Loader2 className="animate-spin text-blue-500" size={40} />
      <p className="text-gray-500">読み込み中...</p>
    </div>
  );

  const isMe = id === "me" || id === auth.currentUser?.uid;
  const isFollowing = myProfile?.following?.includes(userProfile.id);

  return (
    <div className="min-h-screen bg-white">
      <div className="p-4 border-b flex items-center gap-6 sticky top-0 bg-white/80 backdrop-blur-md z-10">
        <h1 className="text-xl font-bold">{userProfile.username}</h1>
      </div>

      <div className="relative">
        <div className="h-48 bg-gray-200 w-full" />
        <div className="px-4">
          <div className="flex justify-between items-end -mt-16 mb-4">
            <img src={userProfile.photoURL || "https://abs.twimg.com/sticky/default_profile_images/default_profile_400x400.png"} className="w-32 h-32 rounded-full border-4 border-white bg-gray-300 object-cover" />
            
            <div className="flex gap-2 mb-2 items-center">
              {isMe ? (
                <button onClick={() => setIsEditOpen(true)} className="border border-gray-300 font-bold px-4 py-2 rounded-full hover:bg-gray-100 transition">
                  プロフィールを編集
                </button>
              ) : (
                <>
                  {/* メッセージボタン */}
                  <button 
                    onClick={handleStartMessage}
                    className="p-2 border border-gray-300 rounded-full hover:bg-gray-100 transition"
                  >
                    <Mail size={20} />
                  </button>
                  {/* フォローボタン */}
                  <button 
                    onClick={handleFollow}
                    className={`font-bold px-6 py-2 rounded-full transition ${isFollowing ? "border border-gray-300 hover:bg-red-50 hover:text-red-500 hover:border-red-200" : "bg-black text-white hover:bg-gray-800"}`}
                  >
                    {isFollowing ? "フォロー中" : "フォローする"}
                  </button>
                </>
              )}
            </div>
          </div>
          
          <h2 className="text-xl font-bold">{userProfile.username}</h2>
          <p className="text-gray-500">@{userProfile.email?.split('@')[0] || "user"}</p>
          <p className="mt-3 text-lg">{userProfile.bio || "自己紹介はまだありません"}</p>
          
          <div className="flex items-center gap-2 text-gray-500 mt-3">
            <CalendarDays size={18} />
            <span>{userProfile.createdAt?.toDate().toLocaleDateString()}から利用しています</span>
          </div>

          <div className="flex gap-4 mt-4 pb-4 border-b">
            <span><b className="text-black">{userProfile.following?.length || 0}</b> <span className="text-gray-500">フォロー中</span></span>
            <span><b className="text-black">{userProfile.followers?.length || 0}</b> <span className="text-gray-500">フォロワー</span></span>
          </div>
        </div>
      </div>

      <div className="mt-2">
        {userPosts.map((post) => (
          <div key={post.id} className="p-4 border-b hover:bg-gray-50 transition">
            <div className="flex gap-3">
              <img src={userProfile.photoURL || "https://abs.twimg.com/sticky/default_profile_images/default_profile_400x400.png"} className="w-12 h-12 rounded-full" />
              <div className="w-full">
                <div className="flex items-center gap-2">
                  <span className="font-bold">{userProfile.username}</span>
                  <span className="text-gray-500 text-sm">{post.createdAt?.toDate().toLocaleDateString()}</span>
                </div>
                <p className="mt-1 whitespace-pre-wrap">{post.text}</p>
                {post.image && <img src={post.image} className="mt-3 rounded-2xl max-h-80 w-full object-cover border" />}
              </div>
            </div>
          </div>
        ))}
      </div>

      {isEditOpen && <EditProfileModal userProfile={userProfile} onClose={() => setIsEditOpen(false)} />}
    </div>
  );
}