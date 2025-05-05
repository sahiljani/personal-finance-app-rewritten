"use client";

import * as React from "react";
import type { Expense, Category } from "@/lib/types";
import { format, parseISO, isSameDay } from 'date-fns'; // Removed unused formatRelative
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Trash2, Edit2, HelpCircle } from "lucide-react"; // Import default fallback
import * as LucideIcons from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { deleteExpense } from "@/lib/actions";
import { AddExpenseSheet } from "./add-expense-sheet"; // For editing

// Helper function to get Lucide icon component by name safely
const getIcon = (name?: string): React.ElementType => {
    if (!name) return HelpCircle;
    // Use type assertion carefully or check existence
    const IconComponent = (LucideIcons as Record<string, React.ElementType>)[name];
    return IconComponent || HelpCircle; // Fallback icon
};


interface ExpenseListProps {
  initialExpenses: Expense[];
  categories: Category[];
}

interface GroupedExpenses {
  [date: string]: Expense[];
}

export function ExpenseList({ initialExpenses, categories }: ExpenseListProps) {
  const [expenses, setExpenses] = React.useState(initialExpenses);
  const [expenseToDelete, setExpenseToDelete] = React.useState<Expense | null>(null);
  const [expenseToEdit, setExpenseToEdit] = React.useState<Expense | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = React.useState(false);
  const { toast } = useToast();

   // Update state if initialExpenses prop changes (e.g., due to filtering)
  React.useEffect(() => {
    setExpenses(initialExpenses);
  }, [initialExpenses]);


  const handleDeleteClick = (expense: Expense) => {
    setExpenseToDelete(expense);
  };

   const handleEditClick = (expense: Expense) => {
    setExpenseToEdit(expense);
    setIsEditDialogOpen(true); // Open the edit sheet/dialog
  };


  const confirmDelete = async () => {
    if (!expenseToDelete) return;

    try {
      await deleteExpense(expenseToDelete.id);
      // Update the local state optimistically or trigger refetch via parent
      setExpenses(prev => prev.filter(e => e.id !== expenseToDelete!.id));
      toast({
        title: "Expense Deleted",
        description: "The expense has been successfully deleted.",
      });
    } catch (error) {
      console.error("Failed to delete expense:", error);
      toast({
        title: "Error",
        description: `Failed to delete expense. ${error instanceof Error ? error.message : 'Please try again.'}`,
        variant: "destructive",
      });
    } finally {
      setExpenseToDelete(null); // Close the dialog
    }
  };

   const handleEditSave = (updatedExpense: Expense) => {
     // Update the local state after successful edit
        setExpenses(prev => prev.map(e => e.id === updatedExpense.id ? updatedExpense : e));
        // Closing is handled within AddExpenseSheet via onOpenChange
        // setIsEditDialogOpen(false);
        // setExpenseToEdit(null);
    }

    // Cancel is handled within AddExpenseSheet via onOpenChange
    // const handleEditCancel = () => {
    //     setIsEditDialogOpen(false);
    //     setExpenseToEdit(null);
    // }

  const groupExpensesByDate = (expenses: Expense[]): GroupedExpenses => {
    return expenses.reduce((acc, expense) => {
      // Group by date string 'yyyy-MM-dd'
      const dateStr = format(parseISO(expense.date), 'yyyy-MM-dd');
      if (!acc[dateStr]) {
        acc[dateStr] = [];
      }
      acc[dateStr].push(expense);
      return acc;
    }, {} as GroupedExpenses);
  };

  const groupedExpenses = groupExpensesByDate(expenses);
  // Sort dates descending (most recent first)
  const sortedDates = Object.keys(groupedExpenses).sort((a, b) => new Date(b).getTime() - new Date(a).getTime());

  const getCategoryInfo = (categoryId: string) => {
    return categories.find(c => c.id === categoryId);
  };

  const formatDateHeader = (dateStr: string): string => {
        const date = parseISO(dateStr);
        const today = new Date();
        const yesterday = new Date(today);
        yesterday.setDate(today.getDate() - 1);

        if (isSameDay(date, today)) {
            return 'Today';
        }
        if (isSameDay(date, yesterday)) {
            return 'Yesterday';
        }
         // Format other dates nicely, e.g., "Mon, Oct 23" or "Oct 23, 2023"
         return format(date, 'eee, MMM d, yyyy');
    };


  if (expenses.length === 0) {
    return (
      <Card className="text-center shadow-sm border-dashed border-muted-foreground/30">
        <CardContent className="p-6 flex flex-col items-center justify-center min-h-[150px]">
           {/* Optional: Add an icon */}
           {/* <Inbox className="w-12 h-12 text-muted-foreground/50 mb-4" /> */}
          <p className="text-muted-foreground font-medium">No expenses found.</p>
           <p className="text-sm text-muted-foreground mt-1">Try adjusting filters or adding an expense.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4 md:space-y-6"> {/* Consistent spacing */}
      {sortedDates.map((dateStr) => (
        <Card key={dateStr} className="overflow-hidden shadow-sm">
           {/* Use ShadCN CardHeader and CardTitle */}
          <CardHeader className="bg-muted/50 px-4 py-2 border-b">
            {/* Use appropriate text size/weight */}
            <CardTitle className="text-base font-medium text-foreground">
              {formatDateHeader(dateStr)}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {/* Use ul for semantic list */}
            <ul className="divide-y divide-border">
              {groupedExpenses[dateStr].map((expense) => {
                const category = getCategoryInfo(expense.categoryId);
                 const Icon = getIcon(category?.icon);
                return (
                  <li key={expense.id} className="flex items-center justify-between gap-2 px-4 py-3 hover:bg-secondary/50 transition-colors">
                     {/* Icon, Description, Category Name */}
                     <div className="flex items-center gap-3 flex-grow min-w-0"> {/* Allow text to truncate */}
                        {/* Category Icon */}
                        <span className="flex-shrink-0 w-8 h-8 rounded-full bg-muted flex items-center justify-center text-muted-foreground">
                         <Icon className="w-4 h-4" />
                        </span>
                        {/* Text content */}
                        <div className="flex-grow min-w-0"> {/* Ensure inner div can shrink */}
                            <p className="font-medium truncate text-sm md:text-base">{expense.description}</p>
                            <p className="text-xs md:text-sm text-muted-foreground">{category?.name || 'Uncategorized'}</p>
                        </div>
                    </div>
                     {/* Amount and Action Buttons */}
                     <div className="flex items-center gap-1 flex-shrink-0 ml-2">
                        {/* Amount */}
                      <p className="font-semibold text-sm md:text-base text-right whitespace-nowrap mr-2">
                            ${expense.amount.toFixed(2)}
                        </p>
                        {/* Edit Button */}
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground" onClick={() => handleEditClick(expense)} aria-label="Edit Expense">
                          <Edit2 className="h-4 w-4" />
                        </Button>
                         {/* Delete Button Trigger (within AlertDialog logic below) */}
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive/90" onClick={() => handleDeleteClick(expense)} aria-label="Delete Expense">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                  </li>
                );
              })}
            </ul>
          </CardContent>
        </Card>
      ))}

      {/* Delete Confirmation Dialog (using ShadCN AlertDialog) */}
      <AlertDialog open={!!expenseToDelete} onOpenChange={(open) => !open && setExpenseToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the expense: <br />
              <strong className="break-words">{expenseToDelete?.description}</strong> for <strong className="whitespace-nowrap">${expenseToDelete?.amount.toFixed(2)}</strong>.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setExpenseToDelete(null)}>Cancel</AlertDialogCancel>
            {/* Use destructive button variant */}
            <AlertDialogAction onClick={confirmDelete} className={buttonVariants({ variant: "destructive" })}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Edit Expense Sheet/Dialog (using ShadCN Sheet/Dialog) */}
       <AddExpenseSheet
            open={isEditDialogOpen}
            onOpenChange={setIsEditDialogOpen}
            expenseToEdit={expenseToEdit}
            // onSave prop is used internally by AddExpenseForm to trigger state update here
            // onCancel is handled by onOpenChange(false)
        />
    </div>
  );
}

// Need buttonVariants for AlertDialogAction styling
import { buttonVariants } from "@/components/ui/button";
