import type { Metadata } from "next";
import { Caveat, Great_Vibes, Sora } from "next/font/google";
import "./globals.css";

const sora = Sora({
  variable: "--font-sora",
  subsets: ["latin"],
});

const caveat = Caveat({
  variable: "--font-caveat",
  subsets: ["latin"],
});

const greatVibes = Great_Vibes({
  variable: "--font-wallcal",
  weight: "400",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Interactive Wall Calendar",
  description:
    "A creative, responsive wall-calendar inspired by a physical desk calendar with date range selection and notes.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${sora.variable} ${caveat.variable} ${greatVibes.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
