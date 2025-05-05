
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
import { Loader2, Upload, Trash2, Edit2, Check, X, AlertCircle, FileWarning, FileUp } from "lucide-react"; // Added FileUp
import type { ExtractedReceiptItem, Category, Expense } from "@/lib/types";
import { processReceiptFile, addExpensesBatch, getCategories } from "@/lib/actions";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils"; // Import cn

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
    Idle = 'idle', // Ready to select file or has file selected
    LoadingCategories = 'loading_categories',
    CategoriesLoaded = 'categories_loaded', // Categories loaded, ready to process
    Processing = 'processing',
    Success = 'success', // Processing successful, items displayed
    Error = 'error', // Processing failed or categories failed to load
    NoItemsFound = 'no_items_found' // Processing succeeded, but AI found no items
}

export function UploadReceiptDrawer({ open, onOpenChange }: UploadReceiptDrawerProps) {
  const { toast } = useToast();
  const [file, setFile] = React.useState<File | null>(null);
  const [processingStatus, setProcessingStatus] = React.useState<ProcessingStatus>(ProcessingStatus.Idle);
  const [isSaving, setIsSaving] = React.useState(false);
  const [extractedItems, setExtractedItems] = React.useState<EditableItem[]>([]);
  const [categories, setCategories] = React.useState<Category[]>([]);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  // Store original state for cancellation
  const [originalItems, setOriginalItems] = React.useState<EditableItem[]>([]);

  // Fetch categories when the drawer opens
  React.useEffect(() => {
    async function fetchCategories() {
        if (!open) {
            setProcessingStatus(ProcessingStatus.Idle); // Reset status on close
            return;
        }
        setProcessingStatus(ProcessingStatus.LoadingCategories); // Set status to loading
        setErrorMessage(null); // Clear previous errors
        try {
            const fetchedCategories = await getCategories();
            // Check if the fetched array is empty
            if (fetchedCategories.length === 0) {
                 const noCatMsg = "No expense categories found. Please add some categories in the settings before processing receipts.";
                 toast({ title: "Setup Required", description: noCatMsg, variant: "destructive", duration: 7000 });
                 setProcessingStatus(ProcessingStatus.Error); // Treat as error if no categories
                 setErrorMessage(noCatMsg);
                 setCategories([]);
                 // Optionally disable upload functionality here or show a specific UI state
            } else {
                setCategories(fetchedCategories);
                setProcessingStatus(ProcessingStatus.CategoriesLoaded); // Move to next state
            }
        } catch (error) {
            console.error("Failed to fetch categories:", error);
            const errMsg = error instanceof Error ? error.message : "Could not load categories.";
            toast({ title: "Error Loading Categories", description: errMsg, variant: "destructive" });
            setProcessingStatus(ProcessingStatus.Error); // Set error state
            setErrorMessage(errMsg);
            setCategories([]);
        }
    }
    fetchCategories();
  }, [open, toast]); // Only depends on 'open' and 'toast'

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
            setFile(null); // Clear invalid file
            if (fileInputRef.current) fileInputRef.current.value = "";
            return;
        }
         if (selectedFile.size > maxSize) {
             toast({ title: "File Too Large", description: "Max file size is 10MB.", variant: "destructive" });
             setFile(null); // Clear invalid file
             if (fileInputRef.current) fileInputRef.current.value = "";
             return;
         }

      setFile(selectedFile);
      setExtractedItems([]);
      setOriginalItems([]);
       // Reset status only if it was an error state related to category loading
       if (processingStatus === ProcessingStatus.Error && errorMessage?.includes("categor")) {
           setProcessingStatus(ProcessingStatus.CategoriesLoaded); // Assume categories are loaded now, ready for upload
           setErrorMessage(null);
       } else if (processingStatus === ProcessingStatus.NoItemsFound || processingStatus === ProcessingStatus.Success) {
           // If processing was done, allow reprocessing
           setProcessingStatus(ProcessingStatus.CategoriesLoaded);
           setErrorMessage(null);
       }
      // Keep current processing status if it's LoadingCategories or CategoriesLoaded
      // setErrorMessage(null); // Clear error message when a new file is selected? Maybe not if it's a category error.
    } else {
        // If no file selected (e.g., user cancels file dialog)
        setFile(null);
    }
  };

  const handleUpload = async () => {
    if (!file) {
      toast({ title: "No File", description: "Please select a receipt file.", variant: "destructive" });
      return;
    }
    // Ensure categories are loaded and available before proceeding
    if (processingStatus === ProcessingStatus.LoadingCategories) {
        toast({ title: "Still Initializing", description: "Categories are loading, please wait.", variant: "default" });
        return;
    }
    if (processingStatus === ProcessingStatus.Error && errorMessage?.includes("categor")) {
         toast({ title: "Setup Required", description: errorMessage, variant: "destructive" });
         return;
    }
     if (categories.length === 0 && processingStatus !== ProcessingStatus.LoadingCategories) {
          const noCatMsg = "No expense categories found. Please add some categories in the settings before processing receipts.";
          toast({ title: "Setup Required", description: noCatMsg, variant: "destructive", duration: 7000 });
          setErrorMessage(noCatMsg);
          setProcessingStatus(ProcessingStatus.Error);
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
             // Display Alert below, no separate toast needed unless preferred
        } else {
            const defaultCategoryId = categories.find(c => c.id === 'other')?.id || categories[0].id; // Fallback to first category ID
            const itemsWithTempIds = results.map((item, index) => ({
                ...item,
                amount: Number(item.amount) || 0, // Ensure amount is a number
                _tempId: `temp-${index}-${Date.now()}`, // Temporary client-side ID
                isEditing: false,
                // Validate category ID from AI, fallback to default if invalid
                categoryId: categories.some(c => c.id === item.categoryId) ? item.categoryId : defaultCategoryId,
            }));

            setExtractedItems(itemsWithTempIds);
            setOriginalItems(JSON.parse(JSON.stringify(itemsWithTempIds))); // Deep copy for reset
            setProcessingStatus(ProcessingStatus.Success);
            // Simple success message
            // toast({ title: "Receipt Processed", description: "Review the extracted items." });
        }
    } catch (error) {
      console.error("Receipt processing failed:", error);
      const message = error instanceof Error ? error.message : "Could not process the receipt.";
      setErrorMessage(message); // Set error message state for display
      setProcessingStatus(ProcessingStatus.Error);
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
         if (!itemToSave?.description || !itemToSave.amount || itemToSave.amount <= 0 || !itemToSave.categoryId) {
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
      toast({ title: "No Items", description: "No items to add.", variant: "destructive" });
      return;
    }

     const invalidItem = extractedItems.find(item => item.isEditing || !item.categoryId || !item.description || item.amount === undefined || item.amount <= 0);
     if (invalidItem) {
          if (invalidItem.isEditing) {
              toast({ title: "Unsaved Changes", description: "Please save or cancel edits before adding expenses.", variant: "destructive" });
          } else {
             toast({ title: "Validation Error", description: `Ensure all items have description, positive amount, and category. Issue with: "${invalidItem.description || 'N/A'}"`, variant: "destructive" });
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

    // Determine UI states based on processingStatus
    const isProcessingOrSaving = processingStatus === ProcessingStatus.Processing || isSaving;
    const isReadyToUpload = file && (processingStatus === ProcessingStatus.CategoriesLoaded || processingStatus === ProcessingStatus.Success || processingStatus === ProcessingStatus.NoItemsFound || (processingStatus === ProcessingStatus.Error && !errorMessage?.includes("categor")));
    const isUploadButtonDisabled = isProcessingOrSaving || processingStatus === ProcessingStatus.LoadingCategories || !file || (processingStatus === ProcessingStatus.Error && !!errorMessage?.includes("categor"));

    const showProcessingIndicator = processingStatus === ProcessingStatus.Processing;
    const showResults = (processingStatus === ProcessingStatus.Success || processingStatus === ProcessingStatus.Error || processingStatus === ProcessingStatus.NoItemsFound) && extractedItems.length > 0;
    const showNoItemsMessage = processingStatus === ProcessingStatus.NoItemsFound && extractedItems.length === 0;
    const showErrorAlert = processingStatus === ProcessingStatus.Error && errorMessage;
    const showLoadingCategories = processingStatus === ProcessingStatus.LoadingCategories;


  return (
     // Use ShadCN Sheet
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="h-[90vh] max-h-[90vh] flex flex-col p-0 rounded-t-2xl"> {/* Add rounding */}
        <SheetHeader className="px-4 sm:px-6 pt-4 pb-3 border-b"> {/* Adjust padding */}
          <SheetTitle>Upload Receipt</SheetTitle>
          <SheetDescription>
            Upload an image or PDF (max 10MB). AI will extract items. Review before saving.
          </SheetDescription>
        </SheetHeader>

         {/* Make content scrollable */}
        <ScrollArea className="flex-grow px-4 sm:px-6 py-4">
          {/* File Input Area - Improved Styling */}
          <div className="mb-4 space-y-3">
            {/* Visually hidden but accessible input */}
            <Input
                id="receipt-upload"
                type="file"
                accept="image/jpeg,image/png,image/webp,application/pdf"
                onChange={handleFileChange}
                ref={fileInputRef}
                className="sr-only" // Hide the default input
                disabled={isProcessingOrSaving || processingStatus === ProcessingStatus.LoadingCategories}
            />
             {/* Custom styled button/area for file selection */}
             <Label
                 htmlFor="receipt-upload"
                 className={cn(
                     "flex flex-col items-center justify-center w-full h-28 border-2 border-dashed rounded-lg cursor-pointer bg-card hover:bg-muted transition-colors",
                     "text-muted-foreground hover:text-foreground",
                     file && "border-primary text-primary", // Style when file is selected
                     (isProcessingOrSaving || processingStatus === ProcessingStatus.LoadingCategories) && "opacity-50 cursor-not-allowed" // Disabled style
                 )}
             >
                 <div className="flex flex-col items-center justify-center pt-5 pb-6">
                     <FileUp className={cn("w-8 h-8 mb-2", file ? "text-primary" : "text-muted-foreground")} />
                     {file ? (
                         <p className="mb-1 text-sm font-semibold truncate max-w-xs">{file.name}</p>

                     ) : (
                         <>
                           <p className="mb-1 text-sm"><span className="font-semibold">Click to upload</span> or drag & drop</p>
                           <p className="text-xs">PNG, JPG, WEBP or PDF (MAX. 10MB)</p>
                         </>
                     )}
                      {file && (
                           <Button
                               type="button"
                               variant="ghost"
                               size="sm"
                               className="text-xs text-destructive hover:text-destructive/90 h-6 px-1 mt-1"
                               onClick={(e) => {
                                   e.preventDefault(); // Prevent label click
                                   setFile(null);
                                   setExtractedItems([]);
                                   setOriginalItems([]);
                                   if (fileInputRef.current) fileInputRef.current.value = "";
                                    // Reset status intelligently
                                   if (processingStatus === ProcessingStatus.Error && errorMessage?.includes("categor")) {
                                        // Keep error state if it was category related
                                        setProcessingStatus(ProcessingStatus.Error);
                                   } else if (categories.length > 0) {
                                        setProcessingStatus(ProcessingStatus.CategoriesLoaded);
                                         setErrorMessage(null); // Clear non-category errors
                                   } else {
                                        setProcessingStatus(ProcessingStatus.Idle); // Go back to idle if no categories loaded ever
                                         setErrorMessage(null);
                                   }
                               }}
                                disabled={isProcessingOrSaving}
                           >
                               Remove File
                           </Button>
                       )}
                 </div>
             </Label>

               {/* Process Button - Only shown when file is selected and ready */}
                {isReadyToUpload && (
                     <Button
                       onClick={handleUpload}
                       disabled={isUploadButtonDisabled}
                       className="w-full sm:w-auto bg-primary hover:bg-primary/90 text-primary-foreground"
                       aria-label="Process selected file"
                     >
                       {processingStatus === ProcessingStatus.Processing ? (
                         <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                       ) : (
                         <Upload className="mr-2 h-4 w-4" />
                       )}
                       {(processingStatus === ProcessingStatus.Success || processingStatus === ProcessingStatus.NoItemsFound || processingStatus === ProcessingStatus.Error) ? 'Re-process File' : 'Process File'}
                     </Button>
                )}

                {/* Loading Categories Indicator */}
                {showLoadingCategories && (
                    <div className="flex items-center justify-center text-sm text-muted-foreground gap-2 py-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Loading categories...
                    </div>
                )}
          </div>

          {/* Processing Indicator */}
           {showProcessingIndicator && (
                <div className="flex justify-center items-center flex-col gap-2 text-muted-foreground py-10">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" /> {/* Use primary color */}
                    <p>Processing with AI...</p>
                    <p className="text-xs">(This may take a moment)</p>
                </div>
            )}

            {/* Error Message Alert */}
            {showErrorAlert && (
                 <Alert variant="destructive" className="my-4">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Error</AlertTitle>
                    <AlertDescription>
                       {errorMessage || "An unknown error occurred."}
                        {/* Add specific guidance for common errors */}
                        {errorMessage?.includes("categor") && " Please go to settings to add categories."}
                        {errorMessage?.includes("42P01") && " Please check database schema setup."}
                        {errorMessage?.includes("permission denied") && " Please check database RLS policies."}
                    </AlertDescription>
                </Alert>
            )}

             {/* No Items Found Message Alert */}
             {showNoItemsMessage && (
                 <Alert variant="default" className="my-4 border-amber-500/50 bg-amber-50 text-amber-900 dark:border-amber-500/60 dark:bg-amber-950 dark:text-amber-200 [&>svg]:text-amber-600 dark:[&>svg]:text-amber-400">
                     <FileWarning className="h-4 w-4" />
                     <AlertTitle>No Items Extracted</AlertTitle>
                     <AlertDescription>
                         The AI couldn't find items in the receipt. Ensure the image is clear and upright. You can try processing again or add expenses manually.
                     </AlertDescription>
                 </Alert>
             )}


          {/* Extracted Items List - Improved Styling */}
          {showResults && (
            <div className="space-y-2">
              <h3 className="font-semibold text-base mb-2 mt-4">Extracted Items ({extractedItems.length})</h3>
              {extractedItems.map((item) => (
                <div key={item._tempId} className="border rounded-lg p-3 bg-card relative transition-all duration-150 ease-in-out">
                   {item.isEditing ? (
                       // Editing State Form
                       <div className="space-y-3">
                            <div className="grid gap-1.5">
                                <Label htmlFor={`desc-${item._tempId}`} className="text-xs font-medium">Description</Label>
                               <Input
                                    id={`desc-${item._tempId}`}
                                    value={item.description}
                                    onChange={(e) => handleItemChange(item._tempId, 'description', e.target.value)}
                                    className="text-sm h-9"
                                    placeholder="Item description"
                               />
                            </div>
                             <div className="grid grid-cols-2 gap-3">
                                <div className="grid gap-1.5">
                                    <Label htmlFor={`amount-${item._tempId}`} className="text-xs font-medium">Amount ($)</Label>
                                   <Input
                                        id={`amount-${item._tempId}`}
                                        type="number"
                                        step="0.01"
                                        value={item.amount || ''} // Handle potential 0 or NaN
                                        onChange={(e) => handleItemChange(item._tempId, 'amount', parseFloat(e.target.value) || 0)}
                                        className="text-sm h-9"
                                        placeholder="0.00"
                                   />
                                </div>
                                <div className="grid gap-1.5">
                                    <Label htmlFor={`cat-${item._tempId}`} className="text-xs font-medium">Category</Label>
                                    <Select
                                        value={item.categoryId}
                                        onValueChange={(value) => handleItemChange(item._tempId, 'categoryId', value)}
                                        disabled={categories.length === 0}
                                    >
                                        <SelectTrigger id={`cat-${item._tempId}`} className="text-sm h-9">
                                            <SelectValue placeholder="Select..." />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {categories.map((cat) => (
                                                <SelectItem key={cat.id} value={cat.id} className="text-sm">{cat.name}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                             </div>
                            {/* Actions positioned absolutely */}
                            <div className="absolute top-1 right-1 flex gap-0.5">
                                 <Button variant="ghost" size="icon" onClick={() => handleCancelEdit(item._tempId)} aria-label="Cancel edit" className="h-7 w-7 text-muted-foreground hover:bg-secondary">
                                    <X className="h-4 w-4"/>
                                </Button>
                                <Button variant="ghost" size="icon" onClick={() => handleSaveEdit(item._tempId)} aria-label="Save edit" className="h-7 w-7 text-green-600 hover:bg-green-100 dark:hover:bg-green-900">
                                    <Check className="h-4 w-4"/>
                                </Button>
                            </div>
                       </div>
                   ) : (
                       // Display State - Cleaner Layout
                     <div className="flex items-start justify-between gap-3">
                       <div className="flex-grow min-w-0 pr-14"> {/* Add padding right to avoid overlap with buttons */}
                         <p className="font-medium break-words text-sm leading-snug">{item.description || <span className="text-muted-foreground italic">No description</span>}</p>
                         <p className="text-xs text-muted-foreground mt-1">
                            {categories.find(c => c.id === item.categoryId)?.name || <span className="text-destructive">Select category</span>}
                         </p>
                       </div>
                       <div className="absolute top-2 right-2 flex flex-col items-end flex-shrink-0">
                         <p className="font-semibold text-sm whitespace-nowrap text-right">
                            ${item.amount?.toFixed(2) ?? '0.00'}
                         </p>
                          <div className="flex gap-0.5 mt-1">
                            <Button variant="ghost" size="icon" onClick={() => toggleEdit(item._tempId)} className="h-7 w-7 text-muted-foreground hover:text-foreground" aria-label="Edit item">
                               <Edit2 className="h-3.5 w-3.5"/>
                            </Button>
                            <Button variant="ghost" size="icon" onClick={() => handleDeleteItem(item._tempId)} className="h-7 w-7 text-destructive hover:text-destructive/90" aria-label="Delete item">
                                <Trash2 className="h-3.5 w-3.5" />
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

        {/* Footer - Use ShadCN SheetFooter */}
        <SheetFooter className="px-4 sm:px-6 py-3 border-t flex flex-row justify-between sm:justify-end gap-2 items-center">
           <SheetClose asChild>
                <Button variant="outline" disabled={isProcessingOrSaving}>Cancel</Button>
           </SheetClose>
          <Button
            onClick={handleAddExpenses}
            disabled={extractedItems.length === 0 || isSaving || processingStatus === ProcessingStatus.Processing || processingStatus === ProcessingStatus.LoadingCategories || !!extractedItems.find(i=> i.isEditing)}
             className="bg-primary hover:bg-primary/90 text-primary-foreground"
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

