import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Filbet Admin - VIP Management',
  description: 'VIP Management Admin Dashboard',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-TW">
      <body style={{ margin: 0, padding: 0 }}>{children}</body>
    </html>
  );
}
