import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { getMediaPath } from "@/app/actions";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const file = searchParams.get("file");

  if (!file) {
    return new NextResponse("Missing file parameter", { status: 400 });
  }

  const mediaPath = await getMediaPath();
  if (!mediaPath) {
    return new NextResponse("Media path not configured", { status: 404 });
  }

  // Security: prevent path traversal
  const safeFile = path.normalize(file).replace(/^(\.\.[\/\\])+/, "");

  let absolutePath;
  const rootPath = path.dirname(mediaPath);

  if (safeFile.startsWith("your_instagram_activity")) {
    absolutePath = path.join(rootPath, safeFile);
  } else {
    absolutePath = path.join(mediaPath, safeFile);
  }

  // Security: Ensure the resolved path is within the root directory (more permissive now)
  const resolvedPath = path.resolve(absolutePath);
  if (!resolvedPath.startsWith(rootPath)) {
    return new NextResponse("Access Denied: Path Traversal", { status: 403 });
  }

  if (!fs.existsSync(absolutePath)) {
    return new NextResponse("File not found", { status: 404 });
  }

  // Determine content type
  const ext = path.extname(absolutePath).toLowerCase();
  let contentType = "application/octet-stream";
  if ([".jpg", ".jpeg"].includes(ext)) contentType = "image/jpeg";
  else if (ext === ".png") contentType = "image/png";
  else if (ext === ".webp") contentType = "image/webp";
  else if (ext === ".mp4") contentType = "video/mp4";
  else if (ext === ".mov") contentType = "video/quicktime";

  const stat = await fs.promises.stat(absolutePath);
  const fileSize = stat.size;
  const range = request.headers.get("range");

  if (range) {
    const parts = range.replace(/bytes=/, "").split("-");
    const start = parseInt(parts[0], 10);
    const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
    const chunksize = end - start + 1;
    const fileStream = fs.createReadStream(absolutePath, { start, end });

    // @ts-ignore
    return new NextResponse(fileStream, {
      status: 206,
      headers: {
        "Content-Range": `bytes ${start}-${end}/${fileSize}`,
        "Accept-Ranges": "bytes",
        "Content-Length": chunksize.toString(),
        "Content-Type": contentType,
      },
    });
  } else {
    // Stream the file
    const fileStream = fs.createReadStream(absolutePath);

    // @ts-ignore
    return new NextResponse(fileStream, {
      headers: {
        "Content-Length": fileSize.toString(),
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  }
}
