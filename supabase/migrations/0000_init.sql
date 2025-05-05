-- Create the categories table
CREATE TABLE IF NOT EXISTS public.categories (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    name text NOT NULL UNIQUE, -- Ensure category names are unique
    icon text, -- Allow null for icon
    -- Optional: Add user_id if categories are user-specific
    -- user_id uuid references auth.users(id) on delete cascade
);

-- Add comments to the categories table and columns
COMMENT ON TABLE public.categories IS 'Stores expense categories.';
COMMENT ON COLUMN public.categories.id IS 'Unique identifier for the category (UUID).';
COMMENT ON COLUMN public.categories.created_at IS 'Timestamp when the category was created.';
COMMENT ON COLUMN public.categories.name IS 'Name of the category (e.g., Grocery, Transportation).';
COMMENT ON COLUMN public.categories.icon IS 'Optional icon identifier (e.g., Lucide icon name).';
-- COMMENT ON COLUMN public.categories.user_id IS 'Foreign key referencing the user who owns this category.';


-- Create the expenses table
CREATE TABLE IF NOT EXISTS public.expenses (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    amount numeric NOT NULL CHECK (amount > 0), -- Ensure amount is positive
    description text NOT NULL,
    category_id uuid NOT NULL REFERENCES public.categories(id) ON DELETE RESTRICT, -- Restrict deletion if expenses exist
    date timestamp with time zone NOT NULL, -- Use timestamptz for date and time
    receipt_url text, -- Allow null for receipt URL
    -- Optional: Add user_id if expenses are user-specific
    -- user_id uuid references auth.users(id) on delete cascade
);

-- Add comments to the expenses table and columns
COMMENT ON TABLE public.expenses IS 'Stores individual expense records.';
COMMENT ON COLUMN public.expenses.id IS 'Unique identifier for the expense (UUID).';
COMMENT ON COLUMN public.expenses.created_at IS 'Timestamp when the expense was recorded.';
COMMENT ON COLUMN public.expenses.amount IS 'The monetary value of the expense.';
COMMENT ON COLUMN public.expenses.description IS 'A brief description of the expense.';
COMMENT ON COLUMN public.expenses.category_id IS 'Foreign key referencing the category of the expense.';
COMMENT ON COLUMN public.expenses.date IS 'Date and time when the expense occurred.';
COMMENT ON COLUMN public.expenses.receipt_url IS 'Optional URL pointing to an uploaded receipt image/PDF.';
-- COMMENT ON COLUMN public.expenses.user_id IS 'Foreign key referencing the user who recorded this expense.';


-- Optional: Enable Row Level Security (RLS) if using Supabase Auth
-- alter table public.categories enable row level security;
-- alter table public.expenses enable row level security;

-- Optional: Create RLS policies (Example: Allow users to manage their own data)
/*
create policy "Allow users to manage their own categories"
on public.categories for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "Allow users to manage their own expenses"
on public.expenses for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);
*/

-- Optional: Add indexes for frequently queried columns
CREATE INDEX IF NOT EXISTS idx_expenses_date ON public.expenses(date);
CREATE INDEX IF NOT EXISTS idx_expenses_category_id ON public.expenses(category_id);
-- CREATE INDEX IF NOT EXISTS idx_expenses_user_id ON public.expenses(user_id);
-- CREATE INDEX IF NOT EXISTS idx_categories_user_id ON public.categories(user_id);


-- Seed initial categories (optional, but recommended)
INSERT INTO public.categories (name, icon) VALUES
  ('Outside Food', 'Utensils'),
  ('Grocery', 'ShoppingCart'),
  ('Transportation', 'Car'),
  ('Housing', 'Home'),
  ('Utilities', 'Zap'),
  ('Entertainment', 'Film'),
  ('Shopping', 'ShoppingBag'),
  ('Clothing', 'Shirt'),
  ('Electronics', 'Smartphone'),
  ('Books', 'BookOpen'),
  ('Tools', 'Wrench'),
  ('Health', 'HeartPulse'),
  ('Other', 'HelpCircle')
ON CONFLICT (name) DO NOTHING; -- Avoid errors if categories already exist

