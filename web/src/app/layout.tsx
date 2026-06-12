import type { Metadata } from "next";
import "./globals.css";
import { ToastProvider } from '@/components/ui/toast-provider';

export const metadata: Metadata = {
  title: "WinWin Analyzer — Owner Dashboard",
  description: "เห็นธุรกิจชัด ใน 5 นาทีต่อเดือน | เครื่องมือวิเคราะห์การเงินธุรกิจสำหรับเจ้าของ SME",
  icons: { icon: '/favicon.png', apple: '/logo-128.png' },
  manifest: '/manifest.json',
  openGraph: {
    title: 'WinWin Analyzer',
    description: 'เห็นธุรกิจชัด ใน 5 นาทีต่อเดือน',
    type: 'website',
    siteName: 'WinWin Analyzer',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="th" className="h-full">
      <head>
        <meta name="theme-color" content="#1D1D1F" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
      </head>
      <body className="min-h-full flex flex-col font-thai">
        <ToastProvider />
        {children}
      </body>
    </html>
  );
}
