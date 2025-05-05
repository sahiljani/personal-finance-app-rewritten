"use client";

import * as React from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from "@/components/ui/sheet";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { AddExpenseForm } from "@/components/expense/add-expense-form";
import { getCategories } from "@/lib/actions";
import type { Category, Expense } from "@/lib/types";
import { useIsMobile } from "@/hooks/use-mobile"; // Assuming you have this hook

type AddExpenseSheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  expenseToEdit?: Expense | null; // Optional: For editing
};

export function AddExpenseSheet({ open, onOpenChange, expenseToEdit }: AddExpenseSheetProps) {
  const [categories, setCategories] = React.useState<Category[]>([]);
  const [isLoadingCategories, setIsLoadingCategories] = React.useState(true);
   const isMobile = useIsMobile(); // Hook to check screen size

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

  const handleSave = () => {
    onOpenChange(false); // Close the sheet/dialog on save
  };

  const handleCancel = () => {
    onOpenChange(false); // Close the sheet/dialog on cancel
  };

 const title = expenseToEdit ? "Edit Expense" : "Add New Expense";
 const description = expenseToEdit ? "Update the details of your expense." : "Enter the details for your new expense.";


  // Render Dialog on Desktop, Sheet on Mobile
   if (isMobile === undefined) return null; // Avoid rendering mismatch during hydration

  const Content = (
     <>
        <DialogHeader className="sm:hidden"> {/* Only show Header in Dialog on non-mobile */}
            <DialogTitle>{title}</DialogTitle>
            <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
         <SheetHeader className="md:hidden"> {/* Only show Header in Sheet on mobile */}
            <SheetTitle>{title}</SheetTitle>
            <SheetDescription>{description}</SheetDescription>
        </SheetHeader>

        {isLoadingCategories ? (
            <div className="flex justify-center items-center h-40">
                <p>Loading categories...</p>
                {/* Or use a Skeleton loader */}
            </div>
         ) : categories.length > 0 ? (
           <AddExpenseForm
                categories={categories}
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
         {/* Footer might not be needed if form has Cancel/Save buttons */}
        {/* <SheetFooter className="md:hidden">
            <p>Sheet Footer</p>
        </SheetFooter>
         <DialogFooter className="hidden sm:flex">
             <p>Dialog Footer</p>
         </DialogFooter> */}
     </>
  );

  if (isMobile) {
    return (
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent side="bottom" className="h-[85vh] flex flex-col">
          {Content}
        </SheetContent>
      </Sheet>
    );
  }

  return (
     <Dialog open={open} onOpenChange={onOpenChange}>
        {/* DialogTrigger might be handled externally by the button */}
        <DialogContent className="sm:max-w-[425px] md:max-w-md lg:max-w-lg">
            {Content}
        </DialogContent>
     </Dialog>
  );
}
