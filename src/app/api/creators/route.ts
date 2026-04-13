import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export async function GET() {
  const indexPath = path.join(process.cwd(), "data/creators/_index.json");
  try {
    const index = JSON.parse(fs.readFileSync(indexPath, "utf-8"));
    return NextResponse.json(index);
  } catch {
    return NextResponse.json([]);
  }
}
