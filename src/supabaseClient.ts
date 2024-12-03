import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://giubtusdpozatzclolix.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdpdWJ0dXNkcG96YXR6Y2xvbGl4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzI5NTE0ODEsImV4cCI6MjA0ODUyNzQ4MX0.T5tSx--bn2_PhZ6_v1bDj_PXAqlJK5mTvI2iqrRGOqo';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
