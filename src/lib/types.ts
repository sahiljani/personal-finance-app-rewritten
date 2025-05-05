
/**
 * Represents a single expense entry in the frontend.
 */
export interface Expense {
  id: string; // UUID from Supabase
  amount: number;
  description: string;
  categoryId: string; // Reference to Category ID (UUID)
  date: string; // ISO 8601 date string
  receiptUrl?: string | null; // Optional URL to the uploaded receipt image/PDF
  // created_at is managed by DB, not typically needed in frontend objects unless for display
}

/**
 * Represents a category for expenses in the frontend.
 */
export interface Category {
  id: string; // UUID from Supabase
  name: string;
  icon?: string | null; // Optional: Lucide icon name or SVG string
  // created_at is managed by DB
}

/**
 * Represents an item extracted from a receipt by AI, including a suggested category.
 * Matches the structure from src/ai/flows/extract-receipt-data.ts
 */
export interface ExtractedReceiptItem {
  description: string;
  amount: number;
  categoryId: string; // Suggested category ID from AI (UUID)
}

// --- Database Specific Types (Optional but can be helpful) ---

/**
 * Represents the structure of the 'expenses' table in Supabase.
 */
export interface DbExpense {
  id: string; // uuid, primary key
  created_at: string; // timestamp with time zone, default now()
  amount: number; // numeric
  description: string; // text
  category_id: string; // uuid, foreign key to categories.id
  date: string; // timestamp with time zone
  receipt_url?: string | null; // text, nullable
  user_id?: string | null; // uuid, nullable (if using auth)
}

/**
 * Represents the structure of the 'categories' table in Supabase.
 */
export interface DbCategory {
  id: string; // uuid, primary key
  created_at: string; // timestamp with time zone, default now()
  name: string; // text, not null
  icon?: string | null; // text, nullable
  user_id?: string | null; // uuid, nullable (if using auth)
}
