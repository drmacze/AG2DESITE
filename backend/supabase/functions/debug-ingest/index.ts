import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return new Response("Method not allowed", { status: 405, headers: cors });

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
  const authHeader = req.headers.get("Authorization") || "";
  if (!authHeader.startsWith("Bearer ")) return new Response("Unauthorized", { status: 401, headers: cors });

  const client = createClient(supabaseUrl, anonKey, { global: { headers: { Authorization: authHeader } } });
  const { data: { user }, error: userError } = await client.auth.getUser();
  if (userError || !user) return new Response("Unauthorized", { status: 401, headers: cors });

  const body = await req.json().catch(() => null);
  if (!body || typeof body !== "object") return new Response("Invalid JSON", { status: 400, headers: cors });

  const payload = {
    user_id: user.id,
    build: String(body.build || "").slice(0, 80) || null,
    device: String(body.device || "").slice(0, 120) || null,
    minecraft_version: String(body.minecraft_version || "").slice(0, 40) || null,
    artifact_summary: body.artifact_summary || {},
    contentlog_summary: body.contentlog_summary || null,
    profile_summary: body.profile_summary || null,
    diagnostics_summary: body.diagnostics_summary || null,
  };

  const { data, error } = await client.from("ag2_debug_sessions").insert(payload).select("id,created_at").single();
  if (error) return new Response(JSON.stringify({ error: error.message }), { status: 400, headers: { ...cors, "Content-Type": "application/json" } });
  return new Response(JSON.stringify(data), { status: 200, headers: { ...cors, "Content-Type": "application/json" } });
});
