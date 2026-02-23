import "~/styles/globals.css";

import { type Metadata } from "next";
import { Fraunces, Outfit } from "next/font/google";

export const metadata: Metadata = {
  title: "Beer Guesser — LLM Tasting Lab",
  description:
    "Test a fine-tuned LLM's ability to identify beer brands from bottle descriptions",
  icons: [{ rel: "icon", url: "/favicon.ico" }],
};

const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-fraunces",
  display: "swap",
});

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
  display: "swap",
});

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`dark ${fraunces.variable} ${outfit.variable}`}>
      <body>{children}</body>
    </html>
  );
}
