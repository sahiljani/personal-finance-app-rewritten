import { getExpenses, getCategories } from "@/lib/actions";
import { ExpenseSummary } from "@/components/expense/expense-summary";
import { ExpenseFilters } from "@/components/expense/expense-filters";
import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { DesktopActions } from "@/components/navigation/desktop-actions"; // Import DesktopActions

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
  const [expenses, categories] = await Promise.all([
    getExpenses({ dateFrom, dateTo, categoryId }), // Fetch expenses based on filters
    getCategories(), // Fetch categories for the filter component
  ]);

  return (
    <div className="container mx-auto px-4 md:px-6 flex flex-col gap-6">
       <div className="flex justify-between items-center">
         <h1 className="text-2xl md:text-3xl font-bold text-foreground">Reports & Summary</h1>
         {/* Desktop Action Buttons (Add/Upload) - Hidden on mobile */}
         <DesktopActions />
      </div>

      <ExpenseFilters categories={categories} />

      <Suspense fallback={<ExpenseSummarySkeleton />}>
        <ExpenseSummary expenses={expenses} />
      </Suspense>

      {/* Add more report components or charts here as needed */}

    </div>
  );
}

// Skeleton for the summary/chart section
function ExpenseSummarySkeleton() {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
            <Skeleton className="h-40 md:h-48 rounded-lg" />
            <Skeleton className="h-64 md:h-48 rounded-lg" /> {/* Chart might be taller */}
        </div>
    )
}
