# Firebase Studio (Now using Supabase)

This is a Next.js starter app in Firebase Studio, now configured to use Supabase for its database.

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
    ```

    **Important:** Replace `YOUR_SUPABASE_URL_HERE` and `YOUR_SUPABASE_ANON_KEY_HERE` with your actual credentials from your Supabase project dashboard.

3.  **Run the development server:**
    ```bash
    npm run dev
    ```

    Open [http://localhost:9002](http://localhost:9002) (or your specified port) with your browser to see the result.

## Supabase Schema

This application expects the following tables in your Supabase database:

*   **`categories`**:
    *   `id` (uuid, primary key, default: `gen_random_uuid()`)
    *   `created_at` (timestamp with time zone, default: `now()`)
    *   `name` (text, not null)
    *   `icon` (text, nullable) - Stores Lucide icon name or SVG.
*   **`expenses`**:
    *   `id` (uuid, primary key, default: `gen_random_uuid()`)
    *   `created_at` (timestamp with time zone, default: `now()`)
    *   `amount` (numeric, not null)
    *   `description` (text, not null)
    *   `category_id` (uuid, not null, foreign key to `categories.id`)
    *   `date` (timestamp with time zone, not null)
    *   `receipt_url` (text, nullable)

You might need to enable Row Level Security (RLS) and define policies if you integrate user authentication later.

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
