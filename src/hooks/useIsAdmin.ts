import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";

export function useIsAdmin() {
  const { user } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const [isStaff, setIsStaff] = useState(false);
  const [roleString, setRoleString] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    
    // Hardcoded Admin Override
    if (user?.email === "sonuranaas56@gmail.com") {
      setIsAdmin(true);
      setIsStaff(true);
      setRoleString("admin");
      setLoading(false);
      return;
    }

    if (!user) {
      setIsAdmin(false);
      setIsStaff(false);
      setLoading(false);
      return;
    }
    
    setLoading(true);
    (async () => {
      const { data } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .maybeSingle();
        
      if (active) {
        if (data) {
          setIsAdmin(data.role === "admin");
          setIsStaff(["admin", "operator", "volunteer"].includes(data.role));
          setRoleString(data.role);
        } else {
          setIsAdmin(false);
          setIsStaff(false);
          setRoleString("");
        }
        setLoading(false);
      }
    })();
    return () => { active = false; };
  }, [user]);

  return { isAdmin, isStaff, roleString, loading };
}
