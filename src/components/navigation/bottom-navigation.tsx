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
      <nav className="fixed bottom-0 left-0 right-0 h-16 bg-background border-t border-border flex items-center justify-center gap-8 md:hidden z-40">
        {/* Add Button */}
         <Button
          variant="default"
          size="lg"
          className="rounded-full w-16 h-16 flex items-center justify-center bg-primary text-primary-foreground shadow-lg hover:bg-primary/90 focus-visible:ring-accent"
          aria-label="Add Manual Expense"
          onClick={() => setIsAddSheetOpen(true)}
        >
          <Plus className="w-8 h-8" />
        </Button>

        {/* Upload Button */}
        <Button
          variant="default"
           size="lg"
           className="rounded-full w-16 h-16 flex items-center justify-center bg-accent text-accent-foreground shadow-lg hover:bg-accent/90 focus-visible:ring-primary"
          aria-label="Upload Receipt"
          onClick={() => setIsUploadDrawerOpen(true)}
        >
          <Upload className="w-8 h-8" />
        </Button>
      </nav>

      {/* Render Modals/Sheets/Drawers */}
      <AddExpenseSheet open={isAddSheetOpen} onOpenChange={setIsAddSheetOpen} />
      <UploadReceiptDrawer open={isUploadDrawerOpen} onOpenChange={setIsUploadDrawerOpen} />
    </>
  );
}
