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
   const [categoryId, setCategoryId] = React.useState<string>(initialCategoryId ?? "");

   // Function to update URL search params
   const updateSearchParams = React.useCallback(() => {
        const current = new URLSearchParams(Array.from(searchParams.entries())); // Create mutable copy

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

        if (categoryId) {
            current.set("categoryId", categoryId);
        } else {
            current.delete("categoryId");
        }

         // Maintain other existing params if any
        const search = current.toString();
        const query = search ? `?${search}` : "";

        router.push(`${pathname}${query}`, { scroll: false }); // Use scroll: false to prevent jumping
   }, [dateFrom, dateTo, categoryId, searchParams, pathname, router]);

  // Apply filters when state changes (debounced or immediate)
  // Using useEffect for simplicity here, debounce could be added
    React.useEffect(() => {
        // We only update search params, the page component will refetch based on them
        updateSearchParams();
    }, [dateFrom, dateTo, categoryId, updateSearchParams]); // Rerun when filter states change


  const clearFilters = () => {
    setDateFrom(undefined);
    setDateTo(undefined);
    setCategoryId("");
    // updateSearchParams will be triggered by useEffect due to state changes
  };

   const setDateRangePreset = (preset: 'thisMonth' | 'lastMonth') => {
        const today = new Date();
        let start: Date;
        let end: Date;

        if (preset === 'thisMonth') {
            start = startOfMonth(today);
            end = endOfMonth(today); // Or just today for up-to-today
        } else { // lastMonth
            const lastMonthDate = subMonths(today, 1);
            start = startOfMonth(lastMonthDate);
            end = endOfMonth(lastMonthDate);
        }
        setDateFrom(start);
        setDateTo(end);
   }

  const areFiltersApplied = !!dateFrom || !!dateTo || !!categoryId;

  return (
    <div className="flex flex-col md:flex-row gap-4 md:items-end p-4 border rounded-lg bg-card shadow-sm">
      {/* Date Range Picker */}
      <div className="flex flex-col md:flex-row gap-2 items-center">
         <div className="w-full md:w-auto">
            <Label htmlFor="date-from-popover">From</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  id="date-from-popover"
                  variant={"outline"}
                  className={cn(
                    "w-full md:w-[180px] justify-start text-left font-normal",
                    !dateFrom && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {dateFrom ? format(dateFrom, "PPP") : <span>Pick a start date</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={dateFrom}
                  onSelect={setDateFrom}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
         </div>
         <div className="w-full md:w-auto">
             <Label htmlFor="date-to-popover">To</Label>
             <Popover>
              <PopoverTrigger asChild>
                <Button
                  id="date-to-popover"
                  variant={"outline"}
                  className={cn(
                    "w-full md:w-[180px] justify-start text-left font-normal",
                    !dateTo && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {dateTo ? format(dateTo, "PPP") : <span>Pick an end date</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={dateTo}
                  onSelect={setDateTo}
                  initialFocus
                  disabled={(date) =>
                    dateFrom ? date < dateFrom : false // Disable dates before start date
                  }
                />
              </PopoverContent>
            </Popover>
         </div>
      </div>

        {/* Date Presets */}
        <div className="flex gap-2 items-center">
             <Button variant="ghost" size="sm" onClick={() => setDateRangePreset('thisMonth')}>This Month</Button>
            <Button variant="ghost" size="sm" onClick={() => setDateRangePreset('lastMonth')}>Last Month</Button>
        </div>


      {/* Category Select */}
      <div className="w-full md:w-auto md:min-w-[200px]">
          <Label htmlFor="category-select">Category</Label>
         <Select value={categoryId} onValueChange={setCategoryId}>
           <SelectTrigger id="category-select">
             <SelectValue placeholder="All Categories" />
           </SelectTrigger>
           <SelectContent>
             <SelectItem value="">All Categories</SelectItem>
             {categories.map((category) => (
               <SelectItem key={category.id} value={category.id}>
                 {category.name}
               </SelectItem>
             ))}
           </SelectContent>
         </Select>
      </div>

        {/* Clear Filters Button */}
       {areFiltersApplied && (
         <Button variant="ghost" onClick={clearFilters} size="sm" className="text-muted-foreground hover:text-destructive">
             <FilterX className="mr-1 h-4 w-4" />
            Clear Filters
        </Button>
       )}
    </div>
  );
}
