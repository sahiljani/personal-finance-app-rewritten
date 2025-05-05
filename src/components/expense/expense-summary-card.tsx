
"use client";

import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import { Calendar as CalendarIcon, Filter } from "lucide-react";
import type { Expense } from "@/lib/types";
import { cn } from "@/lib/utils";
import {
    startOfDay,
    endOfDay,
    subDays,
    startOfMonth,
    endOfMonth,
    subMonths,
    format,
    parseISO,
    isSameDay,
} from 'date-fns';

interface ExpenseSummaryCardProps {
    expenses: Expense[];
}

type RangeKey = 'today' | 'yesterday' | 'last7days' | 'thisMonth' | 'lastMonth' | 'custom';

// Helper to get date range based on key
function getDateRange(rangeKey: RangeKey, customFrom?: Date, customTo?: Date): { from?: Date, to?: Date } {
    const now = new Date();
    switch (rangeKey) {
        case 'today':
            return { from: startOfDay(now), to: endOfDay(now) };
        case 'yesterday':
            const yesterday = subDays(now, 1);
            return { from: startOfDay(yesterday), to: endOfDay(yesterday) };
        case 'last7days':
            return { from: startOfDay(subDays(now, 6)), to: endOfDay(now) }; // Includes today
        case 'thisMonth':
            return { from: startOfMonth(now), to: endOfMonth(now) };
        case 'lastMonth':
            const lastMonthStart = startOfMonth(subMonths(now, 1));
            return { from: lastMonthStart, to: endOfMonth(lastMonthStart) };
        case 'custom':
            const start = customFrom ? startOfDay(customFrom) : undefined;
            const end = customTo ? endOfDay(customTo) : undefined;
            if (start && end && end < start) {
                return { from: start, to: startOfDay(start) }; // Only use start if end is before start
            }
            return { from: start, to: end };
        default:
            return { from: startOfMonth(now), to: endOfMonth(now) };
    }
}

// Helper to format the range label
function formatRangeLabel(rangeKey: RangeKey, from?: Date, to?: Date): string {
    switch (rangeKey) {
        case 'today': return 'Today';
        case 'yesterday': return 'Yesterday';
        case 'last7days': return 'Last 7 Days';
        case 'thisMonth': return 'This Month';
        case 'lastMonth': return 'Last Month';
        case 'custom':
            if (from && to) {
                if (isSameDay(from, to)) return format(from, 'MMM d, yyyy');
                return `${format(from, 'MMM d')} - ${format(to, 'MMM d, yyyy')}`;
            } else if (from) {
                return `From ${format(from, 'MMM d, yyyy')}`;
            } else if (to) {
                return `Until ${format(to, 'MMM d, yyyy')}`;
            }
            return 'Custom Range';
        default: return 'This Month';
    }
}

