"use client";

import { useEffect, useState } from "react";
import { auth, db } from "@/lib/firebase";
import { doc, getDoc, collection, query, where, orderBy, onSnapshot, updateDoc, arrayUnion, arrayRemove } from "firebase/firestore";
import { useParams } from "next/navigation";
import { CalendarDays, Edit3, Loader2 } from "lucide-react";
import EditProfileModal from "@/components/EditProfileModal";

export default function ProfilePage() {
  const { id } = useParams();
  const [userProfile, setUserProfile] = useState(null);
  const [myProfile, setMyProfile] = useState(null);
  const [userPosts, setUserPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isEditOpen, setIsEditOpen] = useState(false);

  useEffect(() => {
    const unsubscribeAuth = auth.onAuthStateChanged(async (user) => {
      let targetUid = id === "me" ? user?.uid : id;
      if (!targetUid) return;

      // 1. 自分のプロフィールを取得（フォロー状態の確認用）
      if (user) {
        const myDoc = await getDoc(doc(db, "users", user.uid));
        setMyProfile(myDoc.data());
      }

      // 2. 表示対象のユーザー情報を取得
      const userDoc = await getDoc(doc(db, "users", targetUid));
      if (userDoc.exists()) {
        setUserProfile({ id: userDoc.id, ...userDoc.data() });
      }

      // 3. 投稿一覧を取得
      const q = query(collection(db, "posts"), where("uid", "==", targetUid), orderBy("createdAt", "desc"));
      const unsubscribePosts = onSnapshot(q, (snapshot) => {
        setUserPosts(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
        setLoading(false);
      });

      return () => unsubscribePosts();
    });

    return () => unsubscribeAuth();
  }, [id]);

  // フォロー/フォロー解除処理
  const handleFollow = async () => {
    if (!auth.currentUser || !userProfile) return;
    const myUid = auth.currentUser.uid;
    const targetUid = userProfile.id;
    const isFollowing = myProfile?.following?.includes(targetUid);

    const myRef = doc(db, "users", myUid);
    const targetRef = doc(db, "users", targetUid);

    try {
      if (isFollowing) {
        // フォロー解除
        await updateDoc(myRef, { following: arrayRemove(targetUid) });
        await updateDoc(targetRef, { followers: arrayRemove(myUid) });
      } else {
        // フォロー
        await updateDoc(myRef, { following: arrayUnion(targetUid) });
        await updateDoc(targetRef, { followers: arrayUnion(myUid) });
      }
      // 画面上の状態を即時更新するためにリロード（本来はstate管理が理想）
      window.location.reload();
    } catch (error) {
      console.error("Follow error:", error);
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
            
            {isMe ? (
              <button onClick={() => setIsEditOpen(true)} className="border border-gray-300 font-bold px-4 py-2 rounded-full hover:bg-gray-100 transition mb-2">
                プロフィールを編集
              </button>
            ) : (
              <button 
                onClick={handleFollow}
                className={`font-bold px-6 py-2 rounded-full transition mb-2 ${isFollowing ? "border border-gray-300 hover:bg-red-50 hover:text-red-500 hover:border-red-200" : "bg-black text-white hover:bg-gray-800"}`}
              >
                {isFollowing ? "フォロー中" : "フォローする"}
              </button>
            )}
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