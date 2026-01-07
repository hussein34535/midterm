import type { Metadata } from "next";
import { Cairo } from "next/font/google"; // Using Cairo for better Arabic support
import "./globals.css";
import GlobalChat from "@/components/chat/GlobalChat";
import MobileBottomNav from "@/components/layout/MobileBottomNav";
import { Toaster } from "@/components/ui/sonner";
import SessionChecker from "@/components/auth/SessionChecker";
import MaintenanceChecker from "@/components/layout/MaintenanceChecker";

const cairo = Cairo({
  variable: "--font-sans", // Mapping Cairo to --font-sans to match the new globals.css
  subsets: ["arabic", "latin"],
  weight: ["400", "500", "600", "700", "800"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "إيواء | منصة الدعم والإرشاد",
  description: "مساحة آمنة للدعم النفسي والتطوير الذاتي مع أخصائيين متميزين",
  icons: {
    icon: [
      { url: "/logo.png", type: "image/png" },
    ],
    shortcut: "/logo.png",
    apple: "/logo.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ar" dir="rtl" suppressHydrationWarning>
      <body className={`${cairo.variable} font-sans antialiased bg-background text-foreground`} suppressHydrationWarning>
        {children}
        <MobileBottomNav />
        <GlobalChat />
        <SessionChecker />
        <MaintenanceChecker />
        <Toaster />
      </body>
    </html>
  );
}
