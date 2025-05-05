"use client";

import { Plus, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AddExpenseSheet } from "@/components/expense/add-expense-sheet";
import { UploadReceiptDrawer } from "@/components/expense/upload-receipt-drawer";
import * as React from "react";

export function BottomNavigation() {
  const [isAddSheetOpen, setIsAddSheetOpen] = React.useState(false);
  const [isUploadDrawerOpen, setIsUploadDrawerOpen] = React.useState(false);

  return (
    <>
      <nav className="fixed bottom-0 left-0 right-0 h-20 bg-background/80 backdrop-blur-sm border-t border-border flex items-center justify-center gap-8 md:hidden z-40 px-4">
        {/* Add Button - Updated Styling */}
         <Button
          variant="default" // Uses primary color from theme
          size="lg" // Adjust size if needed
          className="rounded-full w-16 h-16 flex items-center justify-center shadow-md hover:bg-primary/90 focus-visible:ring-ring" // Use theme ring color
          aria-label="Add Manual Expense"
          onClick={() => setIsAddSheetOpen(true)}
        >
          <Plus className="w-7 h-7" /> {/* Slightly smaller icon for better padding */}
        </Button>

        {/* Upload Button - Updated Styling */}
        <Button
          variant="default" // Use accent color from theme
          size="lg" // Adjust size if needed
           className="rounded-full w-16 h-16 flex items-center justify-center bg-accent text-accent-foreground shadow-md hover:bg-accent/90 focus-visible:ring-ring" // Use theme ring color
          aria-label="Upload Receipt"
          onClick={() => setIsUploadDrawerOpen(true)}
        >
          <Upload className="w-7 h-7" /> {/* Slightly smaller icon */}
        </Button>
      </nav>

      {/* Render Modals/Sheets/Drawers */}
      {/* Pass null initially for expenseToEdit to ensure AddExpenseForm resets correctly */}
       <AddExpenseSheet
            open={isAddSheetOpen}
            onOpenChange={setIsAddSheetOpen}
            expenseToEdit={null} // Explicitly pass null when adding
       />
      <UploadReceiptDrawer open={isUploadDrawerOpen} onOpenChange={setIsUploadDrawerOpen} />
    </>
  );
}
