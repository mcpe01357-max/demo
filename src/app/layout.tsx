import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "CRYPTX — The Encryption & Decoding Challenge",
  description: "Decode hidden messages, identify patterns, apply cryptographic rules, and compete against other teams in this cybersecurity challenge.",
  keywords: "cryptography, encryption, decoding, cipher, competition, college, cybersecurity",
  openGraph: {
    title: "CRYPTX — The Encryption & Decoding Challenge",
    description: "Encrypt. Decode. Think Beyond.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        {children}
      </body>
    </html>
  );
}
