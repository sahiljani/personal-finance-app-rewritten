import { getExpenses, getCategories } from "@/lib/actions";
import { ExpenseList } from "@/components/expense/expense-list";
import { ExpenseSummary } from "@/components/expense/expense-summary";
import { ExpenseFilters } from "@/components/expense/expense-filters";
import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";

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
    <div className="container mx-auto px-4 py-6 md:py-8 flex flex-col gap-6">
      <h1 className="text-2xl md:text-3xl font-bold text-foreground">Expense Tracker</h1>

      <ExpenseFilters categories={categories} />

      <Suspense fallback={<ExpenseSummarySkeleton />}>
        <ExpenseSummary expenses={expenses} />
      </Suspense>

      <Suspense fallback={<ExpenseListSkeleton />}>
        <ExpenseList initialExpenses={expenses} categories={categories} />
      </Suspense>
    </div>
  );
}

function ExpenseSummarySkeleton() {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Skeleton className="h-48 rounded-lg" />
            <Skeleton className="h-48 rounded-lg" />
        </div>
    )
}

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
