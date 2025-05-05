"use client";

import * as React from "react";
import type { Expense, Category } from "@/lib/types";
import { format, parseISO, isSameDay, formatRelative } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Trash2, Edit2 } from "lucide-react";
import * as LucideIcons from 'lucide-react'; // Import all icons
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  // AlertDialogTrigger, // Removed as it's not needed here
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { deleteExpense } from "@/lib/actions";
import { AddExpenseSheet } from "./add-expense-sheet"; // For editing

// Helper function to get Lucide icon component by name
const getIcon = (name?: string): React.ElementType | null => {
    if (!name) return null;
    // Ensure the name exists in LucideIcons before trying to access it
    // Need type assertion because LucideIcons doesn't have a perfect index signature
    const IconComponent = (LucideIcons as any)[name];
    return IconComponent || LucideIcons.HelpCircle; // Fallback icon
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
      // Update the local state optimistically or refetch
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
        setIsEditDialogOpen(false); // Close the dialog
        setExpenseToEdit(null);
    }

    const handleEditCancel = () => {
        setIsEditDialogOpen(false);
        setExpenseToEdit(null);
    }

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
         // Format other dates nicely, e.g., "Mon, Oct 23"
         return format(date, 'eee, MMM d');
    };


  if (expenses.length === 0) {
    return (
      <Card className="text-center shadow-sm">
        <CardContent className="p-6">
          <p className="text-muted-foreground">No expenses found matching your criteria.</p>
           <p className="text-sm text-muted-foreground mt-2">Try adjusting the filters or adding a new expense.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {sortedDates.map((dateStr) => (
        <Card key={dateStr} className="overflow-hidden shadow-sm">
          <CardHeader className="bg-muted/50 px-4 py-2 border-b">
            <CardTitle className="text-base font-semibold">
              {formatDateHeader(dateStr)}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <ul className="divide-y">
              {groupedExpenses[dateStr].map((expense) => {
                const category = getCategoryInfo(expense.categoryId);
                 const Icon = getIcon(category?.icon);
                return (
                  <li key={expense.id} className="flex items-center justify-between gap-2 px-4 py-3 hover:bg-secondary/50 transition-colors">
                     <div className="flex items-center gap-3 flex-grow min-w-0">
                        {Icon && (
                            <span className="flex-shrink-0 w-8 h-8 rounded-full bg-muted flex items-center justify-center text-muted-foreground">
                             <Icon className="w-4 h-4" />
                            </span>
                        )}
                        <div className="flex-grow min-w-0">
                            <p className="font-medium truncate">{expense.description}</p>
                            <p className="text-sm text-muted-foreground">{category?.name || 'Uncategorized'}</p>
                        </div>
                    </div>
                     <div className="flex items-center gap-1 flex-shrink-0">
                      <p className="font-semibold text-right whitespace-nowrap mr-2">
                            ${expense.amount.toFixed(2)}
                        </p>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground" onClick={() => handleEditClick(expense)} aria-label="Edit Expense">
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        {/* Removed AlertDialogTrigger wrapper here */}
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

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!expenseToDelete} onOpenChange={(open) => !open && setExpenseToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the expense: <br />
              <strong>{expenseToDelete?.description}</strong> for <strong>${expenseToDelete?.amount.toFixed(2)}</strong>.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setExpenseToDelete(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Edit Expense Sheet/Dialog */}
       <AddExpenseSheet
            open={isEditDialogOpen}
            onOpenChange={setIsEditDialogOpen}
            expenseToEdit={expenseToEdit}
            // Pass handleEditSave and handleEditCancel if AddExpenseSheet uses them
            // For simplicity, AddExpenseSheet can call onOpenChange(false) internally on save/cancel
        />
    </div>
  );
}
