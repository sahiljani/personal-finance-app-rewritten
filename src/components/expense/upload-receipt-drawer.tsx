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
import { Loader2, Upload, Trash2, Edit2, Check, X, AlertCircle, FileWarning } from "lucide-react"; // Added FileWarning
import type { ExtractedReceiptItem, Category, Expense } from "@/lib/types";
import { processReceiptFile, addExpensesBatch, getCategories } from "@/lib/actions";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area"; // Import ScrollArea

type UploadReceiptDrawerProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

// Use temporary ID for client-side state management only
type EditableItem = ExtractedReceiptItem & {
  _tempId: string;
  isEditing: boolean;
};

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
  // Store original state for cancellation
  const [originalItems, setOriginalItems] = React.useState<EditableItem[]>([]);

  // Fetch categories when the drawer opens
  React.useEffect(() => {
    async function fetchCategories() {
        if (!open) return;
        setIsLoadingCategories(true);
        try {
            const fetchedCategories = await getCategories();
            setCategories(fetchedCategories);
        } catch (error) {
            console.error("Failed to fetch categories:", error);
            toast({ title: "Error Loading Categories", description: "Could not load categories. Please try again.", variant: "destructive" });
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
      setOriginalItems([]); // Clear original items as well
      setErrorMessage(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  }, [open]);


  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile) {
        const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
        const maxSize = 10 * 1024 * 1024; // 10MB

        if (!allowedTypes.includes(selectedFile.type)) {
            toast({ title: "Invalid File Type", description: "Please upload JPG, PNG, WEBP, or PDF.", variant: "destructive" });
            return;
        }
         if (selectedFile.size > maxSize) {
             toast({ title: "File Too Large", description: "Max file size is 10MB.", variant: "destructive" });
             return;
         }

      setFile(selectedFile);
      setExtractedItems([]);
      setOriginalItems([]);
      setProcessingStatus(ProcessingStatus.Idle);
      setErrorMessage(null);
    }
  };

  const handleUpload = async () => {
    if (!file) {
      toast({ title: "No File", description: "Please select a receipt file.", variant: "destructive" });
      return;
    }
    if (isLoadingCategories) {
        toast({ title: "Loading", description: "Categories are still loading.", variant: "default" });
        return;
    }

    setProcessingStatus(ProcessingStatus.Processing);
    setErrorMessage(null);
    setExtractedItems([]);
    setOriginalItems([]);

    try {
        const base64data = await readFileAsDataURL(file);
        const results = await processReceiptFile(base64data);

        if (results.length === 0) {
             setProcessingStatus(ProcessingStatus.NoItemsFound);
             // Use a specific toast or Alert, not error message state for this case
             // setErrorMessage("AI could not extract any items from the receipt.");
        } else {
            const defaultCategoryId = categories.find(c => c.id === 'other')?.id || categories[0]?.id || '';
            const itemsWithTempIds = results.map((item, index) => ({
                ...item,
                _tempId: `temp-${index}-${Date.now()}`, // Temporary client-side ID
                isEditing: false,
                categoryId: categories.some(c => c.id === item.categoryId) ? item.categoryId : defaultCategoryId,
            }));

            setExtractedItems(itemsWithTempIds);
            setOriginalItems(JSON.parse(JSON.stringify(itemsWithTempIds))); // Deep copy for reset
            setProcessingStatus(ProcessingStatus.Success);
            toast({ title: "Receipt Processed", description: "Review the extracted items." });
        }
    } catch (error) {
      console.error("Receipt processing failed:", error);
      const message = error instanceof Error ? error.message : "Could not process the receipt.";
      setErrorMessage(message); // Set error message state for display
      setProcessingStatus(ProcessingStatus.Error);
      // Toast is optional here as Alert will show
      // toast({ title: "Processing Failed", description: message, variant: "destructive" });
       setExtractedItems([]);
       setOriginalItems([]);
    }
  };

  // Helper function to read file as Data URL
    function readFileAsDataURL(inputFile: File): Promise<string> {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onerror = () => {
                reader.abort();
                reject(new DOMException("Problem parsing input file."));
            };
            reader.onload = () => {
                resolve(reader.result as string);
            };
            reader.readAsDataURL(inputFile);
        });
    }


   const handleItemChange = (tempId: string, field: keyof EditableItem, value: string | number | boolean) => {
        setExtractedItems(prevItems =>
            prevItems.map(item =>
                item._tempId === tempId ? { ...item, [field]: value } : item
            )
        );
    };

    const toggleEdit = (tempId: string) => {
        handleItemChange(tempId, 'isEditing', !extractedItems.find(item => item._tempId === tempId)?.isEditing);
    }

   const handleSaveEdit = (tempId: string) => {
        // Perform validation before saving if necessary
         const itemToSave = extractedItems.find(item => item._tempId === tempId);
         if (!itemToSave?.description || itemToSave.amount <= 0 || !itemToSave.categoryId) {
             toast({ title: "Invalid Data", description: "Please provide description, positive amount, and category.", variant: "destructive" });
             return;
         }
         // Update original items state as well after saving edit
         setOriginalItems(prev => prev.map(item => item._tempId === tempId ? { ...extractedItems.find(i => i._tempId === tempId)! } : item));
        toggleEdit(tempId); // Toggle back display mode
    }

    const handleCancelEdit = (tempId: string) => {
        // Restore original values from originalItems state
        const originalItem = originalItems.find(item => item._tempId === tempId);
        if (originalItem) {
            setExtractedItems(prev => prev.map(item => item._tempId === tempId ? { ...originalItem, isEditing: false } : item));
        } else {
            // Fallback if original somehow not found (shouldn't happen)
            toggleEdit(tempId);
        }
    }


  const handleDeleteItem = (tempId: string) => {
    setExtractedItems(prevItems => prevItems.filter(item => item._tempId !== tempId));
    setOriginalItems(prevItems => prevItems.filter(item => item._tempId !== tempId)); // Also remove from original
     toast({ title: "Item Removed", description: "Item removed from the list.", duration: 2000 });
  };

  const handleAddExpenses = async () => {
    if (extractedItems.length === 0) {
      toast({ title: "No Items", description: "Add items or upload a receipt first.", variant: "destructive" });
      return;
    }

     const invalidItem = extractedItems.find(item => item.isEditing || !item.categoryId || !item.description || item.amount <= 0);
     if (invalidItem) {
          if (invalidItem.isEditing) {
              toast({ title: "Unsaved Changes", description: "Please save or cancel edits before adding expenses.", variant: "destructive" });
          } else {
             toast({ title: "Validation Error", description: `Ensure all items have description, amount, and category. Issue with: "${invalidItem.description || 'N/A'}"`, variant: "destructive" });
          }
         return;
     }

    setIsSaving(true);
    try {
      const expensesToAdd: Omit<Expense, "id">[] = extractedItems.map(item => ({
        amount: item.amount,
        description: item.description,
        categoryId: item.categoryId,
        date: new Date().toISOString(), // Use current date for now
      }));

      await addExpensesBatch(expensesToAdd);

      toast({
        title: "Expenses Added",
        description: `${expensesToAdd.length} expense(s) saved successfully.`,
      });
      onOpenChange(false); // Close drawer on success
    } catch (error) {
      console.error("Failed to add expenses:", error);
      toast({
        title: "Save Error",
        description: error instanceof Error ? error.message : "Could not save expenses.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

    const isProcessing = processingStatus === ProcessingStatus.Processing;
    const showResults = (processingStatus === ProcessingStatus.Success || processingStatus === ProcessingStatus.Idle || processingStatus === ProcessingStatus.Error) && extractedItems.length > 0; // Show results even if there was an error but we have items
    const showNoItemsMessage = processingStatus === ProcessingStatus.NoItemsFound;
    const showErrorAlert = processingStatus === ProcessingStatus.Error && errorMessage;


  return (
     // Use ShadCN Sheet
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="h-[90vh] max-h-[90vh] flex flex-col p-0"> {/* Remove padding */}
        <SheetHeader className="px-6 pt-6 pb-4 border-b"> {/* Add padding and border */}
          <SheetTitle>Upload Receipt</SheetTitle>
          <SheetDescription>
            Upload image or PDF (max 10MB). AI will extract items.
          </SheetDescription>
        </SheetHeader>

         {/* Make content scrollable */}
        <ScrollArea className="flex-grow px-6 py-4">
          {/* File Input Area */}
          <div className="mb-6 space-y-2">
            <Label htmlFor="receipt-upload">Select File</Label>
            {/* Use Tailwind for layout */}
            <div className="flex flex-col sm:flex-row gap-2">
                {/* Use ShadCN Input */}
               <Input
                 id="receipt-upload"
                 type="file"
                 accept="image/jpeg,image/png,image/webp,application/pdf"
                 onChange={handleFileChange}
                 ref={fileInputRef}
                 className="flex-grow file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-primary-foreground hover:file:bg-primary/90 cursor-pointer"
                 disabled={isProcessing || isLoadingCategories || isSaving}
               />
                 {/* Use ShadCN Button */}
              <Button
                onClick={handleUpload}
                disabled={!file || isProcessing || isLoadingCategories || isSaving || processingStatus === ProcessingStatus.Success}
                className="w-full sm:w-auto bg-accent hover:bg-accent/90 text-accent-foreground"
                aria-label="Process selected file"
              >
                {isProcessing ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> // Use Lucide Loader
                ) : (
                  <Upload className="mr-2 h-4 w-4" /> // Use Lucide Upload
                )}
                Process File
              </Button>
            </div>
            {file && <p className="text-xs text-muted-foreground mt-1">Selected: {file.name}</p>}
             {isLoadingCategories && !categories.length && <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1"><Loader2 className="h-3 w-3 animate-spin" /> Loading categories...</p>}
          </div>

          {/* Processing Indicator */}
           {isProcessing && (
                <div className="flex justify-center items-center flex-col gap-2 text-muted-foreground py-10">
                    <Loader2 className="h-8 w-8 animate-spin" />
                    <p>Processing with AI...</p>
                     <p className="text-xs">(This may take a moment)</p>
                </div>
            )}

            {/* Error Message Alert */}
            {showErrorAlert && (
                 // Use ShadCN Alert
                 <Alert variant="destructive" className="my-4">
                    <AlertCircle className="h-4 w-4" /> {/* Use Lucide Icon */}
                    <AlertTitle>Processing Error</AlertTitle>
                    <AlertDescription>
                       {errorMessage}. Try again or add manually.
                    </AlertDescription>
                </Alert>
            )}

             {/* No Items Found Message Alert */}
             {showNoItemsMessage && (
                 <Alert variant="default" className="my-4 border-amber-500/50 bg-amber-50 text-amber-900 dark:border-amber-500/60 dark:bg-amber-950 dark:text-amber-200 [&>svg]:text-amber-600 dark:[&>svg]:text-amber-400">
                     <FileWarning className="h-4 w-4" /> {/* Use relevant Lucide Icon */}
                     <AlertTitle>No Items Found</AlertTitle>
                     <AlertDescription>
                         The AI couldn't find items in the receipt. Ensure the image is clear and upright, or add expenses manually.
                     </AlertDescription>
                 </Alert>
             )}


          {/* Extracted Items List */}
          {showResults && (
            <div className="space-y-3">
              <h3 className="font-semibold text-base mb-2">Extracted Items ({extractedItems.length})</h3>
              {/* <p className="text-sm text-muted-foreground mb-3">Review and edit items before adding.</p> */}
              {extractedItems.map((item) => (
                 // Use ShadCN Card styles implicitly via border/bg
                <div key={item._tempId} className="border rounded-md p-3 shadow-sm bg-card relative">
                   {item.isEditing ? (
                       // Editing State Form
                       <div className="space-y-3">
                           {/* Use grid for better alignment */}
                           <div className="grid gap-1.5">
                                <Label htmlFor={`desc-${item._tempId}`} className="text-xs">Description</Label>
                               <Input
                                    id={`desc-${item._tempId}`}
                                    value={item.description}
                                    onChange={(e) => handleItemChange(item._tempId, 'description', e.target.value)}
                                    className="text-sm h-9" // Smaller height
                                    placeholder="Item description"
                               />
                            </div>
                             <div className="grid grid-cols-2 gap-3">
                                <div className="grid gap-1.5">
                                    <Label htmlFor={`amount-${item._tempId}`} className="text-xs">Amount</Label>
                                   <Input
                                        id={`amount-${item._tempId}`}
                                        type="number"
                                        step="0.01"
                                        value={item.amount}
                                        onChange={(e) => handleItemChange(item._tempId, 'amount', parseFloat(e.target.value) || 0)}
                                        className="text-sm h-9"
                                        placeholder="0.00"
                                   />
                                </div>
                                <div className="grid gap-1.5">
                                    <Label htmlFor={`cat-${item._tempId}`} className="text-xs">Category</Label>
                                    {/* Use ShadCN Select */}
                                    <Select
                                        value={item.categoryId}
                                        onValueChange={(value) => handleItemChange(item._tempId, 'categoryId', value)}
                                    >
                                        <SelectTrigger id={`cat-${item._tempId}`} className="text-sm h-9">
                                            <SelectValue placeholder="Select..." />
                                        </SelectTrigger>
                                        <SelectContent>
                                             {isLoadingCategories && <SelectItem value="" disabled>Loading...</SelectItem>}
                                            {categories.map((cat) => (
                                                <SelectItem key={cat.id} value={cat.id} className="text-sm">{cat.name}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                             </div>
                            {/* Actions positioned absolutely */}
                            <div className="absolute top-2 right-2 flex gap-1">
                                 <Button variant="ghost" size="icon" onClick={() => handleCancelEdit(item._tempId)} aria-label="Cancel edit" className="h-7 w-7 text-muted-foreground hover:bg-secondary">
                                    <X className="h-4 w-4"/>
                                </Button>
                                <Button variant="ghost" size="icon" onClick={() => handleSaveEdit(item._tempId)} aria-label="Save edit" className="h-7 w-7 text-green-600 hover:bg-green-100 dark:hover:bg-green-900">
                                    <Check className="h-4 w-4"/>
                                </Button>
                            </div>

                       </div>
                   ) : (
                       // Display State
                     <div className="flex items-start justify-between gap-2">
                       <div className="flex-grow min-w-0 pr-16"> {/* Add padding right to avoid overlap */}
                         <p className="font-medium break-words text-sm">{item.description || <span className="text-muted-foreground italic">No description</span>}</p>
                         <p className="text-xs text-muted-foreground mt-0.5">
                            {categories.find(c => c.id === item.categoryId)?.name || <span className="text-red-500">Select category</span>}
                         </p>
                       </div>
                       <div className="absolute top-2 right-2 flex flex-col items-end flex-shrink-0">
                         <p className="font-semibold text-sm whitespace-nowrap">
                            ${item.amount?.toFixed(2) ?? '0.00'}
                         </p>
                          <div className="flex gap-1 mt-1">
                              {/* Use ShadCN Buttons with Lucide Icons */}
                            <Button variant="ghost" size="icon" onClick={() => toggleEdit(item._tempId)} className="h-7 w-7 text-muted-foreground hover:text-foreground" aria-label="Edit item">
                               <Edit2 className="h-4 w-4"/>
                            </Button>
                            <Button variant="ghost" size="icon" onClick={() => handleDeleteItem(item._tempId)} className="h-7 w-7 text-destructive hover:text-destructive/90" aria-label="Delete item">
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
        </ScrollArea>

        {/* Use ShadCN SheetFooter */}
        <SheetFooter className="px-6 py-4 border-t flex-row justify-between sm:justify-end gap-2"> {/* Ensure footer items layout correctly */}
           <SheetClose asChild>
                 {/* Use ShadCN Button */}
                <Button variant="outline" disabled={isProcessing || isSaving}>Cancel</Button>
           </SheetClose>
           {/* Use ShadCN Button */}
          <Button
            onClick={handleAddExpenses}
            disabled={extractedItems.length === 0 || isProcessing || isSaving || isLoadingCategories || !!extractedItems.find(i=> i.isEditing)}
             className="bg-primary hover:bg-primary/90 text-primary-foreground" // Use primary color
          >
            {isSaving ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" /> // Use Lucide Loader
            ) : null}
            Add Expense(s)
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
