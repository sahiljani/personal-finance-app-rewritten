/**
 * Represents a single expense entry.
 */
export interface Expense {
  id: string; // Unique identifier (e.g., timestamp + random string)
  amount: number;
  description: string;
  categoryId: string; // Reference to Category ID
  date: string; // ISO 8601 date string (e.g., "2023-10-27T10:00:00.000Z")
  receiptUrl?: string; // Optional URL to the uploaded receipt image/PDF
}

/**
 * Represents a category for expenses.
 */
export interface Category {
  id: string; // Unique identifier
  name: string;
  icon?: string; // Optional: Lucide icon name or SVG string
}

/**
 * Represents an item extracted from a receipt by AI.
 * Matches the structure from src/services/gemini.ts and src/ai/flows/extract-receipt-data.ts
 */
export interface ExtractedReceiptItem {
  description: string;
  amount: number;
}
