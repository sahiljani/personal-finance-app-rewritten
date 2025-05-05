-- Create Categories Table
CREATE TABLE IF NOT EXISTS public.categories (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    name text NOT NULL UNIQUE,
    icon text
);

-- Add comment for categories table
COMMENT ON TABLE public.categories IS 'Stores expense categories defined by users.';

-- Create Expenses Table
CREATE TABLE IF NOT EXISTS public.expenses (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    amount numeric NOT NULL CHECK (amount > 0),
    description text NOT NULL,
    category_id uuid NOT NULL REFERENCES public.categories(id) ON DELETE RESTRICT, -- Restrict deletion of category if expenses exist
    date timestamp with time zone NOT NULL,
    receipt_url text
);

-- Add indexes for frequently queried columns
CREATE INDEX IF NOT EXISTS idx_expenses_date ON public.expenses(date);
CREATE INDEX IF NOT EXISTS idx_expenses_category_id ON public.expenses(category_id);

-- Add comment for expenses table
COMMENT ON TABLE public.expenses IS 'Stores individual expense records.';

-- Enable Row Level Security (RLS) on both tables
-- Note: By default, RLS prevents all access until policies are created.
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;

-- Grant usage on the schema to the anon role
-- This is often necessary for RLS policies to work correctly
GRANT USAGE ON SCHEMA public TO anon;

-- Grant permissions to the anon role (used for unauthenticated access or basic logged-in user access)
-- Adjust these based on your actual authentication/authorization needs.
-- WARNING: The policies below grant PUBLIC access for reads.
-- For production, replace these with policies based on auth.uid() if using Supabase Auth.

-- Grant SELECT access to anon role for both tables
GRANT SELECT ON TABLE public.categories TO anon;
GRANT SELECT ON TABLE public.expenses TO anon;

-- Grant INSERT, UPDATE, DELETE access to anon role for expenses
-- You might want to restrict this further based on user roles or authentication status.
GRANT INSERT, UPDATE, DELETE ON TABLE public.expenses TO anon;

-- Grant INSERT, UPDATE, DELETE access to anon role for categories (if needed, e.g., for admin functionality)
GRANT INSERT, UPDATE, DELETE ON TABLE public.categories TO anon;


-- ** Example RLS Policies (Uncomment and modify if using authentication) **

-- ** Categories Policies **
-- Example: Allow logged-in users to read all categories
-- CREATE POLICY "Allow logged-in users to read categories" ON public.categories
--   FOR SELECT USING (auth.role() = 'authenticated');

-- Example: Allow logged-in users (or specific roles) to create categories
-- CREATE POLICY "Allow authenticated users to insert categories" ON public.categories
--   FOR INSERT WITH CHECK (auth.role() = 'authenticated');
   -- Add user_id column to categories table if linking categories to users:
   -- ALTER TABLE public.categories ADD COLUMN user_id uuid REFERENCES auth.users(id);
   -- CREATE POLICY "Allow owner to manage categories" ON public.categories
   --   FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);


-- ** Expenses Policies **
-- Example: Allow logged-in users to read their own expenses
-- Add user_id column first: ALTER TABLE public.expenses ADD COLUMN user_id uuid REFERENCES auth.users(id);
-- CREATE POLICY "Allow individual user access to their own expenses" ON public.expenses
--   FOR SELECT USING (auth.uid() = user_id);

-- Example: Allow logged-in users to insert expenses linked to their user ID
-- CREATE POLICY "Allow individual user to insert their own expenses" ON public.expenses
--   FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Example: Allow owner to update/delete their expenses
-- CREATE POLICY "Allow individual user to update their own expenses" ON public.expenses
--   FOR UPDATE USING (auth.uid() = user_id);
-- CREATE POLICY "Allow individual user to delete their own expenses" ON public.expenses
--   FOR DELETE USING (auth.uid() = user_id);


-- ** Policies for Public Access (Use for testing WITHOUT AUTH or if data is truly public) **
-- These grant broad access, suitable for initial development or public data scenarios.
-- Ensure RLS is enabled on the tables first.

CREATE POLICY "Allow public read access on categories" ON public.categories
  FOR SELECT USING (true);

CREATE POLICY "Allow public read access on expenses" ON public.expenses
  FOR SELECT USING (true);

-- Allow public insert/update/delete ONLY IF ABSOLUTELY NEEDED for anonymous usage.
-- Be very careful with these in production.
CREATE POLICY "Allow public insert access on expenses" ON public.expenses
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public update access on expenses" ON public.expenses
  FOR UPDATE USING (true);

CREATE POLICY "Allow public delete access on expenses" ON public.expenses
  FOR DELETE USING (true);

-- Categories modification policies (usually restricted to authenticated users/admins)
CREATE POLICY "Allow public insert access on categories" ON public.categories
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public update access on categories" ON public.categories
  FOR UPDATE USING (true);

CREATE POLICY "Allow public delete access on categories" ON public.categories
  FOR DELETE USING (true);


-- Seed some initial categories (optional)
-- Ensure these match IDs/names used in your AI prompts if hardcoded there.
INSERT INTO public.categories (id, name, icon) VALUES
  ('outside-food', 'Outside Food', 'Utensils'),
  ('grocery', 'Grocery', 'ShoppingCart'),
  ('transportation', 'Transportation', 'Car'),
  ('housing', 'Housing', 'Home'),
  ('utilities', 'Utilities', 'Lightbulb'),
  ('entertainment', 'Entertainment', 'Ticket'),
  ('shopping', 'Shopping', 'ShoppingBag'),
  ('clothing', 'Clothing', 'Shirt'),
  ('electronics', 'Electronics', 'Smartphone'),
  ('books', 'Books', 'BookOpen'),
  ('tools', 'Tools', 'Wrench'),
  ('health', 'Health', 'HeartPulse'),
  ('other', 'Other', 'HelpCircle')
ON CONFLICT (name) DO NOTHING; -- Avoid errors if categories already exist
