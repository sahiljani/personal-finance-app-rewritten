
"use client";

import * as React from "react";
import type { Expense, Category } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"; // Keep Card for overall section if needed, or remove later
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartConfig,
  ChartLegend,
  ChartLegendContent
} from "@/components/ui/chart";
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";
import { getCategories } from "@/lib/actions";
import { Loader2 } from "lucide-react";

// Use CHART_COLORS defined in globals.css via CSS variables
const BASE_CHART_COLORS = [
  '--chart-1', // Purple
  '--chart-2', // Orange
  '--chart-3', // Muted Blue/Grey
  '--chart-4', // Lighter Purple
  '--chart-5', // Light Muted Blue/Grey
  '--muted', // Fallback color
];

interface ExpenseSummaryProps {
  expenses: Expense[];
}

export function ExpenseSummary({ expenses }: ExpenseSummaryProps) {
    const [categories, setCategories] = React.useState<Category[]>([]);
    const [isLoadingCategories, setIsLoadingCategories] = React.useState(true);

    React.useEffect(() => {
        async function fetchCategories() {
            setIsLoadingCategories(true);
            try {
                const fetchedCategories = await getCategories();
                setCategories(fetchedCategories);
            } catch (error) {
                console.error("Failed to fetch categories for summary:", error);
            } finally {
                setIsLoadingCategories(false);
            }
        }
        fetchCategories();
    }, []);


  const totalExpenses = expenses.reduce((sum, expense) => sum + expense.amount, 0);

  const expensesByCategory = React.useMemo(() => {
    if (isLoadingCategories || categories.length === 0) return [];

    const categoryMap: { [key: string]: { name: string; value: number; fill: string; } } = {};

     const otherCategoryId = categories.find(c => c.id === 'other')?.id || 'other';

    categories.forEach((cat, index) => {
       const colorVar = BASE_CHART_COLORS[index % BASE_CHART_COLORS.length];
      categoryMap[cat.id] = { name: cat.name, value: 0, fill: `hsl(var(${colorVar}))` };
    });

    // Ensure 'Other' category exists if not explicitly defined or if fallback needed
    if (!categoryMap[otherCategoryId]) {
         const otherIndex = categories.length % BASE_CHART_COLORS.length;
         categoryMap[otherCategoryId] = { name: 'Other', value: 0, fill: `hsl(var(${BASE_CHART_COLORS[otherIndex]}))` };
    }


    expenses.forEach((expense) => {
      // Fallback to 'other' if expense category doesn't exist in fetched categories
      const categoryIdToUse = categoryMap[expense.categoryId] ? expense.categoryId : otherCategoryId;
       if(categoryMap[categoryIdToUse]){
           categoryMap[categoryIdToUse].value += expense.amount;
       } else {
           // This case should ideally not happen if 'other' fallback is robust
           console.warn(`Category ID ${expense.categoryId} not found in map, even after fallback.`);
           // Optionally add to 'Other' anyway
           // categoryMap[otherCategoryId].value += expense.amount;
       }
    });

    return Object.values(categoryMap)
                 .filter(cat => cat.value > 0)
                 .sort((a, b) => b.value - a.value);

  }, [expenses, categories, isLoadingCategories]);

   const chartConfig = React.useMemo(() => {
        const config: ChartConfig = {};
        expensesByCategory.forEach((item) => {
            config[item.name] = {
                label: item.name,
                color: item.fill,
            };
        });
        return config;
    }, [expensesByCategory]);

   // Loading / No Data State - Minimal design
  if (isLoadingCategories || expenses.length === 0) {
     return (
         <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
             {/* Simplified Loading/No Data blocks */}
             <div className="rounded-xl bg-card p-6 min-h-[120px] flex items-center justify-center">
                 {isLoadingCategories ? (
                     <div className="text-center text-muted-foreground">
                         <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2"/>
                         <p>Loading summary...</p>
                     </div>
                 ) : (
                      <p className="text-muted-foreground">No expenses found.</p>
                 )}
             </div>
             <div className="rounded-xl bg-card p-6 min-h-[120px] flex items-center justify-center">
                 {isLoadingCategories ? (
                     <div className="text-center text-muted-foreground">
                         <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2"/>
                          <p>Loading chart...</p>
                     </div>
                 ) : (
                      <p className="text-muted-foreground">No expense data.</p>
                 )}
             </div>
         </div>
     );
  }

  return (
    // Remove outer Card, use grid directly for flatter layout
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
      {/* Total Expenses - Flat style */}
      <div className="bg-primary/10 p-4 rounded-xl"> {/* Use primary color with opacity */}
         <p className="text-sm font-medium text-primary">Total Spend</p> {/* Match reference style */}
         <p className="text-2xl font-bold text-foreground mt-1">${totalExpenses.toFixed(2)}</p>
         <p className="text-xs text-muted-foreground mt-0.5">{expenses.length} transaction(s) this period</p>
      </div>


      {/* Expenses by Category Pie Chart - Flat style */}
       {expensesByCategory.length > 0 ? (
            // Use Card for chart containment, but simplify header/footer
           <Card className="shadow-sm rounded-xl flex flex-col"> {/* Use consistent rounding */}
                {/* Simple Header */}
               <CardHeader className="pt-4 pb-2 px-4">
                   <CardTitle className="text-base font-medium">Expenses by Category</CardTitle>
               </CardHeader>
               <CardContent className="flex-1 pb-4 pt-0 px-2"> {/* Adjust padding */}
                   <ChartContainer
                       config={chartConfig}
                       className="mx-auto aspect-square max-h-[250px]" // Slightly smaller max height
                   >
                       <ResponsiveContainer width="100%" height="100%">
                           <PieChart>
                               <ChartTooltip
                                   cursor={false}
                                   content={<ChartTooltipContent hideLabel />}
                               />
                               <Pie
                                   data={expensesByCategory}
                                   dataKey="value"
                                   nameKey="name"
                                   cx="50%"
                                   cy="50%"
                                   innerRadius={50} // Adjust radii for donut style
                                   outerRadius={80}
                                   strokeWidth={1}
                               >
                                   {expensesByCategory.map((entry) => (
                                       <Cell key={`cell-${entry.name}`} fill={entry.fill} /> // Use fill from data
                                   ))}
                               </Pie>
                                {/* Legend positioned below */}
                                <ChartLegend
                                    content={<ChartLegendContent nameKey="name" className="flex-wrap justify-center !mt-3 text-xs" />} // Adjusted margin
                                />
                           </PieChart>
                       </ResponsiveContainer>
                   </ChartContainer>
               </CardContent>
           </Card>
        ) : (
             // Placeholder if chart data is empty but expenses exist
             <div className="rounded-xl bg-card p-6 min-h-[120px] flex items-center justify-center">
                <p className="text-muted-foreground">No category data for chart.</p>
             </div>
        )}
    </div>
  );
}
