// lib/supabase/client.ts
import { createBrowserClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// ブラウザ（クライアントコンポーネント）から利用するためのクライアントを作成
export const supabase = createBrowserClient(supabaseUrl, supabaseAnonKey);