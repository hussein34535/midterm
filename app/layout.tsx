import type { Metadata } from "next";
import { Cairo } from "next/font/google"; // Using Cairo for better Arabic support
import "./globals.css";

const cairo = Cairo({
  variable: "--font-sans", // Mapping Cairo to --font-sans to match the new globals.css
  subsets: ["arabic", "latin"],
  weight: ["400", "500", "600", "700", "800"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "سكينة | منصة الدعم النفسي",
  description: "مساحة آمنة للدعم النفسي الجماعي",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ar" dir="rtl">
      <body className={`${cairo.variable} font-sans antialiased bg-background text-foreground`}>
        {children}
      </body>
    </html>
  );
}

