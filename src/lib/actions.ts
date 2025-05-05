"use server";

import { type Expense, type Category, type ExtractedReceiptItem } from "@/lib/types";
import { promises as fs } from "fs";
import path from "path";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { extractReceiptData } from "@/ai/flows/extract-receipt-data"; // Assuming this AI flow exists

const expensesFilePath = path.join(process.cwd(), "data", "expenses.json");
const categoriesFilePath = path.join(process.cwd(), "data", "categories.json");

// --- Helper Functions ---

async function readJsonFile<T>(filePath: string): Promise<T[]> {
  try {
    const data = await fs.readFile(filePath, "utf-8");
    return JSON.parse(data) as T[];
  } catch (error: any) {
    // If file doesn't exist, return empty array
    if (error.code === 'ENOENT') {
      return [];
    }
    console.error(`Error reading JSON file ${filePath}:`, error);
    throw new Error(`Could not read data from ${path.basename(filePath)}`);
  }
}

async function writeJsonFile<T>(filePath: string, data: T[]): Promise<void> {
  try {
    await fs.mkdir(path.dirname(filePath), { recursive: true }); // Ensure directory exists
    await fs.writeFile(filePath, JSON.stringify(data, null, 2), "utf-8");
  } catch (error) {
    console.error(`Error writing JSON file ${filePath}:`, error);
    throw new Error(`Could not save data to ${path.basename(filePath)}`);
  }
}

// --- Data Schemas ---

const CategorySchema = z.object({
  id: z.string(),
  name: z.string().min(1, "Category name cannot be empty"),
  icon: z.string().optional(),
});

const ExpenseSchema = z.object({
  id: z.string(),
  amount: z.number().positive("Amount must be positive"),
  description: z.string().min(1, "Description cannot be empty"),
  categoryId: z.string().min(1, "Category is required"),
  date: z.string().datetime("Invalid date format"),
  receiptUrl: z.string().optional(),
});

// --- Expense Actions ---

