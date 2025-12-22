"use client";

import { useState } from "react";
import { db } from "@/lib/firebase";
import { collection, query, where, getDocs, limit } from "firebase/firestore";
import { Search, Loader2 } from "lucide-react";
import Link from "next/link";

export default function SearchPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchTerm.trim()) return;

    setLoading(true);
    try {
      const q = query(
        collection(db, "users"),
        where("username", ">=", searchTerm),
        where("username", "<=", searchTerm + "\uf8ff"),
        limit(10)
      );

      const querySnapshot = await getDocs(q);
      const users = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setResults(users);
    } catch (error) {
      console.error("検索エラー:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white dark:bg-black transition-colors">
      {/* 検索バーヘッダー */}
      <div className="sticky top-0 bg-white/80 dark:bg-black/80 backdrop-blur-md p-4 border-b border-gray-200 dark:border-gray-800 z-10">
        <form onSubmit={handleSearch} className="relative">
          <Search className="absolute left-3 top-3 text-gray-400 dark:text-gray-500" size={20} />
          <input
            type="text"
            placeholder="ユーザーを検索"
            className="w-full bg-gray-100 dark:bg-gray-900 border-none rounded-full py-2.5 pl-12 pr-4 focus:ring-2 focus:ring-blue-500 outline-none dark:text-white dark:placeholder-gray-500 transition"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </form>
      </div>

      {/* 検索結果一覧 */}
      <div className="flex flex-col">
        {loading ? (
          <div className="flex justify-center p-10">
            <Loader2 className="animate-spin text-blue-500" size={32} />
          </div>
        ) : results.length > 0 ? (
          results.map((user) => (
            <Link 
              href={`/profile/${user.id}`} 
              key={user.id}
              className="flex items-center gap-3 p-4 hover:bg-gray-50 dark:hover:bg-gray-900 transition border-b border-gray-100 dark:border-gray-800"
            >
              <img 
                src={user.photoURL || "https://abs.twimg.com/sticky/default_profile_images/default_profile_400x400.png"} 
                className="w-12 h-12 rounded-full object-cover bg-gray-200 dark:bg-gray-700"
              />
              <div className="flex flex-col">
                <span className="font-bold dark:text-white hover:underline">{user.username}</span>
                <span className="text-gray-500 text-sm">@{user.email?.split('@')[0]}</span>
              </div>
            </Link>
          ))
        ) : (
          searchTerm && !loading && (
            <p className="p-10 text-center text-gray-500 dark:text-gray-400">ユーザーが見つかりませんでした</p>
          )
        )}
      </div>
    </div>
  );
}