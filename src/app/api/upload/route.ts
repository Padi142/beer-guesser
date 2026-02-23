import { NextResponse } from "next/server";
import { createPresignedPost } from "@aws-sdk/s3-presigned-post";
import { s3Client, S3_BUCKET, BEERS_PREFIX } from "~/server/s3";
import { env } from "~/env";

export async function POST(request: Request) {
  const password = request.headers.get("x-upload-password");
  if (password !== env.UPLOAD_PASSWORD) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = (await request.json()) as { fileName?: string };
    const fileName = body.fileName;
    if (!fileName) {
      return NextResponse.json(
        { error: "fileName is required" },
        { status: 400 },
      );
    }

    const sanitized = fileName.replace(/[^a-zA-Z0-9._-]/g, "_");
    const key = `${BEERS_PREFIX}${Date.now()}-${sanitized}`;

    const { url, fields } = await createPresignedPost(s3Client, {
      Bucket: S3_BUCKET,
      Key: key,
      Expires: 3600,
      Conditions: [
        { bucket: S3_BUCKET },
        ["eq", "$key", key],
        ["starts-with", "$Content-Type", "image/"],
        ["content-length-range", 1_000, 10_000_000],
      ],
    });

    return NextResponse.json({ url, fields, key });
  } catch (error) {
    console.error("Failed to create presigned upload:", error);
    return NextResponse.json(
      { error: "Failed to prepare upload" },
      { status: 500 },
    );
  }
}
