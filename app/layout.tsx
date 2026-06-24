import type { Metadata, Viewport } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import { TopBar } from "@/components/navigation/TopBar";
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
    >
      <body className="min-h-screen flex flex-col bg-[#FAFAFA] text-neutral-950 antialiased selection:bg-neutral-950 selection:text-white font-sans">
        
        {/* Smart Navigation Bar (Self-unmounts in Arena) */}
        <TopBar />

        {/* Master Canvas Wrapper */}
        <div id="workspace-canvas" className="flex-1 flex flex-col min-h-0 relative">
          {children}
        </div>

      </body>
    </html>
  );
}