import { getExpenses, getCategories } from "@/lib/actions";
import { ExpenseList } from "@/components/expense/expense-list";
// Removed ExpenseSummary import
import { ExpenseFilters } from "@/components/expense/expense-filters";
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
  const [expenses, categories] = await Promise.all([
    getExpenses({ dateFrom, dateTo, categoryId }),
    getCategories(),
  ]);

  return (
    <div className="container mx-auto px-4 md:px-6 flex flex-col gap-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl md:text-3xl font-bold text-foreground">Expenses</h1>
        {/* Desktop Action Buttons (Add/Upload) - Hidden on mobile */}
        <DesktopActions />
      </div>


      <ExpenseFilters categories={categories} />

      {/* Removed ExpenseSummary section */}

      <Suspense fallback={<ExpenseListSkeleton />}>
        <ExpenseList initialExpenses={expenses} categories={categories} />
      </Suspense>
    </div>
  );
}

// Skeleton remains the same for ExpenseList
function ExpenseListSkeleton() {
    return (
        <div className="space-y-4">
             <Skeleton className="h-10 w-full rounded-lg" />
            <Skeleton className="h-16 w-full rounded-lg" />
            <Skeleton className="h-16 w-full rounded-lg" />
            <Skeleton className="h-16 w-full rounded-lg" />
        </div>
    )
}
