
"use client";

import * as React from "react";
import type { Expense, Category } from "@/lib/types";
import { format, parseISO, isSameDay } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
      <Card className="text-center shadow-sm border-dashed border-muted-foreground/30 rounded-2xl"> {/* Updated rounding */}
        <CardContent className="p-6 flex flex-col items-center justify-center min-h-[150px]">
          <p className="text-muted-foreground font-medium">No expenses found.</p>
          <p className="text-sm text-muted-foreground mt-1">Try adjusting filters or adding an expense.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4 md:space-y-6">
      {sortedDates.map((dateStr) => (
        <Card key={dateStr} className="overflow-hidden shadow-md rounded-2xl"> {/* Updated rounding and shadow */}
          <CardHeader className="bg-muted/30 px-4 py-2 border-b"> {/* Lighter header */}
            <CardTitle className="text-sm font-medium text-foreground"> {/* Smaller title */}
              {formatDateHeader(dateStr)}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <ul className="divide-y divide-border/50"> {/* Lighter divider */}
              {groupedExpenses[dateStr].map((expense) => {
                const category = getCategoryInfo(expense.categoryId);
                const Icon = getIcon(category?.icon);
                return (
                   <AlertDialog key={expense.id}> {/* Wrap each item in AlertDialog for its trigger */}
                    <li className="flex items-center justify-between gap-2 px-4 py-3 hover:bg-secondary/30 transition-colors"> {/* Lighter hover */}
                      {/* Icon, Description, Category Name */}
                      <div className="flex items-center gap-3 flex-grow min-w-0 mr-2"> {/* Added margin-right */}
                        <span className="flex-shrink-0 w-8 h-8 rounded-full bg-muted flex items-center justify-center text-muted-foreground">
                          <Icon className="w-4 h-4" />
                        </span>
                        <div className="flex-grow min-w-0">
                          <p className="font-medium truncate text-sm">{expense.description}</p> {/* Smaller text */}
                          <p className="text-xs text-muted-foreground">{category?.name || 'Uncategorized'}</p>
                        </div>
                      </div>
                      {/* Amount and Action Buttons */}
                      <div className="flex items-center gap-1 flex-shrink-0">
                        <p className="font-semibold text-sm text-right whitespace-nowrap mr-1"> {/* Smaller text, reduced margin */}
                          ${expense.amount.toFixed(2)}
                        </p>
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-foreground" onClick={() => handleEditClick(expense)} aria-label="Edit Expense"> {/* Smaller buttons */}
                          <Edit2 className="h-3.5 w-3.5" /> {/* Smaller icon */}
                        </Button>
                        <AlertDialogTrigger asChild>
                           <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive/90" onClick={() => handleDeleteClick(expense)} aria-label="Delete Expense"> {/* Smaller buttons */}
                            <Trash2 className="h-3.5 w-3.5" /> {/* Smaller icon */}
                          </Button>
                        </AlertDialogTrigger>
                      </div>

                       {/* Delete Confirmation Dialog Content (associated with the trigger above) */}
                       {/* This needs to be inside the AlertDialog scope */}
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
          </CardContent>
        </Card>
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
