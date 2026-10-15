import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Vinca Event Organizer | ERP',
  description: 'Event operations and financial management workspace for Vinca Event Organizer',
  icons: { icon: '/favicon.png', apple: '/favicon.png' },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="id"><body>{children}</body></html>;
}
