import type { Metadata } from "next";

import "./globals.css";

export const metadata: Metadata = {
  title: "PassDrive",
  description: "English-first study app for the Japanese driver's license written test."
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
