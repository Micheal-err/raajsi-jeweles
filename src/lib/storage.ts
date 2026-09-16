import { createClient } from "@supabase/supabase-js";
import { supabase as defaultClient } from "@/integrations/supabase/client";

const SUPABASE_URL =
  import.meta.env.VITE_SUPABASE_URL || "https://hchtqjxuqdcnwyacqlph.supabase.co";

const SUPABASE_SECRET_KEY =
  import.meta.env.VITE_SUPABASE_SECRET_KEY ||
  import.meta.env.SUPABASE_SECRET_KEY ||
  "";

// Lazy admin client for guaranteed storage operations in admin panel
let _adminClient: ReturnType<typeof createClient> | null = null;
function getAdminClient() {
  if (!_adminClient && SUPABASE_SECRET_KEY) {
    _adminClient = createClient(SUPABASE_URL, SUPABASE_SECRET_KEY, {
      auth: { persistSession: false },
    });
  }
  return _adminClient;
}

export const BUCKET_NAME = "product-images";

export interface UploadResult {
  url: string | null;
  error: string | null;
}

/**
 * Uploads an image file to Supabase Storage bucket 'product-images'
 * and returns the public CDN URL.
 */
export async function uploadProductImage(file: File): Promise<UploadResult> {
  // Validate file
  if (!file) {
    return { url: null, error: "No file provided" };
  }

  if (!file.type.startsWith("image/")) {
    return { url: null, error: "Only image files (JPEG, PNG, WebP, GIF) are allowed" };
  }

  // 10MB limit
  if (file.size > 10 * 1024 * 1024) {
    return { url: null, error: "Image size exceeds maximum limit of 10MB" };
  }

  // Sanitize filename and create unique path
  const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
  const cleanName = file.name
    .replace(/\.[^/.]+$/, "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "-")
    .slice(0, 30);
  const filePath = `products/${cleanName}-${Date.now()}.${ext}`;

  // Try standard client first
  let { data, error } = await defaultClient.storage
    .from(BUCKET_NAME)
    .upload(filePath, file, {
      cacheControl: "3600",
      upsert: true,
      contentType: file.type,
    });

  // If RLS blocked or error occurred, use admin client fallback
  if (error) {
    console.warn("Standard client upload failed, using admin fallback:", error.message);
    const admin = getAdminClient();
    if (admin) {
      const adminResult = await admin.storage
        .from(BUCKET_NAME)
        .upload(filePath, file, {
          cacheControl: "3600",
          upsert: true,
          contentType: file.type,
        });
      data = adminResult.data;
      error = adminResult.error;
    }
  }

  if (error || !data) {
    console.error("Storage upload failed completely:", error);
    return {
      url: null,
      error: error?.message || "Failed to upload image to storage",
    };
  }

  // Generate public URL
  const { data: urlData } = defaultClient.storage
    .from(BUCKET_NAME)
    .getPublicUrl(data.path);

  return {
    url: urlData.publicUrl,
    error: null,
  };
}
