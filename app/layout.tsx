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

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja" suppressHydrationWarning>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased bg-white dark:bg-black transition-colors`}>
        <Providers>
          {/* FlexコンテナでSidebarとMainを横並びにする */}
          <div className="flex flex-col sm:flex-row min-h-screen">
            <Sidebar />
            
            {/* メインコンテンツエリア */}
            {/* mx-autoでPC時に中央に寄せ、max-wでX（旧Twitter）風の幅に制限 */}
            <main className="flex-1 w-full max-w-2xl border-x border-gray-100 dark:border-gray-800 
                             pt-14 sm:pt-0 pb-16 sm:pb-0 min-h-screen">
              {children}
            </main>
          </div>
        </Providers>
      </body>
    </html>
  );
}