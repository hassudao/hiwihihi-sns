"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";
import Sidebar from "@/components/Sidebar";
import PostList from "@/components/PostList"; // 既存のコンポーネントを再利用
import { ArrowLeft, Loader2 } from "lucide-react";

export default function PostDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPost = async () => {
      const docRef = doc(db, "posts", id);
      const snap = await getDoc(docRef);
      if (snap.exists()) {
        setPost({ id: snap.id, ...snap.data() });
      }
      setLoading(false);
    };
    fetchPost();
  }, [id]);

  if (loading) return <div className="flex justify-center p-10"><Loader2 className="animate-spin" /></div>;
  if (!post) return <div className="p-10 text-center dark:text-white">投稿が見つかりませんでした</div>;

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 ml-20 md:ml-64 border-x border-gray-100 dark:border-gray-800 max-w-2xl">
        <div className="sticky top-0 bg-white/80 dark:bg-black/80 backdrop-blur-md p-4 border-b flex items-center gap-4 z-10">
          <button onClick={() => router.back()} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-900 rounded-full transition">
            <ArrowLeft className="dark:text-white" />
          </button>
          <h1 className="text-xl font-bold dark:text-white">ポスト</h1>
        </div>
        
        {/* PostListのロジックを流用するか、ここに直接1件分の表示を書きます */}
        <div className="animate-in fade-in duration-500">
           {/* 簡易的にPostListを表示。postIdを指定して1件だけ出すようにPostListを改造すると楽です */}
           <PostList singlePostId={id} />
        </div>
      </main>
    </div>
  );
}