import type { Metadata } from "next";
import { Playfair_Display, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import Providers from "@/components/shared/Providers";
import { Toaster } from "sonner";

const playfair = Playfair_Display({
  variable: "--font-serif",
  subsets: ["latin"],
  display: "swap",
});

const jakarta = Plus_Jakarta_Sans({
  variable: "--font-sans",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "SkyRideTour | Travel Management",
    template: "%s | SkyRideTour",
  },
  description:
    "Complete travel and car rental management system for SkyRideTour — track trips, expenses, drivers, vehicles, and profitability.",
  keywords: ["travel management", "car rental", "trip booking", "tour operator", "India"],
  authors: [{ name: "SkyRideTour" }],
  robots: "noindex, nofollow", // private business app
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${playfair.variable} ${jakarta.variable} antialiased font-sans`}
      >
        <Providers>
          {children}
          <Toaster
            position="top-right"
            richColors
            closeButton
            toastOptions={{
              duration: 4000,
              style: {
                fontFamily: "var(--font-sans)",
              },
            }}
          />
        </Providers>
      </body>
    </html>
  );
}
