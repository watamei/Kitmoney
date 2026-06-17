import type { Metadata } from "next";
import { Outfit, Prompt } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/ThemeProvider";
import { LanguageProvider } from "@/components/LanguageProvider";
import AppShell from "@/components/AppShell";

// Outfit for numbers/English, Prompt for Thai
const outfit = Outfit({ subsets: ["latin"], variable: "--font-outfit" });
const prompt = Prompt({ weight: ['300', '400', '500', '600'], subsets: ["thai"], variable: "--font-prompt" });

export const metadata: Metadata = {
  title: "KidYa - Luxury Pharmacy POS",
  description: "Modern & Minimalist POS for Pharmacy",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="th" suppressHydrationWarning className={`${outfit.variable} ${prompt.variable}`}>
      <body suppressHydrationWarning>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <LanguageProvider>
            <AppShell>
              {children}
            </AppShell>
          </LanguageProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
