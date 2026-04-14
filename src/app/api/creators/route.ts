import { NextRequest, NextResponse } from "next/server";
import { requireApiKey } from "@/lib/api-auth";
import { loadCreatorIndex } from "@/lib/creator-catalog";

export async function GET(req: NextRequest) {
  const unauthed = requireApiKey(req);
  if (unauthed) return unauthed;

  try {
    return NextResponse.json(loadCreatorIndex());
  } catch {
    return NextResponse.json([]);
  }
}
