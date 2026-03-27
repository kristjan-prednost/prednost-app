import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://hwlfakcxrbupkakrdycx.supabase.co'
const supabaseKey = 'sb_publishable_z5lf86vqAZKYA9GL_DXPLQ_lojzTg2h'

export const supabase = createClient(supabaseUrl, supabaseKey)