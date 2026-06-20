import type { Metadata, Viewport } from "next";
import "./globals.css";

const themeScript = `(function(){try{var k="domytasks-theme";var s=localStorage.getItem(k);var t=s==="dark"||s==="light"?s:(window.matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light");var d=document.documentElement;d.dataset.theme=t;d.style.colorScheme=t;}catch(e){}})();`;

export const metadata: Metadata = {
  title: "DoMyTasks",
  description: "Agent-first task tracker",
  manifest: "/manifest.json",
  icons: {
    icon: [
      { url: "/domytasks-reminders.svg", type: "image/svg+xml" },
      { url: "/favicon.ico", sizes: "256x256", type: "image/x-icon" },
      { url: "/domytasks-icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/domytasks-icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [
      { url: "/domytasks-icon-180.png", sizes: "180x180", type: "image/png" },
    ],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f5f5f7" },
    { media: "(prefers-color-scheme: dark)", color: "#101112" },
  ],
  colorScheme: "light dark",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" data-theme="light" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="antialiased">{children}</body>
    </html>
  );
}
