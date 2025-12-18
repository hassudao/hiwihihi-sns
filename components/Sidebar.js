import Link from "next/link";
import { Home, Search, Bell, Mail, User, Settings, LogOut } from "lucide-react";
import { auth } from "@/lib/firebase";
import { signOut } from "firebase/auth";
import { useRouter } from "next/navigation";

export default function Sidebar() {
  const router = useRouter();

  const handleLogout = async () => {
    await signOut(auth);
    router.push("/login");
  };

  return (
    <div className="flex flex-col justify-between h-screen p-4 border-r border-gray-200 w-20 md:w-64 fixed bg-white">
      <div className="flex flex-col gap-4">
        <h1 className="text-2xl font-bold text-blue-500 mb-4 px-2">X-Clone</h1>
        
        <SidebarItem icon={<Home />} label="ホーム" href="/home" />
        <SidebarItem icon={<Search />} label="話題を検索" href="/search" />
        <SidebarItem icon={<Bell />} label="通知" href="/notifications" />
        <SidebarItem icon={<Mail />} label="メッセージ" href="/messages" />
        <SidebarItem icon={<User />} label="プロフィール" href="/profile/me" />
        <SidebarItem icon={<Settings />} label="設定" href="/settings" />
      </div>

      <button 
        onClick={handleLogout}
        className="flex items-center gap-4 p-3 hover:bg-gray-100 rounded-full text-red-500 transition"
      >
        <LogOut />
        <span className="hidden md:inline font-bold">ログアウト</span>
      </button>
    </div>
  );
}

function SidebarItem({ icon, label, href }) {
  return (
    <Link href={href} className="flex items-center gap-4 p-3 hover:bg-gray-100 rounded-full transition text-xl">
      {icon}
      <span className="hidden md:inline">{label}</span>
    </Link>
  );
}