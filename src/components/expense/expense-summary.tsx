
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
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";
import { getCategories } from "@/lib/actions";
import { Loader2 } from "lucide-react";

// Use CHART_COLORS defined in globals.css via CSS variables
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

    const categoryMap: { [key: string]: { name: string; value: number; fill: string; } } = {};

     const otherCategoryId = categories.find(c => c.id === 'other')?.id || 'other';

    categories.forEach((cat, index) => {
       const colorVar = BASE_CHART_COLORS[index % BASE_CHART_COLORS.length];
      categoryMap[cat.id] = { name: cat.name, value: 0, fill: `hsl(var(${colorVar}))` };
    });

    if (!categoryMap[otherCategoryId]) {
         const otherIndex = categories.length % BASE_CHART_COLORS.length;
         categoryMap[otherCategoryId] = { name: 'Other', value: 0, fill: `hsl(var(${BASE_CHART_COLORS[otherIndex]}))` };
    }

    expenses.forEach((expense) => {
      const categoryIdToUse = categoryMap[expense.categoryId] ? expense.categoryId : otherCategoryId;
      if(categoryMap[categoryIdToUse]){ // Check if exists after potential fallback
          categoryMap[categoryIdToUse].value += expense.amount;
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

  if (isLoadingCategories || expenses.length === 0) {
     return (
         <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
             <Card className="shadow-md rounded-2xl min-h-[150px] flex items-center justify-center"> {/* Updated styling */}
                 <CardContent className="p-6 text-center">
                     {isLoadingCategories ? (
                         <>
                            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground mx-auto mb-2"/>
                            <p className="text-muted-foreground">Loading summary...</p>
                         </>
                     ) : (
                         <p className="text-muted-foreground">No expenses found.</p>
                     )}
                 </CardContent>
             </Card>
             <Card className="shadow-md rounded-2xl min-h-[150px] flex items-center justify-center"> {/* Updated styling */}
                 <CardContent className="p-6 text-center">
                      {isLoadingCategories ? (
                         <>
                            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground mx-auto mb-2"/>
                            <p className="text-muted-foreground">Loading chart...</p>
                         </>
                      ) : (
                         <p className="text-muted-foreground">No expense data.</p>
                      )}
                 </CardContent>
             </Card>
         </div>
     );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
      {/* Total Expenses Card */}
      <Card className="shadow-md rounded-2xl"> {/* Updated styling */}
        <CardHeader className="pb-2"> {/* Reduced padding */}
          <CardTitle className="text-base font-semibold">Total Expenses</CardTitle> {/* Smaller title */}
          <CardDescription className="text-xs">Summary for the selected period.</CardDescription> {/* Smaller description */}
        </CardHeader>
        <CardContent className="pt-2">
            <>
                 <p className="text-2xl font-bold">${totalExpenses.toFixed(2)}</p> {/* Slightly smaller amount */}
                <p className="text-xs text-muted-foreground mt-1">{expenses.length} transaction(s)</p>
            </>
        </CardContent>
      </Card>

      {/* Expenses by Category Pie Chart */}
       {expensesByCategory.length > 0 && (
          <Card className="shadow-md rounded-2xl flex flex-col"> {/* Updated styling */}
             <CardHeader className="pb-2"> {/* Reduced padding */}
               <CardTitle className="text-base font-semibold">Expenses by Category</CardTitle> {/* Smaller title */}
                <CardDescription className="text-xs">Distribution across categories.</CardDescription> {/* Smaller description */}
             </CardHeader>
             <CardContent className="flex-1 pb-0 pt-0"> {/* Adjusted padding */}
                <ChartContainer
                  config={chartConfig}
                   className="mx-auto aspect-square max-h-[280px]" // Adjusted height
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
                       outerRadius={70} // Slightly smaller radius
                       innerRadius={45}
                       strokeWidth={1} // Thinner stroke
                     >
                       {expensesByCategory.map((entry) => (
                          <Cell key={`cell-${entry.name}`} fill={chartConfig[entry.name]?.color} />
                       ))}
                     </Pie>
                     {/* Legend positioned below */}
                     <ChartLegend
                         content={<ChartLegendContent nameKey="name" className="flex-wrap justify-center !mt-2 text-xs" />} // Adjusted margin
                      />
                   </PieChart>
                   </ResponsiveContainer>
                 </ChartContainer>
             </CardContent>
             {/* Footer removed as Legend is inside Content now */}
           </Card>
        )}

       {/* Card Placeholder if no category data */}
        {expensesByCategory.length === 0 && expenses.length > 0 && ( // Only show if there are expenses but no category data for chart
             <Card className="shadow-md rounded-2xl min-h-[150px] flex items-center justify-center"> {/* Updated styling */}
                 <CardContent className="p-6 text-center">
                    <p className="text-muted-foreground">No category data to display chart.</p>
                 </CardContent>
             </Card>
        )}
    </div>
  );
}
