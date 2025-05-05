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
  viewport: "width=device-width, initial-scale=1, maximum-scale=1",
  // Basic PWA meta tags (more needed for full functionality like manifest, service worker)
  manifest: "/manifest.json", // Example: You'd need to create this file
  themeColor: "#ffffff", // Example theme color
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

           {/* Adjust padding: Keep bottom padding for mobile nav, remove for desktop */}
           {/* Add top padding if using a fixed header */}
          <main className="flex-grow pb-24 pt-6 md:pb-6"> {/* Added pt-6 for general spacing */}
            {children}
          </main>
          {/* Bottom navigation is only for mobile */}
          <BottomNavigation />
          <Toaster />
        </AppProviders>
      </body>
    </html>
  );
}
