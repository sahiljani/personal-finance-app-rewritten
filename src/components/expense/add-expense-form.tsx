"use client";

import * as React from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea"; // Use Textarea for Description
import { useToast } from "@/hooks/use-toast";
import { addExpense, updateExpense, suggestCategory } from "@/lib/actions";
import type { Category, Expense } from "@/lib/types";
import { Loader2 } from "lucide-react";

const formSchema = z.object({
  amount: z.coerce.number().positive("Amount must be a positive number."),
  description: z.string().min(1, "Description is required."),
  categoryId: z.string().min(1, "Please select a category."),
  // Date is handled separately or could be added if needed
});

type AddExpenseFormProps = {
  categories: Category[];
  expenseToEdit?: Expense | null; // Optional: For editing existing expense
  onSave?: (expense: Expense) => void; // Optional callback after saving
  onCancel?: () => void; // Optional callback for cancelling
};

export function AddExpenseForm({
  categories,
  expenseToEdit,
  onSave,
  onCancel,
}: AddExpenseFormProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [isSuggesting, setIsSuggesting] = React.useState(false);

   // Use useEffect to reset form when expenseToEdit changes or form is opened/closed
   React.useEffect(() => {
    form.reset({
      amount: expenseToEdit?.amount ?? undefined,
      description: expenseToEdit?.description ?? "",
      categoryId: expenseToEdit?.categoryId ?? "",
    });
  }, [expenseToEdit, form]);


  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      amount: expenseToEdit?.amount ?? undefined,
      description: expenseToEdit?.description ?? "",
      categoryId: expenseToEdit?.categoryId ?? "",
    },
  });

   // Debounce suggestion logic
    const debounceTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);

    const handleDescriptionChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const description = e.target.value;
        form.setValue("description", description); // Update form state immediately

        if (debounceTimeoutRef.current) {
            clearTimeout(debounceTimeoutRef.current);
        }

        if (description.length > 3 && !form.getValues("categoryId")) { // Only suggest if description is long enough and category not set
            debounceTimeoutRef.current = setTimeout(async () => {
                setIsSuggesting(true);
                try {
                    const suggestedId = await suggestCategory(description);
                    if (suggestedId && categories.some(c => c.id === suggestedId)) {
                         form.setValue("categoryId", suggestedId, { shouldValidate: true });
                    }
                } catch (error) {
                    console.error("Error suggesting category:", error);
                    // Optionally show a toast notification for suggestion errors
                } finally {
                    setIsSuggesting(false);
                }
            }, 750); // 750ms delay
        }
    };

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsSubmitting(true);
    try {
      const expenseData = {
        ...values,
        date: expenseToEdit?.date ?? new Date().toISOString(), // Use existing date or now
        // receiptUrl: expenseToEdit?.receiptUrl // Preserve receipt URL if editing
      };

      let savedExpense: Expense;
      if (expenseToEdit) {
        savedExpense = await updateExpense(expenseToEdit.id, expenseData);
        toast({
          title: "Expense Updated",
          description: "Your expense has been successfully updated.",
        });
      } else {
        savedExpense = await addExpense(expenseData);
        toast({
          title: "Expense Added",
          description: "Your expense has been successfully added.",
        });
      }
      form.reset(); // Reset form after successful submission
      onSave?.(savedExpense); // Call callback if provided
    } catch (error) {
      console.error("Failed to save expense:", error);
      toast({
        title: "Error",
        description: `Failed to save expense. ${error instanceof Error ? error.message : 'Please try again.'}`,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 p-1">
        <FormField
          control={form.control}
          name="amount"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Amount</FormLabel>
              <FormControl>
                <Input type="number" step="0.01" placeholder="0.00" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                 {/* Use Textarea for potentially longer descriptions */}
                <Textarea placeholder="e.g., Coffee with client, Lunch meeting" {...field} onChange={handleDescriptionChange} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="categoryId"
          render={({ field }) => (
            <FormItem>
                <FormLabel className="flex items-center gap-2">
                    Category
                    {isSuggesting && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
                </FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a category" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {categories.map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                       {/* Add icon here if available */}
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end gap-2 pt-4">
           {onCancel && (
             <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
                Cancel
            </Button>
           )}
          <Button type="submit" disabled={isSubmitting} className="bg-accent hover:bg-accent/90 text-accent-foreground">
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              expenseToEdit ? "Update Expense" : "Add Expense"
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
}
