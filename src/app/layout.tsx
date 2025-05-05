import type { Metadata } from "next";
import { Inter } from "next/font/google"; // Using Inter as a clean sans-serif alternative
import "./globals.css";
import { BottomNavigation } from "@/components/navigation/bottom-navigation";
import { Toaster } from "@/components/ui/toaster";
import { AppProviders } from "@/components/providers/app-providers";
// Import Desktop Header (Optional, depending on implementation)
// import { Header } from "@/components/navigation/header";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: "Expense Tracker Pro",
  description: "Track your expenses efficiently.",
  // Add viewport meta tag for mobile responsiveness
  viewport: "width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no", // Added user-scalable=no for more app-like feel
  // Basic PWA meta tags (more needed for full functionality like manifest, service worker)
  manifest: "/manifest.json", // Example: You'd need to create this file
  themeColor: "#008080", // Match accent color (Teal)
  appleMobileWebAppCapable: "yes",
  appleMobileWebAppStatusBarStyle: "default",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      {/* Add dark class here if using CSS-based dark mode, or handle with ThemeProvider */}
      <body className={`${inter.variable} font-sans antialiased flex flex-col min-h-screen bg-background`}>
        <AppProviders>
           {/* Optional: Add a Desktop Header here */}
           {/* <Header /> */}

           {/* Adjust padding: Use pb-20 for bottom nav height, remove md:pb-6 */}
           {/* Add top padding if using a fixed header */}
          <main className="flex-grow pt-6 pb-20"> {/* Adjusted padding for bottom nav */}
            {children}
          </main>
          {/* Bottom navigation is primarily for mobile, but could be adapted */}
          <BottomNavigation />
          <Toaster />
        </AppProviders>
      </body>
    </html>
  );
}
