import type { Metadata } from "next";

import "@/app/globals.css";

export const metadata: Metadata = {
  title: "QueueBeat",
  description: "Музыкальные заявки по QR-коду для баров, лаунжей и ночных заведений."
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
