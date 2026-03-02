import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://jilopuugwyrqogoxlxjo.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_IdoGcGM61fuk6JhT88wOeg_JlwFjtxz";

export const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    storage: localStorage,
    persistSession: true,
    autoRefreshToken: true,
  }
});
