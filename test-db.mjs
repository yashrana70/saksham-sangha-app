import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://yibarqobwcyguqyhzzbe.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_OaAVbYl8VZsm0C_l3WCBeg_2QUAuD0_";

const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);

async function main() {
  console.log("Checking complex query for community_posts...");
  const { data, error } = await supabase
        .from("community_posts")
        .select(`
          *,
          profiles:user_id (id, full_name, avatar_url),
          community_likes (id, user_id),
          community_comments (id, content, created_at, user_id, profiles:user_id (id, full_name, avatar_url))
        `)
        .order("created_at", { ascending: false });
        
  if (error) {
    console.error("Error from complex query:", error);
  } else {
    console.log(`Success! Fetched ${data?.length} posts.`);
  }
}
main();
