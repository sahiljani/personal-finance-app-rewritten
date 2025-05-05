
"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Plus, Upload, Home, BarChart3 } from "lucide-react"; // Use Home, BarChart3
import { Button } from "@/components/ui/button";
import { AddExpenseSheet } from "@/components/expense/add-expense-sheet";
import { UploadReceiptDrawer } from "@/components/expense/upload-receipt-drawer";
import { cn } from "@/lib/utils";

// Define navigation items (excluding central actions)
const navItems = [
  { href: "/", label: "Home", icon: Home }, // Use Home icon
  { href: "/reports", label: "Reports", icon: BarChart3 }, // Use BarChart3 icon
];

export function BottomNavigation() {
  const pathname = usePathname();
  const [isAddSheetOpen, setIsAddSheetOpen] = React.useState(false);
  const [isUploadDrawerOpen, setIsUploadDrawerOpen] = React.useState(false);

  return (
    <>
      {/* Navigation Bar - fixed at bottom, visible on mobile */}
      <nav className="fixed bottom-0 left-0 right-0 h-16 bg-background/95 backdrop-blur-sm border-t border-border flex items-center justify-around md:hidden z-40 shadow-[-2px_0px_10px_rgba(0,0,0,0.05)]">

        {/* Left Navigation Items (Home) */}
        <div className="flex flex-1 justify-center">
          {navItems.slice(0, 1).map((item) => {
             const isActive = pathname === item.href;
             return (
                 <Link href={item.href} key={item.href} passHref legacyBehavior>
                   <Button
                     variant="ghost"
                     size="sm"
                     className={cn(
                       "flex flex-col items-center justify-center h-full w-16 px-1 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-none transition-colors duration-200",
                       isActive && "text-primary font-medium" // Active state uses primary color
                     )}
                     aria-label={item.label}
                   >
                     <item.icon className={cn("w-5 h-5 mb-0.5 transition-transform", isActive && "scale-110")} />
                     <span className="text-xs">{item.label}</span>
                   </Button>
                 </Link>
             );
          })}
        </div>


         {/* Central Action Buttons (Add & Upload) - Raised/Highlighted */}
         <div className="flex justify-center items-center gap-3" style={{ flexBasis: '120px' }}> {/* Fixed basis for center */}
            {/* Add Button - Secondary Action Look */}
             <Button
                 variant="outline" // Less prominent than Upload
                 size="icon"
                 className="rounded-full w-12 h-12 flex items-center justify-center bg-card shadow-sm border hover:bg-muted focus-visible:ring-primary" // Use primary ring
                 aria-label="Add Manual Expense"
                 onClick={() => setIsAddSheetOpen(true)}
             >
                 <Plus className="w-5 h-5 text-primary" /> {/* Primary color icon */}
             </Button>

            {/* Upload Button - Primary Highlighted Action */}
            <Button
                variant="default" // Uses accent color (orange)
                size="icon"
                className="rounded-full w-14 h-14 flex items-center justify-center bg-accent text-accent-foreground shadow-lg hover:bg-accent/90 focus-visible:ring-ring" // Uses theme ring
                aria-label="Upload Receipt"
                onClick={() => setIsUploadDrawerOpen(true)}
            >
                <Upload className="w-6 h-6" />
            </Button>
         </div>


        {/* Right Navigation Items (Reports) */}
        <div className="flex flex-1 justify-center">
           {navItems.slice(1).map((item) => {
             const isActive = pathname === item.href;
             return (
                 <Link href={item.href} key={item.href} passHref legacyBehavior>
                   <Button
                     variant="ghost"
                     size="sm"
                     className={cn(
                       "flex flex-col items-center justify-center h-full w-16 px-1 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-none transition-colors duration-200",
                       isActive && "text-primary font-medium"
                     )}
                     aria-label={item.label}
                   >
                     <item.icon className={cn("w-5 h-5 mb-0.5 transition-transform", isActive && "scale-110")} />
                     <span className="text-xs">{item.label}</span>
                   </Button>
                 </Link>
             );
          })}
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