export async function getExpenses(
  filters?: { dateFrom?: string; dateTo?: string; categoryId?: string }
): Promise<Expense[]> {
  const expenses = await readJsonFile<Expense>(expensesFilePath);

  let filteredExpenses = expenses;

  if (filters?.dateFrom) {
    filteredExpenses = filteredExpenses.filter(e => new Date(e.date) >= new Date(filters.dateFrom!));
  }
  if (filters?.dateTo) {
     // Add 1 day to include the end date fully
    const endDate = new Date(filters.dateTo);
    endDate.setDate(endDate.getDate() + 1);
    filteredExpenses = filteredExpenses.filter(e => new Date(e.date) < endDate);
  }
  if (filters?.categoryId) {
    filteredExpenses = filteredExpenses.filter(e => e.categoryId === filters.categoryId);
  }

  // Sort by date descending (most recent first)
  return filteredExpenses.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

export async function addExpense(expenseData: Omit<Expense, "id">): Promise<Expense> {
  const validatedData = ExpenseSchema.omit({ id: true }).parse(expenseData);
  const expenses = await readJsonFile<Expense>(expensesFilePath);
  const newExpense: Expense = {
    ...validatedData,
    id: `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`, // Simple unique ID
  };
  expenses.push(newExpense);
  await writeJsonFile(expensesFilePath, expenses);
  revalidatePath("/"); // Revalidate the home page where expenses are listed
  return newExpense;
}

export async function addExpensesBatch(expenseDataArray: Omit<Expense, "id">[]): Promise<Expense[]> {
    const expenses = await readJsonFile<Expense>(expensesFilePath);
    const newExpenses: Expense[] = [];

    for (const expenseData of expenseDataArray) {
        const validatedData = ExpenseSchema.omit({ id: true }).parse(expenseData);
        const newExpense: Expense = {
            ...validatedData,
            id: `${Date.now()}-${Math.random().toString(36).substring(2, 9)}-${newExpenses.length}`, // Simple unique ID
        };
        newExpenses.push(newExpense);
    }

    const updatedExpenses = [...expenses, ...newExpenses];
    await writeJsonFile(expensesFilePath, updatedExpenses);
    revalidatePath("/"); // Revalidate the home page
    return newExpenses;
}


export async function updateExpense(id: string, updates: Partial<Omit<Expense, "id">>): Promise<Expense> {
  // Validate only the provided fields
   const partialSchema = ExpenseSchema.partial().omit({ id: true });
   const validatedUpdates = partialSchema.parse(updates);

  const expenses = await readJsonFile<Expense>(expensesFilePath);
  const index = expenses.findIndex((e) => e.id === id);
  if (index === -1) {
    throw new Error("Expense not found");
  }

  const updatedExpense = { ...expenses[index], ...validatedUpdates };
   // Ensure ID remains unchanged and validate the final object
   const fullyValidatedExpense = ExpenseSchema.parse({ ...updatedExpense, id: expenses[index].id });

  expenses[index] = fullyValidatedExpense;
  await writeJsonFile(expensesFilePath, expenses);
  revalidatePath("/");
  return fullyValidatedExpense;
}

export async function deleteExpense(id: string): Promise<void> {
  const expenses = await readJsonFile<Expense>(expensesFilePath);
  const updatedExpenses = expenses.filter((e) => e.id !== id);
  if (expenses.length === updatedExpenses.length) {
    throw new Error("Expense not found for deletion");
  }
  await writeJsonFile(expensesFilePath, updatedExpenses);
  revalidatePath("/");
}


// --- Category Actions ---

export async function getCategories(): Promise<Category[]> {
  return await readJsonFile<Category>(categoriesFilePath);
}

export async function addCategory(categoryData: Omit<Category, "id">): Promise<Category> {
  const validatedData = CategorySchema.omit({ id: true }).parse(categoryData);
  const categories = await readJsonFile<Category>(categoriesFilePath);

  // Check for duplicate names (case-insensitive)
  if (categories.some(c => c.name.toLowerCase() === validatedData.name.toLowerCase())) {
      throw new Error(`Category with name "${validatedData.name}" already exists.`);
  }

  const newCategory: Category = {
    ...validatedData,
    id: validatedData.name.toLowerCase().replace(/\s+/g, "-"), // Simple slug-like ID
  };
  categories.push(newCategory);
  await writeJsonFile(categoriesFilePath, categories);
  revalidatePath("/"); // Revalidate relevant paths
  return newCategory;
}

export async function updateCategory(id: string, updates: Partial<Omit<Category, "id">>): Promise<Category> {
  const partialSchema = CategorySchema.partial().omit({ id: true });
  const validatedUpdates = partialSchema.parse(updates);

  const categories = await readJsonFile<Category>(categoriesFilePath);
  const index = categories.findIndex((c) => c.id === id);
  if (index === -1) {
    throw new Error("Category not found");
  }

   // Check for duplicate names if name is being updated
   if (validatedUpdates.name && categories.some((c, i) => i !== index && c.name.toLowerCase() === validatedUpdates.name!.toLowerCase())) {
      throw new Error(`Category with name "${validatedUpdates.name}" already exists.`);
  }


  const updatedCategory = { ...categories[index], ...validatedUpdates };
  // Ensure ID remains unchanged and validate the final object
  const fullyValidatedCategory = CategorySchema.parse({ ...updatedCategory, id: categories[index].id });


  categories[index] = fullyValidatedCategory;
  await writeJsonFile(categoriesFilePath, categories);
  revalidatePath("/");
  return fullyValidatedCategory;
}

export async function deleteCategory(id: string): Promise<void> {
    const categories = await readJsonFile<Category>(categoriesFilePath);
    const expenses = await readJsonFile<Expense>(expensesFilePath);

    // Check if any expenses use this category
    if (expenses.some(e => e.categoryId === id)) {
        throw new Error("Cannot delete category: It is currently assigned to one or more expenses.");
    }

    const updatedCategories = categories.filter((c) => c.id !== id);
    if (categories.length === updatedCategories.length) {
        throw new Error("Category not found for deletion");
    }
    await writeJsonFile(categoriesFilePath, updatedCategories);
    revalidatePath("/");
}

// --- AI Receipt Processing Action ---

export async function processReceiptFile(fileDataUri: string): Promise<ExtractedReceiptItem[]> {
    try {
        const result = await extractReceiptData({ fileDataUri });
        // Validate the output structure if needed, though the flow should handle its schema
        return result;
    } catch (error) {
        console.error("Error processing receipt with AI:", error);
        // Provide a user-friendly error message
        if (error instanceof z.ZodError) {
             throw new Error("Invalid data received from AI processing.");
        } else if (error instanceof Error) {
             throw new Error(`Failed to process receipt: ${error.message}`);
        } else {
            throw new Error("An unknown error occurred while processing the receipt.");
        }
    }
}

// --- Utility Action (Example: Suggest Category) ---
export async function suggestCategory(description: string): Promise<string | null> {
    // Basic keyword-based suggestion (can be improved with AI or history)
    const lowerDescription = description.toLowerCase();
    const categories = await getCategories();

    if (lowerDescription.includes("coffee") || lowerDescription.includes("cafe")) return categories.find(c => c.name.toLowerCase() === 'food & drink')?.id || null;
    if (lowerDescription.includes("gas") || lowerDescription.includes("fuel")) return categories.find(c => c.name.toLowerCase() === 'transportation')?.id || null;
    if (lowerDescription.includes("grocery") || lowerDescription.includes("market")) return categories.find(c => c.name.toLowerCase() === 'groceries')?.id || null;
    if (lowerDescription.includes("rent") || lowerDescription.includes("mortgage")) return categories.find(c => c.name.toLowerCase() === 'housing')?.id || null;
    // Add more rules...

    // Fallback: Look for past entries (more complex, requires reading expenses)
    // const expenses = await getExpenses();
    // const matchingExpense = expenses.find(e => e.description.toLowerCase().includes(keyword));
    // if (matchingExpense) return matchingExpense.categoryId;

    return null; // No suggestion found
}