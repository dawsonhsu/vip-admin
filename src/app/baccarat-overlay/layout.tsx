import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Baccarat Roadmap Overlay',
};

export default function BaccaratOverlayLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
