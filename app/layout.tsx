import type { Metadata, Viewport } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import Link from "next/link";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "tez/yozish — High-Frequency Touch Typing",
  description: "A zero-latency touch typing workspace engineered on tactile muscle-memory pedagogy.",
  keywords: ["touch typing", "keyboard practice", "typing speed", "WPM", "JetBrains Mono"],
};

export const viewport: Viewport = {
  themeColor: "#FAFAFA",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${jetbrainsMono.variable} scroll-smooth`}
      suppressHydrationWarning
      data-scroll-behavior="smooth"
    >
      <body className="min-h-screen flex flex-col bg-[#FAFAFA] text-neutral-950 antialiased selection:bg-neutral-950 selection:text-white font-sans">
        
        {/* Simple Notion-style Navigation Bar */}
        <header className="sticky top-0 z-40 w-full bg-[#FAFAFA]/90 backdrop-blur-md border-b border-neutral-200/50 select-none">
          <div className="max-w-6xl mx-auto h-14 px-4 sm:px-6 flex items-center justify-between relative">
            {/* Left: Brand */}
            <div className="flex items-center z-10">
              <Link href="/" className="flex items-center gap-2 group cursor-pointer">
                <span className="font-mono text-[11px] bg-neutral-950 text-white font-bold px-1.5 py-0.5 rounded tracking-tighter group-hover:bg-neutral-800 transition-colors shadow-sm">
                  TY
                </span>
                <span className="font-semibold tracking-tight text-sm text-neutral-950">
                  tez<span className="text-neutral-400 font-light">/</span>yozish
                </span>
              </Link>
            </div>
            
            {/* Center: Navigation Links */}
            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center gap-8 text-[15px] font-medium text-neutral-500 z-0">
              <Link href="/courses" className="hover:text-neutral-950 transition-colors">Courses</Link>
              <Link href="/games" className="hover:text-neutral-950 transition-colors">Games</Link>
            </div>

            {/* Right: Auth Actions */}
            <div className="flex items-center gap-2 sm:gap-3">
              <Link href="#" className="text-[13px] font-medium text-neutral-600 hover:text-neutral-950 px-3 py-1.5 rounded-md transition-colors hover:bg-neutral-100">
                Log in
              </Link>
              <Link href="#" className="text-[13px] font-medium bg-neutral-950 text-white hover:bg-neutral-800 px-4 py-1.5 rounded-md transition-colors shadow-sm active:scale-95">
                Sign up
              </Link>
            </div>
          </div>
        </header>

        {/* Master Canvas Wrapper */}
        <div id="workspace-canvas" className="flex-1 flex flex-col min-h-0 relative">
          {children}
        </div>

      </body>
    </html>
  );
}