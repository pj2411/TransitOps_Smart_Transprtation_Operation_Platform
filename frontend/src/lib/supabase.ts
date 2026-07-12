import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://hybfaqnzfqgberumjxrk.supabase.co';
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh5YmZhcW56ZnFnYmVydW1qeHJrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODM4MDE0NjcsImV4cCI6MjA5OTM3NzQ2N30.v9KdhSQOF8TN-QLzdfyO-T2qlopDrUePhE64gVRJ2W8';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
