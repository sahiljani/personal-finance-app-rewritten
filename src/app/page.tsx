
'use client';

import { getExpenses, getCategories, createRequiredTables } from '@/lib/actions'; // Updated import
import { useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { ExpenseList } from '@/components/expense/expense-list';
import { ExpenseFilters } from '@/components/expense/expense-filters';
import { ExpenseSummaryCard } from '@/components/expense/expense-summary-card'; // Import the new card
import { Suspense } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { DesktopActions } from '@/components/navigation/desktop-actions'; // Import DesktopActions
import type { Category } from '@/lib/types'; // Import Category type

export const dynamic = 'force-dynamic'; // Ensure data is fetched fresh on each request

// Separate component for data fetching and state management
function HomePageContent() {
  const searchParams = useSearchParams();
  const dateFrom = searchParams.get('dateFrom') || undefined;
  const dateTo = searchParams.get('dateTo') || undefined;
  const categoryId = searchParams.get('categoryId') || undefined;

  const [allExpenses, setAllExpenses] = useState<Expense[]>([]);
  const [filteredExpenses, setFilteredExpenses] = useState<Expense[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [dbStatus, setDbStatus] = useState<{ tableCreated: boolean | null, getCategories: boolean | Category[] | null } | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const checkDbConnectionAndFetchData = async () => {
      setIsLoading(true);
      setError(null); // Reset error state
      try {
        // 1. Check/Create Tables and Seed Categories
        const tableCreationSuccess = await createRequiredTables(); // Use the correct function name
        setDbStatus({ tableCreated: tableCreationSuccess, getCategories: null });

        if (!tableCreationSuccess) {
             console.warn("Database table check/creation failed. Data fetching might fail.");
             // Optionally set an error state here if table creation is critical
             // setError("Database setup failed. Please check the console.");
             // setIsLoading(false); // Stop loading if setup fails critically
             // return;
        }

        // 2. Fetch Data (even if table creation had issues, attempt to fetch)
        const [allExpensesData, filteredExpensesData, categoriesData] = await Promise.all([
          getExpenses(),
          getExpenses({ dateFrom, dateTo, categoryId }),
          getCategories(),
        ]);

        setAllExpenses(allExpensesData);
        setFilteredExpenses(filteredExpensesData);
        setCategories(categoriesData);

        // Update DB status for categories
         if (categoriesData === false) { // Check for explicit false which indicates DB error in getCategories
           setDbStatus((prevStatus) => ({ ...prevStatus, getCategories: false }));
           setError("Database error fetching categories."); // Set specific error
         } else if (categoriesData.length === 0 && tableCreationSuccess) { // Distinguish between empty and error
            setDbStatus((prevStatus) => ({ ...prevStatus, getCategories: true })); // Use 'true' to indicate "table exists but is empty"
            console.warn("Categories table is empty. Consider seeding initial data.");
         } else {
           setDbStatus((prevStatus) => ({ ...prevStatus, getCategories: categoriesData }));
         }

      } catch (err) {
        console.error("Error during initial data load:", err);
        const message = err instanceof Error ? err.message : "An unknown error occurred during data loading.";
        setError(message);
         // Update dbStatus to reflect errors
        setDbStatus(prev => ({
            tableCreated: prev?.tableCreated ?? null, // Keep table creation status if available
            getCategories: false // Indicate category fetch failed
        }));
      } finally {
        setIsLoading(false);
      }
    };

    checkDbConnectionAndFetchData();
  }, [dateFrom, dateTo, categoryId]); // Re-fetch when filters change

  // Render loading state
  if (isLoading) {
    return (
      <div className="container mx-auto px-4 md:px-6 flex flex-col gap-4 md:gap-6">
        <div className="flex justify-between items-center pt-2">
          <Skeleton className="h-8 w-32" />
          <div className="hidden md:flex items-center gap-3">
            <Skeleton className="h-9 w-28" />
            <Skeleton className="h-9 w-32" />
          </div>
        </div>
         <Skeleton className="h-24 w-full rounded-xl" />
         <Skeleton className="h-10 w-full rounded-lg" />
          <div className="flex justify-between items-center mt-2">
             <Skeleton className="h-6 w-24" />
          </div>
         <ExpenseListSkeleton />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 md:px-6 flex flex-col gap-4 md:gap-6">
      {/* Header Section */}
      <div className="flex justify-between items-center pt-2">
        <h1 className="text-xl md:text-2xl font-semibold text-foreground">
          Overview
        </h1>
        <DesktopActions />
      </div>

       {/* DB Status Messages - More specific */}
      {dbStatus?.tableCreated === false && !error?.includes("Database setup failed") && (
            <div className="text-yellow-600 text-sm p-2 bg-yellow-50 border border-yellow-200 rounded-md">Warning: Could not automatically verify/create database tables. Functionality might be limited. Check console & README.</div>
      )}
       {dbStatus?.getCategories === false && !error?.includes("categories") && (
           <div className="text-red-600 text-sm p-2 bg-red-50 border border-red-200 rounded-md">Error: Could not load categories from the database. Please check connection and RLS policies.</div>
       )}
       {dbStatus?.getCategories === true && ( // 'true' indicates empty table
           <div className="text-blue-600 text-sm p-2 bg-blue-50 border border-blue-200 rounded-md">Info: No categories found. Add some via the 'Add Expense' form or settings (if available).</div>
       )}
       {/* General Error Display */}
        {error && (
             <div className="text-red-600 text-sm p-2 bg-red-50 border border-red-200 rounded-md">
                <strong>Error:</strong> {error}
            </div>
        )}

      {/* Today (Compact) Summary Card */}
      <Suspense fallback={<Skeleton className="h-24 w-full rounded-xl" />}>
        <ExpenseSummaryCard expenses={allExpenses} />
      </Suspense>

      {/* Filters - Pass potentially empty categories array */}
      <ExpenseFilters categories={categories ?? []} />

      {/* Transactions/Expenses Section Header */}
      <div className="flex justify-between items-center mt-2">
        <h2 className="text-lg font-medium text-foreground">Transactions</h2>
      </div>

      {/* Expense List - Uses filtered expenses, pass potentially empty arrays */}
      <Suspense fallback={<ExpenseListSkeleton />}>
        <ExpenseList initialExpenses={filteredExpenses ?? []} categories={categories ?? []} />
      </Suspense>
    </div>
  );
}

// Main Page Component (Server Component wrapper)
export default function HomePage() {
    // Wrap the client component responsible for fetching and state
    // This ensures the main page can remain a Server Component if needed,
    // while the content handling client-side state and hooks is separate.
    return (
        <Suspense fallback={<HomePageLoadingSkeleton />}>
            <HomePageContent />
        </Suspense>
    );
}


// Skeleton for the entire page during initial load
function HomePageLoadingSkeleton() {
   return (
      <div className="container mx-auto px-4 md:px-6 flex flex-col gap-4 md:gap-6 animate-pulse">
        <div className="flex justify-between items-center pt-2">
          <Skeleton className="h-8 w-32" />
          <div className="hidden md:flex items-center gap-3">
            <Skeleton className="h-9 w-28" />
            <Skeleton className="h-9 w-32" />
          </div>
        </div>
         <Skeleton className="h-24 w-full rounded-xl" />
         <Skeleton className="h-10 w-full rounded-lg" />
          <div className="flex justify-between items-center mt-2">
             <Skeleton className="h-6 w-24" />
          </div>
         <ExpenseListSkeleton />
      </div>
    );
}


// Skeleton remains the same for ExpenseList
function ExpenseListSkeleton() {
  return (
    <div className="space-y-3">
      <Skeleton className="h-14 w-full rounded-lg" />
      <Skeleton className="h-14 w-full rounded-lg" />
      <Skeleton className="h-14 w-full rounded-lg" />
    </div>
  );
}

