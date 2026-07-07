import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

/**
 * Image storage abstraction.
 *
 * In production (e.g. Vercel) the filesystem is ephemeral, so uploaded images
 * must live in Supabase Storage. When the Supabase env vars are present, uploads
 * go there and a public URL is returned. When they are absent (typical local
 * dev), uploads fall back to the local `public/uploads` filesystem so
 * `npm run dev` keeps working with no external setup.
 *
 * Required env vars for Supabase Storage:
 *   SUPABASE_URL                — e.g. https://xxxx.supabase.co
 *   SUPABASE_SERVICE_ROLE_KEY   — service role key (server-only, never exposed)
 *   SUPABASE_STORAGE_BUCKET     — bucket name (defaults to "product-images")
 */

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const SUPABASE_STORAGE_BUCKET =
  process.env.SUPABASE_STORAGE_BUCKET ?? "product-images";

export function isSupabaseStorageConfigured() {
  return Boolean(SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY);
}

function sanitizeFilename(name: string) {
  return name.replace(/[^a-zA-Z0-9_.-]/g, "");
}

function inferContentType(filename: string) {
  const ext = path.extname(filename).toLowerCase();
  switch (ext) {
    case ".png":
      return "image/png";
    case ".webp":
      return "image/webp";
    case ".gif":
      return "image/gif";
    case ".svg":
      return "image/svg+xml";
    case ".jpg":
    case ".jpeg":
      return "image/jpeg";
    default:
      return "application/octet-stream";
  }
}

/**
 * Uploads a buffer and returns a public URL (Supabase) or a public path
 * (local fallback) suitable for storing in the DB and rendering in <img src>.
 *
 * @param objectPath path within the bucket / uploads dir, e.g.
 *   "1699999999-photo.jpg" or "imports/dummyjson/slug/01.webp"
 */
export async function uploadImageBuffer(
  buffer: Buffer,
  objectPath: string,
  contentType?: string,
): Promise<string> {
  const normalizedPath = objectPath.replace(/^\/+/, "");

  if (isSupabaseStorageConfigured()) {
    const resolvedContentType = contentType ?? inferContentType(normalizedPath);
    const endpoint = `${SUPABASE_URL}/storage/v1/object/${SUPABASE_STORAGE_BUCKET}/${normalizedPath}`;

    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
        "Content-Type": resolvedContentType,
        // Overwrite if the object already exists (e.g. re-importing).
        "x-upsert": "true",
      },
      body: new Uint8Array(buffer),
    });

    if (!response.ok) {
      const detail = await response.text().catch(() => "");
      throw new Error(
        `Supabase Storage upload failed (${response.status}): ${detail}`,
      );
    }

    return `${SUPABASE_URL}/storage/v1/object/public/${SUPABASE_STORAGE_BUCKET}/${normalizedPath}`;
  }

  // Local filesystem fallback (development only).
  const uploadsDir = path.join(process.cwd(), "public", "uploads");
  const fullPath = path.join(uploadsDir, normalizedPath);
  await mkdir(path.dirname(fullPath), { recursive: true });
  await writeFile(fullPath, buffer);
  return `/uploads/${normalizedPath}`;
}

/** Convenience wrapper for uploading a browser File. */
export async function uploadImageFile(
  file: File,
  objectPath: string,
): Promise<string> {
  const buffer = Buffer.from(await file.arrayBuffer());
  return uploadImageBuffer(buffer, objectPath, file.type || undefined);
}

export { sanitizeFilename };
