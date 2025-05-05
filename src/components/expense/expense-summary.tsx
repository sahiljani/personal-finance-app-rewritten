"use client";

import * as React from "react";
import type { Expense, Category } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartConfig,
  ChartLegend,
  ChartLegendContent
} from "@/components/ui/chart";
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts"; // Removed unused imports
import { getCategories } from "@/lib/actions";
import { Loader2 } from "lucide-react";

// Use CHART_COLORS defined in globals.css via CSS variables
// This array is primarily for mapping data indices to chart config keys if needed
const BASE_CHART_COLORS = [
  '--chart-1',
  '--chart-2',
  '--chart-3',
  '--chart-4',
  '--chart-5',
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

    const categoryMap: { [key: string]: { name: string; value: number; fill: string; } } = {}; // Add fill property

     const otherCategoryId = categories.find(c => c.id === 'other')?.id || 'other'; // Ensure 'other' exists

    categories.forEach((cat, index) => {
      // Assign a CSS variable color from the theme
       const colorVar = BASE_CHART_COLORS[index % BASE_CHART_COLORS.length];
      categoryMap[cat.id] = { name: cat.name, value: 0, fill: `hsl(var(${colorVar}))` };
    });

     // Ensure 'other' category has a color assigned if it wasn't in the initial list somehow
    if (!categoryMap[otherCategoryId]) {
         const otherIndex = categories.length % BASE_CHART_COLORS.length;
         categoryMap[otherCategoryId] = { name: 'Other', value: 0, fill: `hsl(var(${BASE_CHART_COLORS[otherIndex]}))` };
    }


    expenses.forEach((expense) => {
      if (categoryMap[expense.categoryId]) {
        categoryMap[expense.categoryId].value += expense.amount;
      } else {
         // Assign to 'other' if categoryId is unknown
         if (categoryMap[otherCategoryId]) {
             categoryMap[otherCategoryId].value += expense.amount;
         }
      }
    });

    // Filter out categories with zero expenses and sort by value descending
    return Object.values(categoryMap)
                 .filter(cat => cat.value > 0)
                 .sort((a, b) => b.value - a.value);

  }, [expenses, categories, isLoadingCategories]);

   // Generate chartConfig dynamically based on filtered/sorted data
   const chartConfig = React.useMemo(() => {
        const config: ChartConfig = {};
        expensesByCategory.forEach((item) => {
            config[item.name] = { // Use name as key for chart config
                label: item.name,
                color: item.fill, // Use the pre-assigned fill color
            };
        });
        return config;
    }, [expensesByCategory]);


  // No need to show anything if loading or no expenses
  if (isLoadingCategories || expenses.length === 0) {
     // Display loading state or empty state appropriately
     return (
         <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
             <Card className="shadow-sm min-h-[150px] flex items-center justify-center">
                 <CardContent className="p-6 text-center">
                     {isLoadingCategories ? (
                         <>
                            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground mx-auto mb-2"/>
                            <p className="text-muted-foreground">Loading summary...</p>
                         </>
                     ) : (
                         <p className="text-muted-foreground">No expenses found for the selected period.</p>
                     )}
                 </CardContent>
             </Card>
             {/* Placeholder for the chart card while loading/empty */}
             <Card className="shadow-sm min-h-[150px] flex items-center justify-center">
                 <CardContent className="p-6 text-center">
                      {isLoadingCategories ? (
                         <>
                            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground mx-auto mb-2"/>
                            <p className="text-muted-foreground">Loading chart...</p>
                         </>
                      ) : (
                         <p className="text-muted-foreground">No expense data to display chart.</p>
                      )}
                 </CardContent>
             </Card>
         </div>
     );
  }


  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
      {/* Total Expenses Card */}
      <Card className="shadow-sm">
        <CardHeader>
          {/* Updated heading hierarchy */}
          <CardTitle className="text-lg font-semibold">Total Expenses</CardTitle>
          <CardDescription>Summary for the selected period.</CardDescription>
        </CardHeader>
        <CardContent className="pt-2"> {/* Adjust padding */}
            <>
                 <p className="text-3xl font-bold">${totalExpenses.toFixed(2)}</p>
                <p className="text-sm text-muted-foreground mt-1">{expenses.length} transaction(s)</p>
            </>
        </CardContent>
      </Card>

      {/* Expenses by Category Pie Chart */}
       {expensesByCategory.length > 0 && (
          <Card className="shadow-sm flex flex-col">
             <CardHeader>
               {/* Updated heading hierarchy */}
               <CardTitle className="text-lg font-semibold">Expenses by Category</CardTitle>
                <CardDescription>Distribution across categories.</CardDescription>
             </CardHeader>
             <CardContent className="flex-1 pb-4 pt-2"> {/* Adjust padding */}
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
                       outerRadius={80}
                       innerRadius={50} // Donut chart
                       strokeWidth={2}
                       // Fill is handled by Cell component using chartConfig
                     >
                       {expensesByCategory.map((entry) => (
                          // Use the color defined in chartConfig
                          <Cell key={`cell-${entry.name}`} fill={chartConfig[entry.name]?.color} />
                       ))}
                     </Pie>
                     {/* Legend moved inside ChartContainer */}
                      <ChartLegend
                          content={<ChartLegendContent nameKey="name" className="flex-wrap justify-center !mt-4 text-xs" />} // Use smaller text, adjust margin
                      />
                   </PieChart>
                   </ResponsiveContainer>
                 </ChartContainer>
             </CardContent>
           </Card>
        )}

       {/* Card Placeholder if no category data */}
        {expensesByCategory.length === 0 && (
             <Card className="shadow-sm min-h-[150px] flex items-center justify-center">
                 <CardContent className="p-6 text-center">
                    <p className="text-muted-foreground">No category data to display chart.</p>
                 </CardContent>
             </Card>
        )}
    </div>
  );
}
