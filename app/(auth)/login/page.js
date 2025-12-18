"use client";

import { useState } from "react";
import { auth } from "@/lib/firebase";
import { signInWithEmailAndPassword } from "firebase/auth";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const router = useRouter();

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      await signInWithEmailAndPassword(auth, email, password);
      router.push("/home"); // ログイン成功でホームへ
    } catch (err) {
      setError("ログインに失敗しました。メールアドレスかパスワードが違います。");
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-white p-4">
      <div className="w-full max-w-sm">
        <h1 className="text-3xl font-bold mb-8 text-blue-500">ログイン</h1>
        
        <form onSubmit={handleLogin} className="flex flex-col gap-4">
          <input
            type="email"
            placeholder="メールアドレス"
            className="border p-3 rounded-md"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <input
            type="password"
            placeholder="パスワード"
            className="border p-3 rounded-md"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          
          {error && <p className="text-red-500 text-sm">{error}</p>}

          <button type="submit" className="bg-blue-500 text-white font-bold p-3 rounded-full">
            ログイン
          </button>
        </form>

        <p className="mt-6 text-center text-gray-600">
          アカウントをお持ちでないですか？ 
          <span className="text-blue-500 cursor-pointer ml-1" onClick={() => router.push("/register")}>
            登録する
          </span>
        </p>
      </div>
    </div>
  );
}