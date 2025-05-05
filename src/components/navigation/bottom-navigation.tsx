
"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Plus, Upload, LayoutDashboard, BarChart, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AddExpenseSheet } from "@/components/expense/add-expense-sheet";
import { UploadReceiptDrawer } from "@/components/expense/upload-receipt-drawer";
import { cn } from "@/lib/utils";

// Define navigation items
const navItems = [
  { href: "/", label: "Home", icon: LayoutDashboard },
  { href: "/reports", label: "Reports", icon: BarChart },
  // Add/Upload are actions, not destinations, handled separately
  { href: "/settings", label: "Settings", icon: Settings },
];

export function BottomNavigation() {
  const pathname = usePathname();
  const [isAddSheetOpen, setIsAddSheetOpen] = React.useState(false);
  const [isUploadDrawerOpen, setIsUploadDrawerOpen] = React.useState(false);

  return (
    <>
       {/* Navigation Bar - fixed at bottom, visible on mobile */}
      <nav className="fixed bottom-0 left-0 right-0 h-16 bg-background/95 backdrop-blur-sm border-t border-border flex items-center justify-around md:hidden z-40 shadow-[-2px_0px_10px_rgba(0,0,0,0.1)]">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link href={item.href} key={item.href} passHref legacyBehavior>
              <Button
                variant="ghost"
                size="sm"
                className={cn(
                  "flex flex-col items-center justify-center h-full px-2 text-muted-foreground hover:text-accent hover:bg-accent/10 rounded-none transition-colors duration-200", // Added transition
                  isActive && "text-accent font-medium" // Active state uses accent color
                )}
                aria-label={item.label}
                // Add subtle scale animation on tap/click
                // style={{ transition: 'transform 0.1s ease-out' }}
                // onClickCapture={(e) => {
                //     const target = e.currentTarget;
                //     target.style.transform = 'scale(0.95)';
                //     setTimeout(() => target.style.transform = 'scale(1)', 100);
                // }}
              >
                <item.icon className={cn("w-5 h-5 mb-0.5 transition-transform", isActive && "scale-110")} /> {/* Icon animation */}
                <span className="text-xs">{item.label}</span>
              </Button>
            </Link>
          );
        })}

         {/* Action Buttons in the middle - slightly raised */}
         {/* Add Button */}
         <div className="absolute left-1/2 transform -translate-x-1/2 -top-6 flex gap-3">
             <Button
                variant="default" // Primary color
                size="icon" // Make it square/round
                className="rounded-2xl w-14 h-14 flex items-center justify-center shadow-md hover:bg-primary/90 focus-visible:ring-ring"
                aria-label="Add Manual Expense"
                onClick={() => setIsAddSheetOpen(true)}
                >
                <Plus className="w-6 h-6" />
            </Button>

            {/* Upload Button */}
            <Button
                variant="default" // Accent color
                size="icon"
                className="rounded-2xl w-14 h-14 flex items-center justify-center bg-accent text-accent-foreground shadow-md hover:bg-accent/90 focus-visible:ring-ring"
                aria-label="Upload Receipt"
                onClick={() => setIsUploadDrawerOpen(true)}
            >
                <Upload className="w-6 h-6" />
            </Button>
         </div>


      </nav>

      {/* Modals/Sheets/Drawers for Add/Upload actions */}
       <AddExpenseSheet
            open={isAddSheetOpen}
            onOpenChange={setIsAddSheetOpen}
            expenseToEdit={null} // Ensure it's Add mode
       />
      <UploadReceiptDrawer open={isUploadDrawerOpen} onOpenChange={setIsUploadDrawerOpen} />
    </>
  );
}
