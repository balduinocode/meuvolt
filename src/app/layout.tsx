import type { Metadata, Viewport } from "next";
import "./globals.css";
import { VisualEditsMessenger } from "orchids-visual-edits";
import Script from "next/script";

export const metadata: Metadata = {
  title: "Eletricista - Orcamentos",
  description: "App de orcamentos para eletricistas. Gere orcamentos profissionais em 60 segundos.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Eletricista",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#FFFFFF" },
    { media: "(prefers-color-scheme: dark)", color: "#0F1419" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <head>
        <link rel="apple-touch-icon" href="/icon-192.png" />
      </head>
      <body className="antialiased">
        <Script
          id="orchids-browser-logs"
          src="https://slelguoygbfzlpylpxfs.supabase.co/storage/v1/object/public/scripts/orchids-browser-logs.js"
          strategy="afterInteractive"
          data-orchids-project-id="4d75d561-b9fe-4988-b748-33e3347def9c"
        />
        {children}
        <VisualEditsMessenger />
      </body>
    </html>
  );
}
