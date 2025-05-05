"use client";

import * as React from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { format, parseISO, startOfMonth, endOfMonth, subMonths } from "date-fns";
import { Calendar as CalendarIcon, FilterX } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Category } from "@/lib/types";
import { Label } from "@/components/ui/label";

interface ExpenseFiltersProps {
  categories: Category[];
}

// Use a specific non-empty value for the "All Categories" option
const ALL_CATEGORIES_VALUE = "all";

export function ExpenseFilters({ categories }: ExpenseFiltersProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Get initial values from URL search params
  const initialDateFrom = searchParams.get("dateFrom");
  const initialDateTo = searchParams.get("dateTo");
  const initialCategoryId = searchParams.get("categoryId");

  // State for controlled components
  const [dateFrom, setDateFrom] = React.useState<Date | undefined>(
    initialDateFrom ? parseISO(initialDateFrom) : undefined
  );
  const [dateTo, setDateTo] = React.useState<Date | undefined>(
    initialDateTo ? parseISO(initialDateTo) : undefined
  );
   // Initialize with ALL_CATEGORIES_VALUE if no specific category is selected
   const [categoryId, setCategoryId] = React.useState<string>(initialCategoryId ?? ALL_CATEGORIES_VALUE);

   // Refs for popovers to close them programmatically
   const dateFromPopoverOpen = React.useRef(false);
   const dateToPopoverOpen = React.useRef(false);


   // Function to update URL search params
   const updateSearchParams = React.useCallback(() => {
        const current = new URLSearchParams(Array.from(searchParams.entries()));

        if (dateFrom) {
             current.set("dateFrom", format(dateFrom, "yyyy-MM-dd"));
        } else {
            current.delete("dateFrom");
        }

        if (dateTo) {
            current.set("dateTo", format(dateTo, "yyyy-MM-dd"));
        } else {
            current.delete("dateTo");
        }

        if (categoryId && categoryId !== ALL_CATEGORIES_VALUE) {
            current.set("categoryId", categoryId);
        } else {
            current.delete("categoryId");
        }

        const search = current.toString();
        const query = search ? `?${search}` : "";

        router.push(`${pathname}${query}`, { scroll: false });
   }, [dateFrom, dateTo, categoryId, searchParams, pathname, router]);

    // Update URL when filter state changes
    React.useEffect(() => {
        updateSearchParams();
    }, [dateFrom, dateTo, categoryId, updateSearchParams]);


  const clearFilters = () => {
    setDateFrom(undefined);
    setDateTo(undefined);
    setCategoryId(ALL_CATEGORIES_VALUE);
    // updateSearchParams will be triggered by useEffect
  };

   const setDateRangePreset = (preset: 'thisMonth' | 'lastMonth') => {
        const today = new Date();
        let start: Date;
        let end: Date;

        if (preset === 'thisMonth') {
            start = startOfMonth(today);
            end = endOfMonth(today);
        } else { // lastMonth
            const lastMonthDate = subMonths(today, 1);
            start = startOfMonth(lastMonthDate);
            end = endOfMonth(lastMonthDate);
        }
        setDateFrom(start);
        setDateTo(end);
        // Close popovers if open
        dateFromPopoverOpen.current = false;
        dateToPopoverOpen.current = false;
   }

   const handleDateSelect = (setter: (date: Date | undefined) => void, popoverRef: React.MutableRefObject<boolean>) => (date: Date | undefined) => {
       setter(date);
       popoverRef.current = false; // Close popover on select
   };


   const areFiltersApplied = !!dateFrom || !!dateTo || categoryId !== ALL_CATEGORIES_VALUE;

  return (
    // Use Tailwind classes for layout and styling
    <div className="flex flex-col md:flex-row gap-3 md:gap-4 md:items-end p-4 border rounded-lg bg-card shadow-sm">
      {/* Date Range Picker */}
      <div className="flex flex-col sm:flex-row gap-3 md:gap-2 items-start sm:items-end">
         {/* From Date */}
         <div className="grid w-full sm:w-auto gap-1.5">
            <Label htmlFor="date-from-popover" className="text-xs">From</Label>
            <Popover open={dateFromPopoverOpen.current} onOpenChange={(open) => dateFromPopoverOpen.current = open}>
              <PopoverTrigger asChild>
                <Button
                  id="date-from-popover"
                  variant={"outline"}
                  className={cn(
                    "w-full sm:w-[160px] md:w-[180px] justify-start text-left font-normal text-xs h-9", // Smaller height and text
                    !dateFrom && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-1.5 h-3.5 w-3.5" /> {/* Smaller icon */}
                  {dateFrom ? format(dateFrom, "MMM d, yyyy") : <span>Start date</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={dateFrom}
                  onSelect={handleDateSelect(setDateFrom, dateFromPopoverOpen)}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
         </div>
          {/* To Date */}
         <div className="grid w-full sm:w-auto gap-1.5">
             <Label htmlFor="date-to-popover" className="text-xs">To</Label>
             <Popover open={dateToPopoverOpen.current} onOpenChange={(open) => dateToPopoverOpen.current = open}>
              <PopoverTrigger asChild>
                <Button
                  id="date-to-popover"
                  variant={"outline"}
                  className={cn(
                    "w-full sm:w-[160px] md:w-[180px] justify-start text-left font-normal text-xs h-9", // Smaller height and text
                    !dateTo && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-1.5 h-3.5 w-3.5" /> {/* Smaller icon */}
                  {dateTo ? format(dateTo, "MMM d, yyyy") : <span>End date</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={dateTo}
                  onSelect={handleDateSelect(setDateTo, dateToPopoverOpen)}
                  initialFocus
                  disabled={(date) =>
                    dateFrom ? date < dateFrom : false
                  }
                />
              </PopoverContent>
            </Popover>
         </div>
      </div>

        {/* Date Presets */}
        <div className="flex gap-2 items-center mt-2 sm:mt-0">
             <Button variant="ghost" size="sm" className="text-xs h-8" onClick={() => setDateRangePreset('thisMonth')}>This Month</Button>
            <Button variant="ghost" size="sm" className="text-xs h-8" onClick={() => setDateRangePreset('lastMonth')}>Last Month</Button>
        </div>


      {/* Category Select */}
      <div className="grid w-full md:w-auto md:min-w-[180px] gap-1.5 mt-2 md:mt-0">
          <Label htmlFor="category-select" className="text-xs">Category</Label>
         <Select value={categoryId} onValueChange={setCategoryId}>
           <SelectTrigger id="category-select" className="h-9 text-xs"> {/* Smaller height and text */}
             <SelectValue placeholder="All Categories" />
           </SelectTrigger>
           <SelectContent>
             <SelectItem value={ALL_CATEGORIES_VALUE} className="text-xs">All Categories</SelectItem>
             {categories.map((category) => (
               <SelectItem key={category.id} value={category.id} className="text-xs">
                 {category.name}
               </SelectItem>
             ))}
           </SelectContent>
         </Select>
      </div>

        {/* Clear Filters Button */}
       {areFiltersApplied && (
         <Button variant="ghost" onClick={clearFilters} size="sm" className="text-muted-foreground hover:text-destructive h-8 text-xs mt-2 md:mt-0 self-end md:self-auto">
             <FilterX className="mr-1 h-3.5 w-3.5" /> {/* Smaller icon */}
            Clear
        </Button>
       )}
    </div>
  );
}
