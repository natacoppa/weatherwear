import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { requireApiKey } from "@/lib/api-auth";

export async function GET(req: NextRequest) {
  const unauthed = requireApiKey(req);
  if (unauthed) return unauthed;

  const indexPath = path.join(process.cwd(), "data/creators/_index.json");
  try {
    const index = JSON.parse(fs.readFileSync(indexPath, "utf-8"));
    return NextResponse.json(index);
  } catch {
    return NextResponse.json([]);
  }
}
