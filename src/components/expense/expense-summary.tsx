"use client";

import * as React from "react";
import type { Expense, Category } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"; // Added CardFooter
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartConfig,
  ChartLegend,
  ChartLegendContent
} from "@/components/ui/chart";
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid } from "recharts"; // Removed unused Tooltip, Legend
import { getCategories } from "@/lib/actions"; // Need categories for labels
import { Loader2 } from "lucide-react"; // Import Loader2

const CHART_COLORS = [
  'hsl(var(--chart-1))',
  'hsl(var(--chart-2))',
  'hsl(var(--chart-3))',
  'hsl(var(--chart-4))',
  'hsl(var(--chart-5))',
  'hsl(var(--muted))', // Add more as needed or use a generator
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

    const categoryMap: { [key: string]: { name: string; value: number } } = {};

    categories.forEach(cat => {
      categoryMap[cat.id] = { name: cat.name, value: 0 };
    });

    expenses.forEach((expense) => {
      if (categoryMap[expense.categoryId]) {
        categoryMap[expense.categoryId].value += expense.amount;
      } else {
         // Handle potential uncategorized expenses if needed
         const otherCategory = categories.find(c => c.id === 'other'); // Assuming an 'other' category id
         if (otherCategory && categoryMap[otherCategory.id]) {
             categoryMap[otherCategory.id].value += expense.amount;
         }
      }
    });

    // Filter out categories with zero expenses and sort by value descending
    return Object.values(categoryMap)
                 .filter(cat => cat.value > 0)
                 .sort((a, b) => b.value - a.value);

  }, [expenses, categories, isLoadingCategories]);

   const chartConfig = React.useMemo(() => {
        const config: ChartConfig = {};
        expensesByCategory.forEach((item, index) => {
            config[item.name] = { // Use name as key for chart config
                label: item.name,
                color: CHART_COLORS[index % CHART_COLORS.length],
            };
        });
        return config;
    }, [expensesByCategory]);


   const barChartData = React.useMemo(() => {
        // Get top 5 categories for Bar chart, group the rest into 'Other'
        const topCategories = expensesByCategory.slice(0, 5);
        const otherValue = expensesByCategory.slice(5).reduce((sum, cat) => sum + cat.value, 0);
        const data = topCategories.map(cat => ({ name: cat.name, total: cat.value }));
        if (otherValue > 0) {
            data.push({ name: "Other", total: otherValue });
        }
         if (!chartConfig["Other"] && otherValue > 0) {
           chartConfig["Other"] = { label: "Other", color: CHART_COLORS[5 % CHART_COLORS.length] }; // Ensure 'Other' has a config
         }
        return data;
    }, [expensesByCategory, chartConfig]);


  if (expenses.length === 0 && !isLoadingCategories) { // Don't show 'no data' while loading
     // Optionally return null or a message if there's no data to show
     return null;
    // return <Card><CardContent className="p-4 text-center text-muted-foreground">No expense data for summary.</CardContent></Card>;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
      {/* Total Expenses Card */}
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle>Total Expenses</CardTitle>
          <CardDescription>Summary of expenses for the selected period.</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoadingCategories ? (
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground"/>
          ) : (
            <>
                 <p className="text-3xl font-bold">${totalExpenses.toFixed(2)}</p>
                <p className="text-sm text-muted-foreground mt-1">{expenses.length} transaction(s)</p>
            </>
          )}
        </CardContent>
      </Card>

      {/* Expenses by Category Pie Chart */}
       {expensesByCategory.length > 0 && !isLoadingCategories && (
          <Card className="shadow-sm flex flex-col">
             <CardHeader>
               <CardTitle>Expenses by Category</CardTitle>
                <CardDescription>Distribution across categories.</CardDescription>
             </CardHeader>
             <CardContent className="flex-1 pb-0">
                <ChartContainer
                  config={chartConfig}
                  className="mx-auto aspect-square max-h-[250px]"
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
                       innerRadius={50} // Make it a donut chart
                       fill="hsl(var(--chart-1))" // Base color, Cell overrides below
                       strokeWidth={2}
                     >
                       {expensesByCategory.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={chartConfig[entry.name]?.color || CHART_COLORS[index % CHART_COLORS.length]} />
                       ))}
                     </Pie>
                     {/* Optional: Add Legend below chart */}
                        {/* <ChartLegend
                            content={<ChartLegendContent nameKey="name" />}
                            className="-mt-4"
                        /> */}
                   </PieChart>
                   </ResponsiveContainer>
                 </ChartContainer>
             </CardContent>
              <CardFooter className="flex-col gap-2 text-sm mt-4">
                <ChartLegend
                        content={<ChartLegendContent nameKey="name" className="flex-wrap justify-center"/>}

                />
            </CardFooter>
           </Card>
        )}

         {/* Optional: Expenses by Category Bar Chart (Top 5 + Other) */}
        {/* Uncomment if needed */}
        {/* {barChartData.length > 0 && !isLoadingCategories && (
             <Card className="shadow-sm md:col-span-2">
                <CardHeader>
                    <CardTitle>Top Categories</CardTitle>
                    <CardDescription>Spending in top categories.</CardDescription>
                </CardHeader>
                <CardContent>
                    <ChartContainer config={chartConfig} className="h-[200px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={barChartData} layout="vertical" margin={{ right: 20 }}>
                                <CartesianGrid horizontal={false} />
                                <XAxis type="number" hide />
                                <YAxis
                                    dataKey="name"
                                    type="category"
                                    tickLine={false}
                                    axisLine={false}
                                    tickMargin={10}
                                    width={80} // Adjust width as needed
                                />
                                <ChartTooltip
                                    cursor={false}
                                    content={<ChartTooltipContent indicator="line" />}
                                />
                                <Bar dataKey="total" layout="vertical" radius={4}>
                                     {barChartData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={chartConfig[entry.name]?.color || CHART_COLORS[index % CHART_COLORS.length]} />
                                     ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </ChartContainer>
                </CardContent>
            </Card>
        )} */}


        {isLoadingCategories && expenses.length > 0 && ( // Only show loading skeleton if there *are* expenses but categories are loading
             <Card className="shadow-sm flex items-center justify-center min-h-[150px]">
                <CardContent className="text-center text-muted-foreground p-4">
                    <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2"/>
                    Loading category summary...
                </CardContent>
            </Card>
        )}
    </div>
  );
}
