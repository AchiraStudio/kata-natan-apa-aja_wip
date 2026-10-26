// =============================================================================
// TITIK. — Supabase Edge Function: submit-report
// Canonical anonymous report submission endpoint with rate limiting & validation
// =============================================================================

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

interface SubmitPayload {
  title: string;
  description: string;
  category: string;
  severity: "Rendah" | "Sedang" | "Kritis";
  subdistrict: string;
  facility_id?: string;
  precise_latitude: number;
  precise_longitude: number;
  accuracy_meters?: number;
  acquisition_method?: "gps" | "map_pin" | "address_search" | "approximate";
  is_approximate?: boolean;
  address_text?: string;
  media_files?: Array<{
    storage_path: string;
    file_name: string;
    mime_type: string;
    file_size_bytes: number;
  }>;
  follow_up_token_hash: string;
  reporter_user_id?: string;
}

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    if (req.method !== "POST") {
      return new Response(JSON.stringify({ error: "Method not allowed" }), {
        status: 405,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const payload: SubmitPayload = await req.json();

    // 1. Server-side validation
    const mediaFiles = payload.media_files || [];
    const photoTypes = new Set(["image/jpeg", "image/png", "image/webp"]);
    const videoTypes = new Set(["video/mp4", "video/webm", "video/quicktime"]);
    if (
      !mediaFiles.some((file) => photoTypes.has(file.mime_type)) ||
      !mediaFiles.some((file) => videoTypes.has(file.mime_type)) ||
      mediaFiles.some((file) => !photoTypes.has(file.mime_type) && !videoTypes.has(file.mime_type)) ||
      mediaFiles.some((file) =>
        !Number.isInteger(file.file_size_bytes) ||
        file.file_size_bytes < 1 ||
        file.file_size_bytes > 10485760 ||
        !file.storage_path.startsWith("incoming/")
      )
    ) {
      return new Response(JSON.stringify({ error: "Setiap laporan wajib memiliki foto dan video bukti yang valid (maksimal 10 MB per file)." }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!payload.title || payload.title.trim().length < 5 || payload.title.length > 200) {
      return new Response(JSON.stringify({ error: "Judul laporan wajib antara 5-200 karakter." }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!payload.description || payload.description.trim().length < 10) {
      return new Response(JSON.stringify({ error: "Deskripsi laporan minimal 10 karakter." }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (
      typeof payload.precise_latitude !== "number" ||
      typeof payload.precise_longitude !== "number" ||
      payload.precise_latitude < -90 ||
      payload.precise_latitude > 90 ||
      payload.precise_longitude < -180 ||
      payload.precise_longitude > 180
    ) {
      return new Response(JSON.stringify({ error: "Koordinat lokasi tidak valid." }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!payload.follow_up_token_hash || payload.follow_up_token_hash.length < 32) {
      return new Response(JSON.stringify({ error: "Follow-up capability token hash wajib valid." }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 2. Initialize privileged server-side Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

    if (!supabaseUrl || !supabaseServiceKey) {
      return new Response(
        JSON.stringify({ error: "Supabase environment credentials not configured on server." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    for (const mediaFile of mediaFiles) {
      const { data: evidence, error: evidenceError } = await supabase.storage
        .from("report-evidence-private")
        .download(mediaFile.storage_path);
      if (evidenceError || !evidence) {
        return new Response(JSON.stringify({ error: `Bukti ${mediaFile.file_name} tidak ditemukan di penyimpanan.` }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const metadataText = new TextDecoder().decode(await evidence.arrayBuffer());
      if (/\b(?:stable diffusion|midjourney|dall[\s-]?e|firefly|imagen|sora|runway(?:ml)?|pika labs|generative fill|generated by ai|ai[- ]generated|text[- ]to[- ](?:image|video))\b/i.test(metadataText)) {
        return new Response(JSON.stringify({ error: `Bukti ${mediaFile.file_name} memiliki penanda metadata alat generatif AI.` }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    // 3. Execute atomic database submission procedure
    const { data, error } = await supabase.rpc("submit_citizen_report", {
      p_title: payload.title.trim(),
      p_description: payload.description.trim(),
      p_category: payload.category,
      p_severity: payload.severity || "Sedang",
      p_subdistrict: payload.subdistrict,
      p_facility_id: payload.facility_id || null,
      p_precise_lat: payload.precise_latitude,
      p_precise_lng: payload.precise_longitude,
      p_accuracy_meters: payload.accuracy_meters || null,
      p_acquisition_method: payload.acquisition_method || "map_pin",
      p_is_approximate: Boolean(payload.is_approximate),
      p_address_text: payload.address_text || null,
      p_media_files: mediaFiles,
      p_follow_up_token_hash: payload.follow_up_token_hash,
      p_reporter_user_id: payload.reporter_user_id || null,
    });

    if (error) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify(data), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message || "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
