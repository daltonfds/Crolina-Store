import { NextResponse } from "next/server";
import { getAdmin } from "@/lib/auth";
import { createServiceClient } from "@/lib/supabase/service";

export const runtime = "nodejs";

const TYPES: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/avif": "avif",
};

export async function POST(request: Request) {
  try {
    const admin = await getAdmin();
    if (!admin) {
      return NextResponse.json({ error: "Administrator authentication required." }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get("file");
    if (!(file instanceof File)) {
      return NextResponse.json({ error: "Choose an image to upload." }, { status: 400 });
    }

    const ext = TYPES[file.type];
    if (!ext) {
      return NextResponse.json({ error: "Use JPG, PNG, WebP or AVIF images." }, { status: 415 });
    }
    if (file.size === 0 || file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: "Images must be between 1 byte and 5 MB." }, { status: 413 });
    }

    const path = `${crypto.randomUUID()}.${ext}`;
    const sb = createServiceClient();
    const { error } = await sb.storage
      .from("product-images")
      .upload(path, file, { contentType: file.type, cacheControl: "31536000" });

    if (error) {
      return NextResponse.json({ error: `Storage upload failed: ${error.message}` }, { status: 502 });
    }

    const url = sb.storage.from("product-images").getPublicUrl(path).data.publicUrl;
    return NextResponse.json({ url });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unexpected upload error.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
