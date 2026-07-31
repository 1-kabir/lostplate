const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

let supabaseAdmin = null;

if (!supabaseUrl || !supabaseServiceRoleKey) {
  console.warn('⚠️ Missing Supabase env credentials. Operations requiring admin privileges will fail.');
} else {
  // Service role client bypasses RLS policies to calculate matches and verify QR claims securely
  supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

module.exports = { supabaseAdmin };
