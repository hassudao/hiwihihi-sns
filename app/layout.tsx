import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/Providers";
import Sidebar from "@/components/Sidebar"; // 追加を確認

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "ﾋｳｨｯﾋﾋｰ",
  description: "進化し続けるSNSっぽいもの",
};

// ... (import部分はそのまま)

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja" suppressHydrationWarning>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased bg-white dark:bg-black`}>
        <Providers>
          {/* この flex 構造が Sidebar とコンテンツを横に並べます */}
          <div className="flex flex-col sm:flex-row min-h-screen">
            <Sidebar /> {/* ここで1回だけ呼ぶ */}
            
            {/* メインコンテンツ */}
            <main className="flex-1 w-full max-w-2xl border-x border-gray-100 dark:border-gray-800 pt-14 sm:pt-0 pb-16 sm:pb-0">
              {children}
            </main>
          </div>
        </Providers>
      </body>
    </html>
  );
}