'use client';

import { getExpenses, getCategories, createRequiredTables } from '@/lib/actions'; // Use createRequiredTables
import { useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { ExpenseList } from '@/components/expense/expense-list';
import { ExpenseFilters } from '@/components/expense/expense-filters';
import { ExpenseSummaryCard } from '@/components/expense/expense-summary-card'; // Import the new card
import { Suspense } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { DesktopActions } from '@/components/navigation/desktop-actions'; // Import DesktopActions
import type { Category, Expense } from '@/lib/types'; // Import types

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
  const [dbStatus, setDbStatus] = useState<{ setupOk: boolean | null, categoriesOk: boolean | null } | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const checkDbConnectionAndFetchData = async () => {
      setIsLoading(true);
      setError(null); // Reset error state
      let setupCheckPassed = null; // Track setup status

      try {
        // 1. Check/Seed Tables (This function now primarily checks and seeds)
        console.log("Checking database setup...");
        setupCheckPassed = await createRequiredTables();
        console.log(`Database setup check result: ${setupCheckPassed}`);
        setDbStatus({ setupOk: setupCheckPassed, categoriesOk: null });

        if (!setupCheckPassed) {
             // This indicates a fundamental issue like missing tables or inability to seed.
             // It's now handled more granularly by errors in getExpenses/getCategories.
             console.warn("Database setup check failed. Data fetching might fail or tables may be missing. Check README.md.");
             // Continue fetching, but expect potential errors below.
        }

        // 2. Fetch Data (even if setup check had warnings, attempt to fetch)
        console.log("Fetching expenses and categories...");
        const [allExpensesData, filteredExpensesData, categoriesData] = await Promise.all([
          getExpenses(),
          getExpenses({ dateFrom, dateTo, categoryId }),
          getCategories(),
        ]);

        console.log("Data fetched successfully.");
        setAllExpenses(allExpensesData);
        setFilteredExpenses(filteredExpensesData);
        setCategories(categoriesData);

         // Update DB status for categories based on fetch result
         setDbStatus((prev) => ({ ...prev, categoriesOk: true }));
         if (categoriesData.length === 0) {
              console.warn("Categories table is empty. Seed data might not have run or was cleared.");
              // Display info message below if needed
         }

      } catch (err: any) {
        console.error("Error during initial data load:", err);
        const message = err?.message ?? "An unknown error occurred during data loading.";
        setError(message); // Set the specific error message

         // Update dbStatus based on the type of error
         const isSetupError = message.includes("table could not be found") || message.includes("migrations have been applied");
         setDbStatus(prev => ({
             setupOk: isSetupError ? false : (prev?.setupOk ?? null), // Mark setup as failed if table not found
             categoriesOk: message.includes("categories") ? false : (prev?.categoriesOk ?? null) // Mark categories as failed if specific error
         }));

      } finally {
        setIsLoading(false);
        console.log("Finished initial data load sequence.");
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

  // Determine if there's a critical setup error to show
  const showSetupError = dbStatus?.setupOk === false && error?.includes("table could not be found");
  const showPermissionError = error?.includes("permission denied") || error?.includes("RLS policies");
  const showAuthError = error?.includes("Authentication error");
  const showNetworkError = error?.includes("Network error");

  return (
    <div className="container mx-auto px-4 md:px-6 flex flex-col gap-4 md:gap-6">
      {/* Header Section */}
      <div className="flex justify-between items-center pt-2">
        <h1 className="text-xl md:text-2xl font-semibold text-foreground">
          Overview
        </h1>
        <DesktopActions />
      </div>

       {/* Specific Error Messages */}
       {showSetupError && (
            <div className="text-red-600 text-sm p-2 bg-red-50 border border-red-200 rounded-md">
                <strong>Database Setup Error:</strong> {error} Ensure you have run the database migrations as per the README.
            </div>
       )}
       {showPermissionError && !showSetupError && (
           <div className="text-red-600 text-sm p-2 bg-red-50 border border-red-200 rounded-md">
               <strong>Permission Error:</strong> {error} Please check your Supabase Row Level Security (RLS) policies.
           </div>
       )}
        {showAuthError && !showSetupError && !showPermissionError && (
             <div className="text-red-600 text-sm p-2 bg-red-50 border border-red-200 rounded-md">
                 <strong>Authentication Error:</strong> {error} Check your Supabase URL and Anon Key in the .env file.
             </div>
        )}
       {showNetworkError && !showSetupError && !showPermissionError && !showAuthError && (
            <div className="text-red-600 text-sm p-2 bg-red-50 border border-red-200 rounded-md">
                <strong>Network Error:</strong> {error} Could not connect to the database.
            </div>
       )}
       {/* General Error Display (if not covered above) */}
        {error && !showSetupError && !showPermissionError && !showAuthError && !showNetworkError && (
             <div className="text-red-600 text-sm p-2 bg-red-50 border border-red-200 rounded-md">
                <strong>Error:</strong> {error}
            </div>
        )}

        {/* Info message if categories are OK but empty */}
         {dbStatus?.categoriesOk && categories.length === 0 && !error && (
             <div className="text-blue-600 text-sm p-2 bg-blue-50 border border-blue-200 rounded-md">
                 Info: No categories found. Initial categories might need seeding (check console/README) or add some manually.
             </div>
         )}

      {/* Today (Compact) Summary Card */}
      <Suspense fallback={<Skeleton className="h-24 w-full rounded-xl" />}>
        <ExpenseSummaryCard expenses={allExpenses ?? []} />
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


