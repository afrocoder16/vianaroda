import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { Role } from "@prisma/client";
import { authOptions } from "@/lib/auth";
import { sanitizeFilename, uploadImageFile } from "@/lib/storage";

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== Role.ADMIN) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const formData = await request.formData();
  const file = formData.get("image");
  if (!(file instanceof File) || file.size === 0) {
    return NextResponse.json({ error: "Missing image" }, { status: 400 });
  }

  const safeName = `${Date.now()}-${sanitizeFilename(file.name)}`;
  const path = await uploadImageFile(file, safeName);
  return NextResponse.json({ path });
}
