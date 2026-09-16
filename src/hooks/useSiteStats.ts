import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export function useSiteStats() {
  return useQuery({
    queryKey: ["site-stats"],
    queryFn: async () => {
      const works = await supabase.from("artworks").select("id", { count: "exact", head: true });
      return {
        works: works.count ?? 0,
        artists: 0,
        exhibitions: 0,
      };
    },
    staleTime: 60_000,
  });
}
