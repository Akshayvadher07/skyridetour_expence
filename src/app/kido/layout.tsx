import type { Metadata } from "next";
import { Inter } from "next/font/google";

const inter = Inter({ subsets: ["latin"], variable: "--font-kido" });

export const metadata: Metadata = {
  title: "Kido AI — Intelligent Prompt Builder",
  description:
    "Build, save, and manage AI prompts with real-time token interpolation. Powered by Kido AI.",
};

export default function KidoRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className={`${inter.variable} font-[family-name:var(--font-kido)]`}>
      {children}
    </div>
  );
}
