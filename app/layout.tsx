import type { Metadata } from "next";

import "@/app/globals.css";

export const metadata: Metadata = {
  title: "QueueBeat",
  description: "QR-powered music requests for bars, lounges and nightlife venues."
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru">
      <body>{children}</body>
    </html>
  );
}
