"use client";

import * as React from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  // SheetFooter, // Removed as form handles buttons
} from "@/components/ui/sheet";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
 // DialogFooter, // Removed as form handles buttons
} from "@/components/ui/dialog";
import { AddExpenseForm } from "@/components/expense/add-expense-form";
import { getCategories } from "@/lib/actions";
import type { Category, Expense } from "@/lib/types";
import { useIsMobile } from "@/hooks/use-mobile"; // Assuming you have this hook
import { Skeleton } from "@/components/ui/skeleton";
import { Loader2 } from "lucide-react";

type AddExpenseSheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  expenseToEdit: Expense | null; // Use null explicitly for adding
};

export function AddExpenseSheet({ open, onOpenChange, expenseToEdit }: AddExpenseSheetProps) {
  const [categories, setCategories] = React.useState<Category[]>([]);
  const [isLoadingCategories, setIsLoadingCategories] = React.useState(true);
   const isMobile = useIsMobile(); // Hook to check screen size
   const isEditMode = !!expenseToEdit; // Determine mode based on prop

  React.useEffect(() => {
    async function fetchCategories() {
      setIsLoadingCategories(true);
      try {
        const fetchedCategories = await getCategories();
        setCategories(fetchedCategories);
      } catch (error) {
        console.error("Failed to fetch categories:", error);
        // Optionally show a toast error
      } finally {
        setIsLoadingCategories(false);
      }
    }
    if (open) { // Fetch categories only when the sheet/dialog is opened
        fetchCategories();
    }
  }, [open]);

  const handleSave = (savedExpense: Expense) => {
      // Optionally trigger a refetch or update global state if needed
    onOpenChange(false); // Close the sheet/dialog on save
  };

  const handleCancel = () => {
    onOpenChange(false); // Close the sheet/dialog on cancel
  };

 const title = isEditMode ? "Edit Expense" : "Add New Expense";
 const description = isEditMode ? "Update the details of your expense." : "Enter the details for your new expense.";


  // Render Dialog on Desktop, Sheet on Mobile
   if (isMobile === undefined) return null; // Avoid rendering mismatch during hydration

  const Content = (
     <>
        {/* Render header based on context (Dialog or Sheet) */}
        {isMobile ? (
             <SheetHeader className="mb-4"> {/* Add margin-bottom */}
                <SheetTitle>{title}</SheetTitle>
                <SheetDescription>{description}</SheetDescription>
            </SheetHeader>
        ) : (
            <DialogHeader className="mb-4"> {/* Add margin-bottom */}
                <DialogTitle>{title}</DialogTitle>
                <DialogDescription>{description}</DialogDescription>
            </DialogHeader>
        )}


        {isLoadingCategories ? (
            <div className="flex justify-center items-center h-40 flex-col gap-2">
                 <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                <p className="text-muted-foreground">Loading categories...</p>
            </div>
         ) : categories.length > 0 ? (
           <AddExpenseForm
                categories={categories}
                // Pass expenseToEdit directly (can be null for add mode)
                expenseToEdit={expenseToEdit}
                onSave={handleSave}
                onCancel={handleCancel}
            />
         ) : (
             <p className="text-center text-muted-foreground p-4">
                 No categories found. Please add categories first. {/* Consider adding a link/button to manage categories */}
             </p>
         )
        }
         {/* Footer removed as form handles Save/Cancel */}
     </>
  );

  if (isMobile) {
    return (
      <Sheet open={open} onOpenChange={onOpenChange}>
        {/* Adjust height and add overflow handling */}
        <SheetContent side="bottom" className="h-[90vh] max-h-[90vh] flex flex-col overflow-hidden">
          <div className="flex-grow overflow-y-auto p-1"> {/* Scrollable content area */}
             {Content}
          </div>
        </SheetContent>
      </Sheet>
    );
  }

  return (
     <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[425px] md:max-w-md lg:max-w-lg">
            {Content}
        </DialogContent>
     </Dialog>
  );
}
