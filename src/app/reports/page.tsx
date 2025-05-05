
import { getExpenses, getCategories } from "@/lib/actions";
import { ExpenseSummary } from "@/components/expense/expense-summary";
import { ExpenseFilters } from "@/components/expense/expense-filters";
import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { DesktopActions } from "@/components/navigation/desktop-actions"; // Import DesktopActions
// Removed ExpenseSummaryCard import, keeping ExpenseSummary for the detailed charts

export const dynamic = 'force-dynamic'; // Ensure data is fetched fresh on each request

export default async function ReportsPage({
  searchParams,
}: {
  searchParams?: {
    dateFrom?: string;
    dateTo?: string;
    categoryId?: string;
  };
}) {
  const dateFrom = searchParams?.dateFrom;
  const dateTo = searchParams?.dateTo;
  const categoryId = searchParams?.categoryId;

  // Fetch data needed for reports
  // Fetch categories for filters
  const [expensesForReport, categories] = await Promise.all([
    getExpenses({ dateFrom, dateTo, categoryId }), // Fetch expenses based on filters for the detailed charts
    getCategories(), // Fetch categories for the filter component
  ]);

  return (
    <div className="container mx-auto px-4 md:px-6 flex flex-col gap-4 md:gap-6">
       {/* Header Section - Minimal Style */}
       <div className="flex justify-between items-center pt-2"> {/* Added padding-top */}
         {/* Title matches reference style */}
         <h1 className="text-xl md:text-2xl font-semibold text-foreground">Reports & Summary</h1>
         {/* Desktop Action Buttons (Add/Upload) - Hidden on mobile */}
         <DesktopActions />
      </div>

      {/* Filters - Keep collapsible */}
      <ExpenseFilters categories={categories} />

       {/* Analytics/Summary Section Header */}
      <div className="flex justify-between items-center mt-2">
           <h2 className="text-lg font-medium text-foreground">Analytics</h2>
           {/* Optional: Add 'View All' link or date range display */}
           {/* <span className="text-sm text-muted-foreground">For selected period</span> */}
      </div>

      {/* Expense Summary / Charts - Uses filtered expenses */}
      <Suspense fallback={<ExpenseSummarySkeleton />}>
        <ExpenseSummary expenses={expensesForReport} />
      </Suspense>

      {/* Add more report components or charts here as needed */}

    </div>
  );
}

// Skeleton for the summary/chart section
function ExpenseSummarySkeleton() {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
             {/* Adjusted height and style */}
            <Skeleton className="h-32 rounded-xl" /> {/* Use rounded-xl */}
            <Skeleton className="h-56 rounded-xl" /> {/* Use rounded-xl */}
        </div>
    )
}
