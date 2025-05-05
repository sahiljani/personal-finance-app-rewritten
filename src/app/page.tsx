
import { getExpenses, getCategories } from "@/lib/actions";
import { ExpenseList } from "@/components/expense/expense-list";
import { ExpenseFilters } from "@/components/expense/expense-filters";
import { ExpenseSummaryCard } from "@/components/expense/expense-summary-card"; // Import the new card
import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { DesktopActions } from "@/components/navigation/desktop-actions"; // Import DesktopActions

export const dynamic = 'force-dynamic'; // Ensure data is fetched fresh on each request

export default async function HomePage({
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

  // Fetch data in parallel
  // Fetch *all* expenses initially for the summary card, filtering happens client-side there
  const [allExpenses, filteredExpenses, categories] = await Promise.all([
    getExpenses(), // Fetch all expenses for the summary card
    getExpenses({ dateFrom, dateTo, categoryId }), // Fetch filtered expenses for the list
    getCategories(),
  ]);

  return (
     // Use simple div container, remove Card wrappers for flatter design
    <div className="container mx-auto px-4 md:px-6 flex flex-col gap-4 md:gap-6">
       {/* Header Section - Minimal Style */}
       <div className="flex justify-between items-center pt-2"> {/* Added padding-top */}
         {/* Title matches reference style */}
        <h1 className="text-xl md:text-2xl font-semibold text-foreground">Overview</h1>
        {/* Desktop Action Buttons (Add/Upload) - Hidden on mobile */}
        <DesktopActions />
      </div>

       {/* Today (Compact) Summary Card */}
       <Suspense fallback={<Skeleton className="h-24 w-full rounded-xl" />}>
         <ExpenseSummaryCard expenses={allExpenses} />
       </Suspense>

      {/* Filters - Keep collapsible */}
      <ExpenseFilters categories={categories} />

      {/* Transactions/Expenses Section Header */}
      <div className="flex justify-between items-center mt-2">
           <h2 className="text-lg font-medium text-foreground">Transactions</h2>
           {/* Optional: Add 'View All' link if needed */}
           {/* <Link href="/all-expenses" className="text-sm text-primary hover:underline">View All</Link> */}
      </div>


      {/* Expense List - Uses filtered expenses */}
      <Suspense fallback={<ExpenseListSkeleton />}>
        <ExpenseList initialExpenses={filteredExpenses} categories={categories} />
      </Suspense>
    </div>
  );
}

// Skeleton remains the same for ExpenseList
function ExpenseListSkeleton() {
    return (
        <div className="space-y-3"> {/* Reduced spacing */}
             {/* Removed header skeleton */}
            <Skeleton className="h-14 w-full rounded-lg" /> {/* Slightly smaller */}
            <Skeleton className="h-14 w-full rounded-lg" />
            <Skeleton className="h-14 w-full rounded-lg" />
        </div>
    )
}
