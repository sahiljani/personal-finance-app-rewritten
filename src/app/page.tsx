'use client';

import {getExpenses, getCategories, createCategoriesTable} from '@/lib/actions';
import {useSearchParams} from 'next/navigation';
import {useEffect, useState} from 'react';
import {ExpenseList} from '@/components/expense/expense-list';
import {ExpenseFilters} from '@/components/expense/expense-filters';
import {ExpenseSummaryCard} from '@/components/expense/expense-summary-card'; // Import the new card
import {Suspense} from 'react';
import {Skeleton} from '@/components/ui/skeleton';
import {DesktopActions} from '@/components/navigation/desktop-actions'; // Import DesktopActions

export const dynamic = 'force-dynamic'; // Ensure data is fetched fresh on each request

export default async function HomePage() {

  const searchParams = useSearchParams();
  const dateFrom = searchParams.get('dateFrom') || undefined;
  const dateTo = searchParams.get('dateTo') || undefined;
  const categoryId = searchParams.get('categoryId') || undefined;

  // Fetch data in parallel
  // Fetch *all* expenses initially for the summary card, filtering happens client-side there
  const [allExpenses, filteredExpenses, categories] = await Promise.all([
    getExpenses(), // Fetch all expenses for the summary card
    getExpenses({dateFrom, dateTo, categoryId}), // Fetch filtered expenses for the list
    getCategories(),
  ]);

  const [dbStatus, setDbStatus] = useState<{ tableCreated: boolean, getCategories: boolean | Category[] | null } | null>(null);

  useEffect(() => {
    const checkDbConnection = async () => {
        const tableCreatedResult = await createCategoriesTable();
        if(tableCreatedResult) {
          setDbStatus({tableCreated: true, getCategories: null})
        } else {
          setDbStatus({tableCreated: false, getCategories: null})
        }

      const getCategoriesResult = await getCategories();

      if (getCategoriesResult === false) {
        setDbStatus((prevStatus) => ({...prevStatus, getCategories: false}));
      } else if(getCategoriesResult === true){
        setDbStatus((prevStatus) => ({...prevStatus, getCategories: true}));
      } else {
        setDbStatus((prevStatus) => ({...prevStatus, getCategories: getCategoriesResult}));
      }

    };
    checkDbConnection();
  }, []);

  return (
    // Use simple div container, remove Card wrappers for flatter design
    <div className="container mx-auto px-4 md:px-6 flex flex-col gap-4 md:gap-6">
      {/* Header Section - Minimal Style */}
      <div className="flex justify-between items-center pt-2">
        {/* Added padding-top */}
        {/* Title matches reference style */}
        <h1 className="text-xl md:text-2xl font-semibold text-foreground">
          Overview
        </h1>
        {/* Desktop Action Buttons (Add/Upload) - Hidden on mobile */}
        <DesktopActions />
      </div>

        {dbStatus?.tableCreated === true && (
            <div className="text-blue-500">Categories table created successfully</div>
      )}
        {dbStatus?.tableCreated === false && (
            <div className="text-red-500">Categories table creation failed</div>
        )}
      {dbStatus?.getCategories === true && (
        <div className="text-yellow-500">Categories table not found</div>
      )}
      {dbStatus?.getCategories === false && (
        <div className="text-red-500">Database error</div>
      )}
      {Array.isArray(dbStatus?.getCategories) && dbStatus?.getCategories.length > 0 && (
        <div className="text-green-500">Categories found</div>
      )}

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
    <div className="space-y-3">
      {/* Reduced spacing */}
      {/* Removed header skeleton */}
      <Skeleton className="h-14 w-full rounded-lg" /> {/* Slightly smaller */}
      <Skeleton className="h-14 w-full rounded-lg" />
      <Skeleton className="h-14 w-full rounded-lg" />
    </div>
  );
}
