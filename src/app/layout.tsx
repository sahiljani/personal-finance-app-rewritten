import type { Metadata } from "next";
import { Inter } from "next/font/google"; // Using Inter as a clean sans-serif alternative
import "./globals.css";
import { BottomNavigation } from "@/components/navigation/bottom-navigation";
import { Toaster } from "@/components/ui/toaster";
import { AppProviders } from "@/components/providers/app-providers";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: "Expense Tracker Pro",
  description: "Track your expenses efficiently.",
  // Add viewport meta tag for mobile responsiveness
  viewport: "width=device-width, initial-scale=1, maximum-scale=1",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      {/* Add dark class here if using CSS-based dark mode, or handle with ThemeProvider */}
      <body className={`${inter.variable} font-sans antialiased flex flex-col min-h-screen`}>
        <AppProviders>
           {/* Increased padding-bottom for taller nav bar (h-20 = pb-20 approx) */}
          <main className="flex-grow pb-24 md:pb-0">
            {children}
          </main>
          <BottomNavigation />
          <Toaster />
        </AppProviders>
      </body>
    </html>
  );
}
