
"use client";

import * as React from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { format, parseISO, startOfMonth, endOfMonth, subMonths } from "date-fns";
import { Calendar as CalendarIcon, Filter, X } from "lucide-react"; // Use Filter icon
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
import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from "@/components/ui/collapsible"; // Import Collapsible
import { Badge } from "@/components/ui/badge"; // Import Badge

interface ExpenseFiltersProps {
  categories: Category[];
}

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
  const [categoryId, setCategoryId] = React.useState<string>(initialCategoryId ?? ALL_CATEGORIES_VALUE);
  const [isFilterOpen, setIsFilterOpen] = React.useState(false); // State for Collapsible

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

        // Only push if params actually changed to avoid unnecessary renders
        if (`${pathname}${query}` !== `${pathname}${searchParams.toString() ? '?' + searchParams.toString() : ''}`) {
             router.push(`${pathname}${query}`, { scroll: false });
        }
   }, [dateFrom, dateTo, categoryId, searchParams, pathname, router]);

    // Update URL when filter state changes, but only when the collapsible section is closed or filters are cleared
    // React.useEffect(() => {
    //     // We'll call updateSearchParams manually on apply/clear or when closing the collapsible
    //     // updateSearchParams();
    // }, [dateFrom, dateTo, categoryId, updateSearchParams]);

   const applyFilters = () => {
        updateSearchParams();
        setIsFilterOpen(false); // Close collapsible on apply
   }

  const clearFilters = () => {
    setDateFrom(undefined);
    setDateTo(undefined);
    setCategoryId(ALL_CATEGORIES_VALUE);
    // Update URL immediately on clear
    const current = new URLSearchParams(); // Start fresh
    const query = ""; // No params
    router.push(`${pathname}${query}`, { scroll: false });
    setIsFilterOpen(false); // Close collapsible on clear
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

   const areFiltersApplied = !!initialDateFrom || !!initialDateTo || !!initialCategoryId;
   const filterCount = [initialDateFrom, initialDateTo, initialCategoryId].filter(Boolean).length;

  return (
    // Use Collapsible for the filter section
     <Collapsible open={isFilterOpen} onOpenChange={setIsFilterOpen} className="w-full border rounded-lg bg-card shadow-sm mb-4">
         <div className="flex items-center justify-between p-3">
             <CollapsibleTrigger asChild>
                 <Button variant="ghost" size="sm" className="flex items-center gap-2 text-sm">
                    <Filter className="h-4 w-4"/>
                    Filters
                    {filterCount > 0 && <Badge variant="secondary" className="ml-1">{filterCount}</Badge>}
                 </Button>
             </CollapsibleTrigger>
             {areFiltersApplied && (
                 <Button variant="ghost" onClick={clearFilters} size="sm" className="text-muted-foreground hover:text-destructive text-xs">
                     <X className="mr-1 h-3.5 w-3.5" />
                    Clear All
                 </Button>
             )}
         </div>

         {/* Collapsible Content */}
        <CollapsibleContent className="px-4 pb-4 pt-0 space-y-4 border-t">
             {/* Date Range Picker (Compact) */}
             <div className="grid gap-1.5 mt-4">
                <Label className="text-xs font-medium">Date Range</Label>
                 <div className="flex flex-col sm:flex-row gap-2 items-start sm:items-end">
                    {/* From Date Popover */}
                     <Popover open={dateFromPopoverOpen.current} onOpenChange={(open) => dateFromPopoverOpen.current = open}>
                       <PopoverTrigger asChild>
                         <Button
                           id="date-from-popover"
                           variant={"outline"}
                           className={cn(
                             "w-full sm:w-auto justify-start text-left font-normal text-xs h-9 flex-grow",
                             !dateFrom && "text-muted-foreground"
                           )}
                         >
                           <CalendarIcon className="mr-1.5 h-3.5 w-3.5" />
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
                     {/* To Date Popover */}
                      <Popover open={dateToPopoverOpen.current} onOpenChange={(open) => dateToPopoverOpen.current = open}>
                       <PopoverTrigger asChild>
                         <Button
                           id="date-to-popover"
                           variant={"outline"}
                           className={cn(
                             "w-full sm:w-auto justify-start text-left font-normal text-xs h-9 flex-grow",
                             !dateTo && "text-muted-foreground"
                           )}
                         >
                           <CalendarIcon className="mr-1.5 h-3.5 w-3.5" />
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
            <div className="flex gap-2 items-center flex-wrap">
                 <Label className="text-xs font-medium mr-2 shrink-0">Presets:</Label>
                <Button variant="outline" size="sm" className="text-xs h-7 px-2" onClick={() => setDateRangePreset('thisMonth')}>This Month</Button>
                <Button variant="outline" size="sm" className="text-xs h-7 px-2" onClick={() => setDateRangePreset('lastMonth')}>Last Month</Button>
            </div>


             {/* Category Select */}
            <div className="grid gap-1.5">
                <Label htmlFor="category-select" className="text-xs font-medium">Category</Label>
                <Select value={categoryId} onValueChange={setCategoryId}>
                 <SelectTrigger id="category-select" className="h-9 text-xs">
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

             {/* Apply Button */}
             <div className="flex justify-end pt-2">
                 <Button size="sm" onClick={applyFilters}>Apply Filters</Button>
             </div>
        </CollapsibleContent>
    </Collapsible>
  );
}
