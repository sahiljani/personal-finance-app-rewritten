
-- Create the categories table
CREATE TABLE IF NOT EXISTS public.categories (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at timestamp with time zone DEFAULT now(),
    name text NOT NULL UNIQUE, -- Ensure category names are unique
    icon text
);

-- Add comment for clarity
COMMENT ON TABLE public.categories IS 'Stores expense categories.';

-- Create the expenses table
CREATE TABLE IF NOT EXISTS public.expenses (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at timestamp with time zone DEFAULT now(),
    amount numeric NOT NULL CHECK (amount > 0), -- Ensure amount is positive
    description text NOT NULL,
    category_id uuid NOT NULL REFERENCES public.categories(id) ON DELETE RESTRICT, -- Prevent deleting category if expenses exist
    date timestamp with time zone NOT NULL,
    receipt_url text
);

-- Add indexes for faster querying
CREATE INDEX IF NOT EXISTS idx_expenses_date ON public.expenses(date);
CREATE INDEX IF NOT EXISTS idx_expenses_category_id ON public.expenses(category_id);

-- Add comment for clarity
COMMENT ON TABLE public.expenses IS 'Stores individual expense records.';

-- Optional: Seed initial categories if desired (remove if managed via UI)
-- Ensure these IDs match those used in AI flows if hardcoded there.
INSERT INTO public.categories (id, name, icon) VALUES
    ('grocery', 'Grocery', 'ShoppingCart'),
    ('outside-food', 'Outside Food', 'Utensils'),
    ('transportation', 'Transportation', 'Car'),
    ('housing', 'Housing', 'Home'),
    ('utilities', 'Utilities', 'Receipt'),
    ('entertainment', 'Entertainment', 'Ticket'),
    ('shopping', 'ShoppingBag'),
    ('clothing', 'Clothing', 'Shirt'),
    ('electronics', 'Electronics', 'Smartphone'),
    ('books', 'Books', 'BookOpen'),
    ('tools', 'Tools', 'Wrench'),
    ('health', 'Health', 'HeartPulse'),
    ('other', 'Other', 'Tag')
ON CONFLICT (name) DO NOTHING; -- Prevent duplicates if run multiple times

-- Important: Enable Row Level Security (RLS) on both tables
-- You will need to define policies later, especially if you add authentication.
-- By default, RLS is disabled, meaning data is publicly accessible if the anon key is known.
-- It's HIGHLY recommended to enable RLS early.
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;

-- Example RLS policies (if using authentication, replace with auth.uid() = user_id):
-- Allow public read access for now (adjust if auth is added)
-- CREATE POLICY "Allow public read access on categories" ON public.categories FOR SELECT USING (true);
-- CREATE POLICY "Allow public read access on expenses" ON public.expenses FOR SELECT USING (true);

-- If using authentication, policies might look like this:
-- CREATE POLICY "Allow individual insert access" ON public.expenses FOR INSERT WITH CHECK (auth.uid() = user_id);
-- CREATE POLICY "Allow individual read access" ON public.expenses FOR SELECT USING (auth.uid() = user_id);
-- CREATE POLICY "Allow individual update access" ON public.expenses FOR UPDATE USING (auth.uid() = user_id);
-- CREATE POLICY "Allow individual delete access" ON public.expenses FOR DELETE USING (auth.uid() = user_id);
-- (Similar policies would be needed for categories if user-specific categories were implemented)

