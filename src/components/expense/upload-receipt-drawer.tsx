
"use client";

import * as React from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
  SheetClose,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Upload, Trash2, Edit2, Check, X, AlertCircle } from "lucide-react";
import type { ExtractedReceiptItem, Category, Expense } from "@/lib/types";
import { processReceiptFile, addExpensesBatch, getCategories } from "@/lib/actions"; // Removed suggestCategory as AI does it now
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

type UploadReceiptDrawerProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

type EditableItem = ExtractedReceiptItem & {
  id: string; // Temporary ID for editing state
  // categoryId is already part of ExtractedReceiptItem
  isEditing: boolean;
};

// Enum for processing status
enum ProcessingStatus {
    Idle = 'idle',
    Processing = 'processing',
    Success = 'success',
    Error = 'error',
    NoItemsFound = 'no_items_found'
}

export function UploadReceiptDrawer({ open, onOpenChange }: UploadReceiptDrawerProps) {
  const { toast } = useToast();
  const [file, setFile] = React.useState<File | null>(null);
  const [processingStatus, setProcessingStatus] = React.useState<ProcessingStatus>(ProcessingStatus.Idle);
  const [isSaving, setIsSaving] = React.useState(false);
  const [extractedItems, setExtractedItems] = React.useState<EditableItem[]>([]);
  const [categories, setCategories] = React.useState<Category[]>([]);
  const [isLoadingCategories, setIsLoadingCategories] = React.useState(true);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  // Fetch categories when the drawer opens
  React.useEffect(() => {
    async function fetchCategories() {
        if (!open) return; // Only fetch if open
        setIsLoadingCategories(true);
        try {
            const fetchedCategories = await getCategories();
            setCategories(fetchedCategories);
        } catch (error) {
            console.error("Failed to fetch categories:", error);
            toast({ title: "Error", description: "Could not load categories.", variant: "destructive" });
        } finally {
            setIsLoadingCategories(false);
        }
    }
    fetchCategories();
  }, [open, toast]);

  // Reset state when drawer closes
  React.useEffect(() => {
    if (!open) {
      setFile(null);
      setProcessingStatus(ProcessingStatus.Idle);
      setIsSaving(false);
      setExtractedItems([]);
      setErrorMessage(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = ""; // Clear the file input
      }
    }
  }, [open]);


  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile) {
       // Basic validation (e.g., file type, size)
        const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
        if (!allowedTypes.includes(selectedFile.type)) {
            toast({ title: "Invalid File Type", description: "Please upload a JPG, PNG, WEBP, or PDF file.", variant: "destructive" });
            return;
        }
        // Optional: Add size check
         const maxSize = 10 * 1024 * 1024; // 10MB limit for Genkit
         if (selectedFile.size > maxSize) {
             toast({ title: "File Too Large", description: "Please upload a file smaller than 10MB.", variant: "destructive" });
             return;
         }

      setFile(selectedFile);
      setExtractedItems([]); // Clear previous results if a new file is selected
      setProcessingStatus(ProcessingStatus.Idle); // Reset status
      setErrorMessage(null);
    }
  };

  const handleUpload = async () => {
    if (!file) {
      toast({ title: "No File Selected", description: "Please select a file to upload.", variant: "destructive" });
      return;
    }
    if (isLoadingCategories) {
        toast({ title: "Please Wait", description: "Categories are still loading.", variant: "destructive" });
        return;
    }

    setProcessingStatus(ProcessingStatus.Processing);
    setErrorMessage(null);
    setExtractedItems([]);

    try {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onloadend = async () => {
          const base64data = reader.result as string;
          if (!base64data) {
              throw new Error("Failed to read file.");
          }

          const results = await processReceiptFile(base64data);

          if (results.length === 0) {
               setProcessingStatus(ProcessingStatus.NoItemsFound);
               toast({ title: "No Items Found", description: "The AI couldn't extract any items from the receipt.", variant: "default" });
          } else {
              // Map results to EditableItem state, using the AI-suggested categoryId
              const itemsWithTempIds = results.map((item, index) => ({
                  ...item,
                  id: `item-${index}-${Date.now()}`, // Temp ID
                  isEditing: false,
                   // Ensure categoryId exists and is valid, otherwise fallback
                  categoryId: item.categoryId && categories.some(c => c.id === item.categoryId) ? item.categoryId : (categories.find(c => c.id === 'other')?.id || ''),
              }));

              setExtractedItems(itemsWithTempIds);
              setProcessingStatus(ProcessingStatus.Success);
              toast({ title: "Receipt Processed", description: "Review the extracted items below." });
          }
      };
      reader.onerror = (error) => {
          console.error("File reading error:", error);
          throw new Error("Error reading the uploaded file.");
      };
    } catch (error) {
      console.error("Upload failed:", error);
      const message = error instanceof Error ? error.message : "Could not process the receipt. Please try again.";
      setErrorMessage(message);
      setProcessingStatus(ProcessingStatus.Error);
      toast({
        title: "Processing Failed",
        description: message,
        variant: "destructive",
      });
       setExtractedItems([]); // Clear items on error
    }
  };

  const handleItemChange = (id: string, field: keyof EditableItem, value: string | number) => {
    setExtractedItems(prevItems =>
      prevItems.map(item =>
        item.id === id ? { ...item, [field]: value } : item
      )
    );
  };

    const toggleEdit = (id: string) => {
        setExtractedItems(prev => prev.map(item => item.id === id ? {...item, isEditing: !item.isEditing} : item));
    }

   const handleSaveEdit = (id: string) => {
        // Add validation here if needed before saving
        toggleEdit(id); // Just toggle back display mode
    }

    const handleCancelEdit = (id: string) => {
        // Optional: Restore original values if needed, for now just toggle back
        // Might require storing original item state temporarily
        toggleEdit(id);
    }


  const handleDeleteItem = (id: string) => {
    setExtractedItems(prevItems => prevItems.filter(item => item.id !== id));
     toast({ title: "Item Removed", description: "The item has been removed from the list." });
  };

  const handleAddExpenses = async () => {
    if (extractedItems.length === 0) {
      toast({ title: "No Items", description: "There are no items to add.", variant: "destructive" });
      return;
    }

    // Validate all items before saving
     const invalidItem = extractedItems.find(item => !item.categoryId || !item.description || item.amount <= 0);
     if (invalidItem) {
         toast({
             title: "Validation Error",
             description: `Please ensure all items have a valid description, positive amount, and selected category. Issue found with: "${invalidItem.description || 'N/A'}"`,
             variant: "destructive",
         });
         // Optional: Highlight the invalid item visually if possible
         return;
     }


    setIsSaving(true);
    try {
      const expensesToAdd: Omit<Expense, "id">[] = extractedItems.map(item => ({
        amount: item.amount,
        description: item.description,
        categoryId: item.categoryId,
        date: new Date().toISOString(), // Use current date for uploaded items
      }));

      await addExpensesBatch(expensesToAdd);

      toast({
        title: "Expenses Added",
        description: `${expensesToAdd.length} expense(s) added successfully.`,
      });
      onOpenChange(false); // Close drawer on success
    } catch (error) {
      console.error("Failed to add expenses:", error);
      toast({
        title: "Error Saving Expenses",
        description: error instanceof Error ? error.message : "Could not save the expenses. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

    const isProcessing = processingStatus === ProcessingStatus.Processing;
    const showResults = processingStatus === ProcessingStatus.Success && extractedItems.length > 0;
    const showNoItemsMessage = processingStatus === ProcessingStatus.NoItemsFound;
    const showError = processingStatus === ProcessingStatus.Error;


  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="h-[90vh] flex flex-col">
        <SheetHeader>
          <SheetTitle>Upload Receipt</SheetTitle>
          <SheetDescription>
            Upload an image (JPG, PNG, WEBP) or PDF (max 10MB). We&apos;ll use AI to extract the items.
          </SheetDescription>
        </SheetHeader>

        <div className="flex-grow overflow-y-auto p-1">
          {/* File Input Area */}
          <div className="mb-6 space-y-2">
            <Label htmlFor="receipt-upload">Select File</Label>
            <div className="flex gap-2">
               <Input
                 id="receipt-upload"
                 type="file"
                 accept="image/jpeg,image/png,image/webp,application/pdf"
                 onChange={handleFileChange}
                 ref={fileInputRef}
                 className="flex-grow file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-primary-foreground hover:file:bg-primary/90"
                 disabled={isProcessing || isLoadingCategories || isSaving}
               />
              <Button
                onClick={handleUpload}
                disabled={!file || isProcessing || isLoadingCategories || isSaving || processingStatus === ProcessingStatus.Success} // Disable if already succeeded for this file
                className="bg-accent hover:bg-accent/90 text-accent-foreground"
              >
                {isProcessing ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Upload className="mr-2 h-4 w-4" />
                )}
                Process
              </Button>
            </div>
            {file && <p className="text-sm text-muted-foreground">Selected: {file.name}</p>}
             {isLoadingCategories && <p className="text-sm text-yellow-600 flex items-center gap-1"><Loader2 className="h-3 w-3 animate-spin" /> Loading categories...</p>}
          </div>

          {/* Processing Indicator */}
           {isProcessing && (
                <div className="flex justify-center items-center flex-col gap-2 text-muted-foreground py-10">
                    <Loader2 className="h-8 w-8 animate-spin" />
                    <p>Processing receipt with AI...</p>
                     <p className="text-xs">(This may take a moment)</p>
                </div>
            )}

            {/* Error Message */}
            {showError && errorMessage && (
                 <Alert variant="destructive" className="my-4">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Processing Error</AlertTitle>
                    <AlertDescription>
                       {errorMessage} Please try a different file or add expenses manually.
                    </AlertDescription>
                </Alert>
            )}

             {/* No Items Found Message */}
             {showNoItemsMessage && (
                 <Alert variant="default" className="my-4 border-yellow-500 text-yellow-700 [&>svg]:text-yellow-700">
                     <AlertCircle className="h-4 w-4" />
                     <AlertTitle>No Items Extracted</AlertTitle>
                     <AlertDescription>
                         The AI could not find any line items in the uploaded receipt. Please ensure the image is clear or try adding expenses manually.
                     </AlertDescription>
                 </Alert>
             )}


          {/* Extracted Items List */}
          {showResults && (
            <div className="space-y-3">
              <h3 className="font-semibold text-lg">Extracted Items ({extractedItems.length})</h3>
              <p className="text-sm text-muted-foreground">Review and edit the items below before adding them.</p>
              {extractedItems.map((item) => (
                <div key={item.id} className="border rounded-md p-3 shadow-sm bg-card">
                   {item.isEditing ? (
                       <div className="space-y-2">
                            <Label htmlFor={`desc-${item.id}`}>Description</Label>
                           <Input
                                id={`desc-${item.id}`}
                                value={item.description}
                                onChange={(e) => handleItemChange(item.id, 'description', e.target.value)}
                                className="text-base"
                                placeholder="Description"
                           />
                            <Label htmlFor={`amount-${item.id}`}>Amount</Label>
                           <Input
                                id={`amount-${item.id}`}
                                type="number"
                                step="0.01"
                                value={item.amount}
                                onChange={(e) => handleItemChange(item.id, 'amount', parseFloat(e.target.value) || 0)}
                                className="text-base"
                                placeholder="Amount"
                           />
                            <Label htmlFor={`cat-${item.id}`}>Category</Label>
                            <Select
                                value={item.categoryId}
                                onValueChange={(value) => handleItemChange(item.id, 'categoryId', value)}
                            >
                                <SelectTrigger id={`cat-${item.id}`}>
                                    <SelectValue placeholder="Select category" />
                                </SelectTrigger>
                                <SelectContent>
                                     {categories.length === 0 && <SelectItem value="" disabled>Loading...</SelectItem>}
                                    {categories.map((cat) => (
                                        <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <div className="flex justify-end gap-2 pt-2">
                                 <Button variant="ghost" size="icon" onClick={() => handleCancelEdit(item.id)} aria-label="Cancel edit">
                                    <X className="h-4 w-4"/>
                                </Button>
                                <Button variant="ghost" size="icon" onClick={() => handleSaveEdit(item.id)} aria-label="Save edit" className="text-green-600 hover:text-green-700">
                                    <Check className="h-4 w-4"/>
                                </Button>
                            </div>

                       </div>
                   ) : (
                     <div className="flex items-start justify-between gap-2">
                       <div className="flex-grow min-w-0"> {/* Ensure description wraps */}
                         <p className="font-medium break-words">{item.description || <span className="text-muted-foreground italic">No description</span>}</p>
                         <p className="text-sm text-muted-foreground">
                            {categories.find(c => c.id === item.categoryId)?.name || <span className="text-red-500">Select category</span>}
                         </p>
                       </div>
                       <div className="flex flex-col items-end flex-shrink-0 pl-2">
                         <p className="font-semibold text-lg whitespace-nowrap">
                            ${item.amount?.toFixed(2) ?? '0.00'}
                         </p>
                          <div className="flex gap-1 mt-1">
                            <Button variant="ghost" size="icon" onClick={() => toggleEdit(item.id)} className="h-7 w-7 text-blue-600 hover:text-blue-700" aria-label="Edit item">
                               <Edit2 className="h-4 w-4"/>
                            </Button>
                            <Button variant="ghost" size="icon" onClick={() => handleDeleteItem(item.id)} className="h-7 w-7 text-destructive hover:text-destructive/90" aria-label="Delete item">
                                <Trash2 className="h-4 w-4" />
                            </Button>
                         </div>
                       </div>
                     </div>
                   )}

                </div>
              ))}
            </div>
          )}
        </div>

        <SheetFooter className="border-t pt-4">
           <SheetClose asChild>
                <Button variant="outline" disabled={isProcessing || isSaving}>Cancel</Button>
           </SheetClose>
          <Button
            onClick={handleAddExpenses}
            disabled={extractedItems.length === 0 || isProcessing || isSaving || isLoadingCategories || processingStatus === ProcessingStatus.Error}
             className="bg-accent hover:bg-accent/90 text-accent-foreground"
          >
            {isSaving ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : null}
            Add {extractedItems.length > 0 ? `${extractedItems.length} ` : ''}Expense(s)
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
