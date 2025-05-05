
"use client";

import * as React from "react";
import type { Expense, Category } from "@/lib/types";
import { format, parseISO, isSameDay } from 'date-fns';
// Removed Card imports, using simple divs now
// import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button, buttonVariants } from "@/components/ui/button"; // Import buttonVariants
import { Trash2, Edit2, HelpCircle } from "lucide-react";
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
  AlertDialogTrigger, // Import AlertDialogTrigger
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { deleteExpense } from "@/lib/actions";
import { AddExpenseSheet } from "./add-expense-sheet"; // For editing

// Helper function to get Lucide icon component by name safely
const getIcon = (name?: string): React.ElementType => {
    if (!name) return HelpCircle;
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
      setExpenses(prev => prev.filter(e => e.id !== expenseToDelete!.id));
      toast({
        title: "Expense Deleted",
        // description: "The expense has been successfully deleted.", // Keep concise
      });
    } catch (error) {
      console.error("Failed to delete expense:", error);
      toast({
        title: "Error Deleting",
        description: `${error instanceof Error ? error.message : 'Please try again.'}`,
        variant: "destructive",
      });
    } finally {
      setExpenseToDelete(null); // Close the dialog
    }
  };

  const handleEditSave = (updatedExpense: Expense) => {
    setExpenses(prev => prev.map(e => e.id === updatedExpense.id ? updatedExpense : e));
    // Closing is handled within AddExpenseSheet
  };

  const groupExpensesByDate = (expenses: Expense[]): GroupedExpenses => {
    return expenses.reduce((acc, expense) => {
      const dateStr = format(parseISO(expense.date), 'yyyy-MM-dd');
      if (!acc[dateStr]) {
        acc[dateStr] = [];
      }
      acc[dateStr].push(expense);
      return acc;
    }, {} as GroupedExpenses);
  };

  const groupedExpenses = groupExpensesByDate(expenses);
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
    return format(date, 'eee, MMM d, yyyy');
  };

  if (expenses.length === 0) {
    return (
      // Minimal 'no expenses' message
      <div className="text-center p-10 border border-dashed rounded-lg bg-card">
          <p className="text-muted-foreground font-medium">No expenses found.</p>
          <p className="text-sm text-muted-foreground mt-1">Try adjusting filters or adding an expense.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 md:space-y-6">
      {sortedDates.map((dateStr) => (
        // Remove Card structure for flatter design
        <div key={dateStr} className="space-y-2"> {/* Use simple div for grouping */}
          {/* Date Header - Minimal style */}
          <h3 className="text-sm font-medium text-muted-foreground px-1 pt-2">
            {formatDateHeader(dateStr)}
          </h3>
           {/* List items */}
          <ul className="space-y-2"> {/* Simple ul with spacing */}
            {groupedExpenses[dateStr].map((expense) => {
              const category = getCategoryInfo(expense.categoryId);
              const Icon = getIcon(category?.icon);
              return (
                 // Wrap each item in AlertDialog for its trigger
                 <AlertDialog key={expense.id}>
                  {/* List Item - Flat style */}
                  <li className="flex items-center justify-between gap-2 px-3 py-3 bg-card rounded-lg shadow-sm hover:bg-muted/50 transition-colors">
                    {/* Icon, Description, Category Name */}
                    <div className="flex items-center gap-3 flex-grow min-w-0 mr-2">
                      <span className="flex-shrink-0 w-10 h-10 rounded-lg bg-muted flex items-center justify-center text-muted-foreground">
                        <Icon className="w-5 h-5" /> {/* Slightly larger icon */}
                      </span>
                      <div className="flex-grow min-w-0">
                        <p className="font-medium truncate text-sm">{expense.description}</p>
                        {/* Show date below category name */}
                        <p className="text-xs text-muted-foreground">{category?.name || 'Uncategorized'}</p>
                        {/* <p className="text-xs text-muted-foreground">{format(parseISO(expense.date), 'p')}</p> */}
                      </div>
                    </div>
                    {/* Amount and Action Buttons */}
                    <div className="flex flex-col items-end gap-1 flex-shrink-0 ml-2">
                      <p className="font-semibold text-sm text-right whitespace-nowrap text-destructive"> {/* Amount in red-like color */}
                        -${expense.amount.toFixed(2)}
                      </p>
                      {/* Action Buttons - subtle */}
                       <div className="flex gap-0">
                           <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-foreground" onClick={() => handleEditClick(expense)} aria-label="Edit Expense">
                               <Edit2 className="h-3.5 w-3.5" />
                           </Button>
                           <AlertDialogTrigger asChild>
                               <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive" onClick={() => handleDeleteClick(expense)} aria-label="Delete Expense">
                                   <Trash2 className="h-3.5 w-3.5" />
                               </Button>
                           </AlertDialogTrigger>
                       </div>
                    </div>

                    {/* Delete Confirmation Dialog Content */}
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
                         <AlertDialogAction onClick={confirmDelete} className={buttonVariants({ variant: "destructive" })}>
                           Delete
                         </AlertDialogAction>
                       </AlertDialogFooter>
                     </AlertDialogContent>
                  </li>
                 </AlertDialog>
              );
            })}
          </ul>
        </div>
      ))}

      {/* Edit Expense Sheet/Dialog (remains outside the loop) */}
      <AddExpenseSheet
        open={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        expenseToEdit={expenseToEdit}
      />
    </div>
  );
}
