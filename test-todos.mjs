import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://yibarqobwcyguqyhzzbe.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_OaAVbYl8VZsm0C_l3WCBeg_2QUAuD0_";

const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);

async function main() {
  const { data: todos, error } = await supabase.from('todo_items').select('*').order('created_at', { ascending: false }).limit(5);
  if (error) console.error("Error:", error);
  else console.log("Recent todos:", todos);
}
main();
