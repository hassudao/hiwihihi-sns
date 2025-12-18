"use client";

import { useState } from "react";
import { auth, db } from "@/lib/firebase"; // 先ほど作った設定を読み込み
import { createUserWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { useRouter } from "next/navigation";

export default function RegisterPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState(""); // 表示名
  const [error, setError] = useState("");
  const router = useRouter();

  const handleRegister = async (e) => {
    e.preventDefault();
    try {
      // 1. Firebase Authでユーザー作成
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // 2. Firestoreにユーザーのプロフィール情報を保存
      await setDoc(doc(db, "users", user.uid), {
        uid: user.uid,
        username: username,
        email: email,
        createdAt: new Date(),
      });

      // 3. 成功したらホーム画面へ
      router.push("/home");
    } catch (err) {
      setError("登録に失敗しました: " + err.message);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-white text-black p-4">
      <div className="w-full max-w-sm">
        <h1 className="text-3xl font-bold mb-8 text-blue-500">アカウントを作成</h1>
        
        <form onSubmit={handleRegister} className="flex flex-col gap-4">
          <input
            type="text"
            placeholder="ユーザー名（表示名）"
            className="border p-3 rounded-md focus:outline-blue-500"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />
          <input
            type="email"
            placeholder="メールアドレス"
            className="border p-3 rounded-md focus:outline-blue-500"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <input
            type="password"
            placeholder="パスワード"
            className="border p-3 rounded-md focus:outline-blue-500"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          
          {error && <p className="text-red-500 text-sm">{error}</p>}

          <button
            type="submit"
            className="bg-blue-500 text-white font-bold p-3 rounded-full hover:bg-blue-600 transition"
          >
            登録する
          </button>
        </form>

        <p className="mt-6 text-center text-gray-600">
          既にアカウントをお持ちですか？ 
          <span className="text-blue-500 cursor-pointer ml-1" onClick={() => router.push("/login")}>
            ログイン
          </span>
        </p>
      </div>
    </div>
  );
}