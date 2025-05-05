
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

  // Validate the environment variables more carefully
  if (!supabaseUrl) {
    const errorMsg = 'Missing Supabase URL. Check NEXT_PUBLIC_SUPABASE_URL in .env file. Example: https://your-project-id.supabase.co';
    console.error(errorMsg);
    throw new Error(errorMsg);
  }
   // Basic check for URL format
  try {
    new URL(supabaseUrl);
  } catch (e) {
     const errorMsg = `Invalid Supabase URL format: ${supabaseUrl}. Check NEXT_PUBLIC_SUPABASE_URL in .env file. It should look like https://your-project-id.supabase.co`;
     console.error(errorMsg);
     throw new Error(errorMsg);
  }

  if (!supabaseKey) {
     const errorMsg = 'Missing Supabase Anon Key. Check NEXT_PUBLIC_SUPABASE_ANON_KEY in .env file.';
     console.error(errorMsg);
    throw new Error(errorMsg);
  }


  // Create a Supabase client with cookie handling for server components/actions
  try {
      return createServerClient(
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
  } catch (error) {
      console.error("Failed to create Supabase client:", error);
      // Rethrow or handle the error appropriately
       throw new Error("Supabase client initialization failed. Check console logs and environment variables.");
  }
}

