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
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { addExpense, updateExpense, suggestCategory } from "@/lib/actions";
import type { Category, Expense } from "@/lib/types";
import { Loader2 } from "lucide-react";

const formSchema = z.object({
  amount: z.coerce.number({invalid_type_error: "Amount must be a number."}).positive("Amount must be a positive number."),
  description: z.string().min(1, "Description is required.").max(100, "Description too long (max 100 chars)."), // Added max length
  categoryId: z.string().min(1, "Please select a category."),
  // date is handled server-side or via expenseToEdit
});

type AddExpenseFormProps = {
  categories: Category[];
  expenseToEdit: Expense | null; // Use null for add mode
  onSave?: (expense: Expense) => void;
  onCancel?: () => void;
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
  const isEditMode = !!expenseToEdit;

  // Initialize the form *before* useEffect
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    // Set default values based on mode, ensure they are defined or empty strings
    defaultValues: {
      amount: expenseToEdit?.amount ?? undefined, // Use undefined for number input placeholder
      description: expenseToEdit?.description ?? "",
      categoryId: expenseToEdit?.categoryId ?? "",
    },
  });

   // Use useEffect to reset form when expenseToEdit changes (e.g., switching from add to edit)
   React.useEffect(() => {
    form.reset({
      amount: expenseToEdit?.amount ?? undefined,
      description: expenseToEdit?.description ?? "",
      categoryId: expenseToEdit?.categoryId ?? "",
    });
  }, [expenseToEdit, form]); // form.reset is stable

   // Debounce suggestion logic
    const debounceTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);

    const handleDescriptionChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const description = e.target.value;
        form.setValue("description", description, { shouldValidate: true }); // Validate on change

        if (debounceTimeoutRef.current) {
            clearTimeout(debounceTimeoutRef.current);
        }

         // Only suggest if not editing, description is reasonable length, and category isn't already set
        if (!isEditMode && description.length > 3 && description.length < 100 && !form.getValues("categoryId")) {
            debounceTimeoutRef.current = setTimeout(async () => {
                setIsSuggesting(true);
                try {
                    const suggestedId = await suggestCategory(description);
                    // Check if the component is still mounted and form hasn't been reset
                    if (suggestedId && categories.some(c => c.id === suggestedId) && form.getValues("description") === description) {
                         form.setValue("categoryId", suggestedId, { shouldValidate: true });
                    }
                } catch (error) {
                    console.error("Error suggesting category:", error);
                    // Don't bother user with suggestion errors unless critical
                } finally {
                    setIsSuggesting(false);
                }
            }, 500); // 500ms delay
        }
    };

     // Cleanup timeout on unmount
     React.useEffect(() => {
        return () => {
            if (debounceTimeoutRef.current) {
                clearTimeout(debounceTimeoutRef.current);
            }
        };
    }, []);

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsSubmitting(true);
    try {
       // Use existing date if editing, otherwise create a new ISO string date
      const expenseDate = expenseToEdit?.date ?? new Date().toISOString();

      const expensePayload = {
        amount: values.amount,
        description: values.description,
        categoryId: values.categoryId,
        date: expenseDate,
        // receiptUrl: expenseToEdit?.receiptUrl // Preserve receipt URL if needed
      };

      let savedExpense: Expense;
      if (isEditMode && expenseToEdit) { // Check expenseToEdit exists for safety
        savedExpense = await updateExpense(expenseToEdit.id, expensePayload);
        toast({
          title: "Expense Updated",
          // description: "Your expense has been successfully updated.", // Keep it concise
        });
      } else {
        savedExpense = await addExpense(expensePayload);
        toast({
          title: "Expense Added",
          // description: "Your expense has been successfully added.",
        });
      }

      // Reset form to initial state (empty for add, original for edit if needed, but empty is usually preferred)
      form.reset({ amount: undefined, description: '', categoryId: ''});
      onSave?.(savedExpense); // Callback with the saved/updated expense

    } catch (error) {
      console.error("Failed to save expense:", error);
      toast({
        title: "Save Failed",
        description: `${error instanceof Error ? error.message : 'Please try again.'}`,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    // Use ShadCN Form component
    <Form {...form}>
       {/* Apply Tailwind classes for spacing */}
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 px-1">
        <FormField
          control={form.control}
          name="amount"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Amount</FormLabel>
              <FormControl>
                {/* Use ShadCN Input */}
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
                 {/* Use ShadCN Textarea */}
                <Textarea placeholder="e.g., Coffee, Lunch, Groceries" {...field} onChange={handleDescriptionChange} />
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
                    {/* Use ShadCN Loader */}
                    {isSuggesting && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
                </FormLabel>
               {/* Use ShadCN Select */}
              <Select onValueChange={field.onChange} value={field.value} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a category" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {categories.map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                       {/* Icon can be added here if available */}
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

         {/* Use Tailwind for layout */}
        <div className="flex justify-end gap-2 pt-4">
           {onCancel && (
             // Use ShadCN Button variant
             <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
                Cancel
            </Button>
           )}
           {/* Use ShadCN Button, primary color */}
          <Button type="submit" disabled={isSubmitting || !form.formState.isDirty || !form.formState.isValid} className="bg-primary hover:bg-primary/90 text-primary-foreground">
            {isSubmitting ? (
              <>
                {/* Use ShadCN Loader */}
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              isEditMode ? "Update Expense" : "Add Expense"
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
}
