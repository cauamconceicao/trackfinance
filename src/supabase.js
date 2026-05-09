import { createClient } from "@supabase/supabase-js"

const supabaseUrl = "https://qipciqacmxivgghdvwtw.supabase.co"
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFpcGNpcWFjbXhpdmdnaGR2d3R3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgxNzg5MzcsImV4cCI6MjA5Mzc1NDkzN30.xlyMf5tRYdOFYgwjHyLaYiN8MCB-kzYZ8upy-6qANJo"

export const supabase = createClient(
  supabaseUrl,
  supabaseKey
)