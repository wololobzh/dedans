import type { ReactNode } from 'react';
import './globals.css';

export const metadata = {
  title: 'School ERP',
  description: "ERP de gestion d'école",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="fr">
      <body>{children}</body>
    </html>
  );
}
