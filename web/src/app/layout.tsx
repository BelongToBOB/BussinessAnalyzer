import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "WinWin Analyzer — Owner Dashboard",
  description: "เห็นธุรกิจชัด ใน 5 นาทีต่อเดือน",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="th" className="h-full" suppressHydrationWarning>
      <body className="min-h-full flex flex-col font-thai">{children}</body>
    </html>
  );
}