export function ExpenseSummaryCard({ expenses }: ExpenseSummaryCardProps) {
    const [selectedRangeKey, setSelectedRangeKey] = React.useState<RangeKey>('thisMonth');
    const [customDateFrom, setCustomDateFrom] = React.useState<Date | undefined>(undefined);
    const [customDateTo, setCustomDateTo] = React.useState<Date | undefined>(undefined);
    const [isPopoverOpen, setIsPopoverOpen] = React.useState(false);

    const displayRange = React.useMemo(() => {
        return getDateRange(selectedRangeKey, customDateFrom, customDateTo);
    }, [selectedRangeKey, customDateFrom, customDateTo]);

    const filteredExpenses = React.useMemo(() => {
        const { from, to } = displayRange;
        return expenses.filter(expense => {
            const expenseDate = parseISO(expense.date);
            const isAfterFrom = from ? expenseDate >= from : true;
            const isBeforeTo = to ? expenseDate <= to : true;
            return isAfterFrom && isBeforeTo;
        });
    }, [expenses, displayRange]);

    const totalAmount = React.useMemo(() => {
        return filteredExpenses.reduce((sum, expense) => sum + expense.amount, 0);
    }, [filteredExpenses]);

    const transactionCount = filteredExpenses.length;
    const rangeLabel = formatRangeLabel(selectedRangeKey, displayRange.from, displayRange.to);

    const handleRangeChange = (value: string) => {
        const newRangeKey = value as RangeKey;
        setSelectedRangeKey(newRangeKey);
        if (newRangeKey !== 'custom') {
             setCustomDateFrom(undefined); // Clear custom dates if preset is selected
             setCustomDateTo(undefined);
             // Close popover for presets if desired, but maybe not for custom
             // setIsPopoverOpen(false);
        }
    };

    const handleCustomDateChange = (setter: React.Dispatch<React.SetStateAction<Date | undefined>>) => (date: Date | undefined) => {
         setter(date);
         setSelectedRangeKey('custom'); // Ensure range key is set to custom
     };

    const rangeOptions: { value: RangeKey; label: string }[] = [
        { value: 'today', label: 'Today' },
        { value: 'yesterday', label: 'Yesterday' },
        { value: 'last7days', label: 'Last 7 Days' },
        { value: 'thisMonth', label: 'This Month' },
        { value: 'lastMonth', label: 'Last Month' },
        { value: 'custom', label: 'Custom Range' },
    ];

    return (
        // Minimal card styling
        <div className="bg-card p-4 rounded-xl shadow-sm border mb-4">
            <div className="flex justify-between items-start mb-2">
                <div className="flex-grow">
                    <h2 className="text-base font-medium text-foreground">{rangeLabel}</h2>
                    <p className="text-xs text-muted-foreground">Total Spent</p>
                </div>
                <Popover open={isPopoverOpen} onOpenChange={setIsPopoverOpen}>
                    <PopoverTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8 flex-shrink-0">
                            <Filter className="h-4 w-4 text-muted-foreground" />
                            <span className="sr-only">Filter date range</span>
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-4" align="end">
                        <div className="space-y-4">
                            <RadioGroup
                                value={selectedRangeKey}
                                onValueChange={handleRangeChange}
                                className="grid gap-2"
                            >
                                {rangeOptions.map((option) => (
                                    <div key={option.value} className="flex items-center space-x-2">
                                        <RadioGroupItem value={option.value} id={`r-${option.value}`} />
                                        <Label htmlFor={`r-${option.value}`} className="text-sm font-normal cursor-pointer">
                                            {option.label}
                                        </Label>
                                    </div>
                                ))}
                            </RadioGroup>

                            {selectedRangeKey === 'custom' && (
                                <div className="space-y-2 pt-2 border-t mt-2">
                                     <p className="text-xs font-medium text-muted-foreground">Select Custom Dates:</p>
                                     <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                          {/* From Date */}
                                        <Popover>
                                             <PopoverTrigger asChild>
                                                 <Button
                                                     variant={"outline"}
                                                     size="sm"
                                                     className={cn(
                                                         "w-full justify-start text-left font-normal text-xs",
                                                         !customDateFrom && "text-muted-foreground"
                                                     )}
                                                 >
                                                     <CalendarIcon className="mr-1.5 h-3.5 w-3.5" />
                                                     {customDateFrom ? format(customDateFrom, "MMM d, yy") : <span>Start date</span>}
                                                 </Button>
                                             </PopoverTrigger>
                                             <PopoverContent className="w-auto p-0">
                                                 <Calendar
                                                     mode="single"
                                                     selected={customDateFrom}
                                                     onSelect={handleCustomDateChange(setCustomDateFrom)}
                                                     initialFocus
                                                     disabled={(date) => customDateTo ? date > customDateTo : false}
                                                 />
                                             </PopoverContent>
                                         </Popover>
                                         {/* To Date */}
                                         <Popover>
                                             <PopoverTrigger asChild>
                                                 <Button
                                                     variant={"outline"}
                                                      size="sm"
                                                     className={cn(
                                                         "w-full justify-start text-left font-normal text-xs",
                                                         !customDateTo && "text-muted-foreground"
                                                     )}
                                                 >
                                                     <CalendarIcon className="mr-1.5 h-3.5 w-3.5" />
                                                     {customDateTo ? format(customDateTo, "MMM d, yy") : <span>End date</span>}
                                                 </Button>
                                             </PopoverTrigger>
                                             <PopoverContent className="w-auto p-0">
                                                 <Calendar
                                                     mode="single"
                                                     selected={customDateTo}
                                                     onSelect={handleCustomDateChange(setCustomDateTo)}
                                                     initialFocus
                                                     disabled={(date) => customDateFrom ? date < customDateFrom : false}
                                                 />
                                             </PopoverContent>
                                         </Popover>
                                     </div>
                                      <Button size="sm" onClick={() => setIsPopoverOpen(false)} className="w-full mt-2">Apply Custom Range</Button>
                                </div>
                            )}
                        </div>
                    </PopoverContent>
                </Popover>
            </div>
            <div>
                 <p className="text-2xl font-bold text-foreground">${totalAmount.toFixed(2)}</p>
                 {transactionCount > 0 && (
                     <p className="text-xs text-muted-foreground mt-0.5">
                         {transactionCount} transaction{transactionCount !== 1 ? 's' : ''}
                     </p>
                 )}
                  {transactionCount === 0 && (
                     <p className="text-xs text-muted-foreground mt-0.5">No transactions found for this period.</p>
                  )}
            </div>
        </div>
    );
}
