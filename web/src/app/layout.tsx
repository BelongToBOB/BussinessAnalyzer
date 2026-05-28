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

// Inline script to apply theme before paint (prevents flash)
const themeScript = `
(function(){
  try {
    var t = localStorage.getItem('theme');
    if (t === 'dark' || (!t && window.matchMedia('(prefers-color-scheme:dark)').matches)) {
      document.documentElement.setAttribute('data-theme','dark');
    } else if (t === 'auto') {
      if (window.matchMedia('(prefers-color-scheme:dark)').matches) {
        document.documentElement.setAttribute('data-theme','dark');
      }
    }
  } catch(e){}
})()
`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="th" className="h-full" suppressHydrationWarning>
      <head>
        <meta name="theme-color" content="#1D1D1F" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="min-h-full flex flex-col font-thai">
        <ToastProvider />
        {children}
      </body>
    </html>
  );
}
