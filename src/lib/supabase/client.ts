
import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'

// Define a function to create a Supabase client for server-side operations
// This function encapsulates the logic for handling cookies, essential for SSR/Server Actions
export function createClient() {
  const cookieStore = cookies()

  // Check if Supabase environment variables are set
  // IMPORTANT: Ensure these variables are correctly set in your .env file!
  // NEXT_PUBLIC_SUPABASE_URL should be like: https://your-project-id.supabase.co
  // NEXT_PUBLIC_SUPABASE_ANON_KEY should be the public anon key from your Supabase dashboard.
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // --- Debugging ---
  // Log the values read from environment variables to help diagnose issues.
  // Remove these logs in production if desired.
  console.log('Attempting to create Supabase client...');
  console.log(`NEXT_PUBLIC_SUPABASE_URL read as: ${supabaseUrl}`);
  console.log(`NEXT_PUBLIC_SUPABASE_ANON_KEY read as: ${supabaseKey ? '*** KEY PRESENT ***' : '!!! KEY MISSING !!!'}`);
  // --- End Debugging ---


  // Validate the environment variables more carefully
  if (!supabaseUrl) {
    const errorMsg = 'Missing Supabase URL. Check NEXT_PUBLIC_SUPABASE_URL in .env file. Example: https://your-project-id.supabase.co';
    console.error(`Supabase Client Error: ${errorMsg}`); // Log error server-side
    throw new Error(errorMsg);
  }

  if (!supabaseKey) {
     const errorMsg = 'Missing Supabase Anon Key. Check NEXT_PUBLIC_SUPABASE_ANON_KEY in .env file.';
     console.error(`Supabase Client Error: ${errorMsg}`); // Log error server-side
    throw new Error(errorMsg);
  }

   // Basic check for URL format *after* ensuring it's not null/undefined
  try {
    new URL(supabaseUrl);
    console.log('Supabase URL format appears valid.'); // Debug log
  } catch (e) {
     const errorMsg = `Invalid Supabase URL format: "${supabaseUrl}". Check NEXT_PUBLIC_SUPABASE_URL in .env file. It should look like https://your-project-id.supabase.co`;
     console.error(`Supabase Client Error: ${errorMsg}`); // Log error server-side
     throw new Error(errorMsg);
  }

   // Rely on Supabase client to handle invalid keys and return appropriate errors like "Invalid API key"

  // Create a Supabase client with cookie handling for server components/actions
  try {
       console.log('Calling createServerClient...'); // Debug log
       const client = createServerClient(
        supabaseUrl,
        supabaseKey,
        {
          cookies: {
            get(name: string) {
              return cookieStore.get(name)?.value
            },
            set(name: string, value: string, options: CookieOptions) {
              try {
                cookieStore.set({ name, value, ...options })
              } catch (error) {
                // The `set` method was called from a Server Component.
                // This can be ignored if you have middleware refreshing
                // user sessions.
              }
            },
            remove(name: string, options: CookieOptions) {
              try {
                cookieStore.set({ name, value: '', ...options })
              } catch (error) {
                // The `delete` method was called from a Server Component.
                // This can be ignored if you have middleware refreshing
                // user sessions.
              }
            },
          },
          // Optional: Add auth options if needed, e.g., custom storage
          // auth: {
          //   // storage: customizedStorage,
          //   // autoRefreshToken: true,
          //   // persistSession: true,
          //   // detectSessionInUrl: true,
          // },
        }
      );
      console.log('Supabase client created successfully.'); // Debug log
      return client;
  } catch (error) {
      console.error("Failed to create Supabase client:", error);
      // Rethrow or handle the error appropriately
       throw new Error(`Supabase client initialization failed: ${error instanceof Error ? error.message : 'Unknown error'}. Check console logs and environment variables.`);
  }
}

