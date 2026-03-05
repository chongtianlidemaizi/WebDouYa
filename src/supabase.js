import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://ihilngafcckxrpgorbpf.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImloaWxuZ2FmY2NreHJwZ29yYnBmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI2Nzg0OTksImV4cCI6MjA4ODI1NDQ5OX0.q58-umdvKqqD2db8icmHgIMg3aM1RD12Y5ndix9dLbA'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)