import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://nmvplsjccchwduwtflki.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5tdnBsc2pjY2Nod2R1d3RmbGtpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk3MjI2NzksImV4cCI6MjA5NTI5ODY3OX0.OKV1RDGczZfnRFiHwveqxa2PZI0LMcI4i8RKBIxlTEQ';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
