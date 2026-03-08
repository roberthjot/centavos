// Supabase client singleton — initialized once, reused across the app
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables. Check .env.local')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    flowType: 'pkce',          // More reliable than implicit hash flow
    detectSessionInUrl: true,  // Auto-detect ?code= after OAuth redirect
    persistSession: true,
    autoRefreshToken: true,
  },
})
