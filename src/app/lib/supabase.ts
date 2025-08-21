import { createClient } from '@supabase/supabase-js'
import { Database } from './database.types'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
})

// クライアントサイド用
export const createClientComponentClient = () => 
  createClient<Database>(supabaseUrl, supabaseAnonKey)

// サーバーサイド用（App Router）
export { createServerComponentClient, createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'