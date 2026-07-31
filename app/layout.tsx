import type { Metadata, Viewport } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import { NavBar } from "@/components/NavBar";
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

        {/* Apply the saved finger-zone palette, per-finger custom colors and
            language before paint (see PaletteSwitcher and lib/locale) */}
        <script
          dangerouslySetInnerHTML={{
            __html: `try{var p=localStorage.getItem("tz-fz-palette");if(p&&p!=="classic")document.documentElement.setAttribute("data-fz",p);var c=localStorage.getItem("tz-fz-custom-v1");if(c){var o=JSON.parse(c);for(var k in o)document.documentElement.style.setProperty("--fz-"+k,o[k])}var l=localStorage.getItem("tz-locale");if(l==="uz"||l==="ru")document.documentElement.lang=l}catch(e){}`,
          }}
        />

        <NavBar />

        {/* Master Canvas Wrapper */}
        <div id="workspace-canvas" className="flex-1 flex flex-col min-h-0 relative">
          {children}
        </div>

      </body>
    </html>
  );
}