import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Solar Operations Intelligence',
  description: 'Monitor, analyze, and optimize your solar energy portfolio with AI-powered insights.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
