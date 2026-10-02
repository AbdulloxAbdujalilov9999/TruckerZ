import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseSecretKey = process.env.SUPABASE_SECRET_KEY;
const bucket = process.env.SUPABASE_STORAGE_BUCKET ?? "truckerz-uploads";

if (!supabaseUrl || !supabaseSecretKey) {
  throw new Error("SUPABASE_URL and SUPABASE_SECRET_KEY must be set.");
}

// Server-only client using the secret key — never import this from a
// client component. It bypasses row-level security, which is fine here
// because every call site already re-checks the requester's company
// against the Document row before touching storage.
const supabaseAdmin = createClient(supabaseUrl, supabaseSecretKey, {
  auth: { persistSession: false },
});

let bucketEnsured = false;

async function ensureBucket() {
  if (bucketEnsured) return;
  const { data: buckets } = await supabaseAdmin.storage.listBuckets();
  if (!buckets?.some((b) => b.name === bucket)) {
    await supabaseAdmin.storage.createBucket(bucket, { public: false });
  }
  bucketEnsured = true;
}

export async function uploadToStorage(path: string, buffer: Buffer, contentType: string) {
  await ensureBucket();
  const { error } = await supabaseAdmin.storage.from(bucket).upload(path, buffer, {
    contentType,
    upsert: false,
  });
  if (error) throw new Error(`Storage upload failed: ${error.message}`);
}

export async function downloadFromStorage(path: string): Promise<Buffer> {
  const { data, error } = await supabaseAdmin.storage.from(bucket).download(path);
  if (error || !data) throw new Error(`Storage download failed: ${error?.message ?? "not found"}`);
  return Buffer.from(await data.arrayBuffer());
}
