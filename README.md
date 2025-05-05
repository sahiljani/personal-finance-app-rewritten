
# Expense Tracker Pro (Using Supabase)

This is a Next.js starter app for tracking expenses, now configured to use Supabase for its database and backend services.

To get started, take a look at `src/app/page.tsx`.

## Setup

1.  **Install dependencies:**
    ```bash
    npm install
    ```

2.  **Configure Supabase Environment Variables:**
    Create a `.env` file in the root of your project and add your Supabase Project URL and Public Anon Key:

    ```env
    # .env

    # Get these from your Supabase project settings:
    # Project Settings > API > Project URL
    NEXT_PUBLIC_SUPABASE_URL=YOUR_SUPABASE_URL_HERE

    # Project Settings > API > Project API keys > anon (public)
    NEXT_PUBLIC_SUPABASE_ANON_KEY=YOUR_SUPABASE_ANON_KEY_HERE

    # Optional: Google Generative AI API Key (if using Genkit features)
    # GOOGLE_GENAI_API_KEY=YOUR_GOOGLE_GENAI_API_KEY_HERE

    # Optional: Supabase Service Role Key (Use with extreme caution, primarily for server-side admin tasks, not usually needed for client/app actions)
    # SUPABASE_SERVICE_ROLE_KEY=YOUR_SUPABASE_SERVICE_KEY_HERE
    ```

    **Important:** Replace `YOUR_SUPABASE_URL_HERE` and `YOUR_SUPABASE_ANON_KEY_HERE` with your actual credentials from your Supabase project dashboard. **Do not use the placeholder keys.** Using the placeholder keys will result in authentication errors.

3.  **Set up Database Schema:**

    **🚨 CRITICAL STEP: You MUST create the database tables before running the app! 🚨**

    The application requires specific tables (`categories`, `expenses`) in your Supabase database. If these tables do not exist, you will encounter "relation does not exist" errors, and the app **will not function**.

    Run the SQL commands found in the `supabase/migrations` directory using **one** of the options below:

    **Option 1: Using Supabase Dashboard SQL Editor (Recommended for Beginners)**
    *   Go to your Supabase project dashboard.
    *   Navigate to the **SQL Editor** section.
    *   Click on "**New query**".
    *   Copy the entire content of the SQL file(s) located in `supabase/migrations/` (start with `0000_init_schema.sql`).
    *   Paste the SQL content into the editor.
    *   Click "**Run**".
    *   Verify that the tables (`categories`, `expenses`) were created successfully in the **Table Editor**.

    **Option 2: Using Supabase CLI (if installed)**
    *   Ensure you have the [Supabase CLI](https://supabase.com/docs/guides/cli) installed and linked to your project (`supabase login`, `supabase link --project-ref YOUR_PROJECT_ID`).
    *   From your project's root directory, run:
        ```bash
        supabase db push
        ```
    *   This command applies any pending migrations found in the `supabase/migrations` folder to your linked Supabase database.

4.  **Run the development server:**
    ```bash
    npm run dev
    ```

    Open [http://localhost:9002](http://localhost:9002) (or your specified port) with your browser to see the result.

## Supabase Schema

This application expects the following tables in your Supabase database (created by the migration `supabase/migrations/0000_init_schema.sql`):

*   **`categories`**:
    *   `id` (uuid, primary key, default: `gen_random_uuid()`)
    *   `created_at` (timestamp with time zone, default: `now()`)
    *   `name` (text, not null, unique)
    *   `icon` (text, nullable)
*   **`expenses`**:
    *   `id` (uuid, primary key, default: `gen_random_uuid()`)
    *   `created_at` (timestamp with time zone, default: `now()`)
    *   `amount` (numeric, not null, check: `amount > 0`)
    *   `description` (text, not null)
    *   `category_id` (uuid, not null, foreign key to `categories.id` ON DELETE RESTRICT)
    *   `date` (timestamp with time zone, not null)
    *   `receipt_url` (text, nullable)

**Row Level Security (RLS):**
The initial migration enables RLS on both tables and includes example policies for public access (suitable for initial testing). These allow anyone to read, insert, update, and delete data.

*   **For Production with Authentication:** You **MUST** replace the public policies with stricter ones based on `auth.uid()` to restrict access to logged-in users and their own data. See the commented-out examples in the migration file (`supabase/migrations/0000_init_schema.sql`) for guidance. Remove the public `INSERT`, `UPDATE`, `DELETE` policies if anonymous users should not modify data.

## Genkit (Optional AI Features)

If you plan to use the AI features (receipt scanning, category suggestion):

1.  Obtain an API key from Google AI Studio ([https://aistudio.google.com/app/apikey](https://aistudio.google.com/app/apikey)).
2.  Add the key to your `.env` file:
    ```env
    GOOGLE_GENAI_API_KEY=YOUR_GOOGLE_GENAI_API_KEY_HERE
    ```
3.  Run the Genkit development server in a separate terminal:
    ```bash
    npm run genkit:dev
    # or use watch mode
    # npm run genkit:watch
    ```

