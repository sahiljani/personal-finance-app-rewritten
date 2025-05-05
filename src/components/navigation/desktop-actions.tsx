// src/components/navigation/desktop-actions.tsx
"use client";

import * as React from "react";
import { Plus, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AddExpenseSheet } from "@/components/expense/add-expense-sheet";
import { UploadReceiptDrawer } from "@/components/expense/upload-receipt-drawer";

export function DesktopActions() {
  const [isAddSheetOpen, setIsAddSheetOpen] = React.useState(false);
  const [isUploadDrawerOpen, setIsUploadDrawerOpen] = React.useState(false);

  return (
    <>
      {/* These buttons are hidden on small screens (mobile), visible on medium and up (desktop) */}
      <div className="hidden md:flex items-center gap-3">
         {/* Add Button - Uses primary color (purple) */}
         <Button
            variant="default"
            onClick={() => setIsAddSheetOpen(true)}
            aria-label="Add Manual Expense"
            size="sm"
         >
            <Plus className="mr-2 h-4 w-4" />
            Add Expense
         </Button>

         {/* Upload Button - Uses accent style (e.g., outline or secondary) on Desktop */}
         <Button
            // Use outline or secondary for less emphasis than primary Add on desktop
            // variant="outline"
            // Or use accent color directly if desired
             style={{ backgroundColor: 'hsl(var(--accent))', color: 'hsl(var(--accent-foreground))' }}
             className="hover:bg-accent/90" // Add hover effect manually if needed
            onClick={() => setIsUploadDrawerOpen(true)}
            aria-label="Upload Receipt"
            size="sm"
         >
           <Upload className="mr-2 h-4 w-4" />
           Upload Receipt
         </Button>
      </div>

       {/* Render Modals/Sheets/Drawers - These are controlled by the state above */}
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
