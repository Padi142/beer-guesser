import { NextResponse } from "next/server";
import {
  ListObjectsV2Command,
  GetObjectCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { s3Client, S3_BUCKET, BEERS_PREFIX } from "~/server/s3";
import { env } from "~/env";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const command = new ListObjectsV2Command({
      Bucket: S3_BUCKET,
      Prefix: BEERS_PREFIX,
    });

    const response = await s3Client.send(command);
    const contents = response.Contents ?? [];

    const images = await Promise.all(
      contents
        .filter((obj) => {
          const key = obj.Key ?? "";
          return /\.(jpe?g|png|webp|gif)$/i.test(key);
        })
        .map(async (obj) => {
          const key = obj.Key!;
          const url = await getSignedUrl(
            s3Client,
            new GetObjectCommand({ Bucket: S3_BUCKET, Key: key }),
            { expiresIn: 3600 },
          );
          const filename = key.replace(BEERS_PREFIX, "");
          return {
            id: key,
            src: url,
            alt: filename,
            filename,
            uploadedAt: obj.LastModified?.toISOString() ?? null,
            size: obj.Size ?? 0,
          };
        }),
    );

    return NextResponse.json({ images });
  } catch (error) {
    console.error("Failed to list images:", error);
    return NextResponse.json(
      { error: "Failed to list images" },
      { status: 500 },
    );
  }
}

export async function DELETE(request: Request) {
  const password = request.headers.get("x-upload-password");
  if (password !== env.UPLOAD_PASSWORD) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = (await request.json()) as { key?: string };
    const key = body.key;
    if (!key?.startsWith(BEERS_PREFIX)) {
      return NextResponse.json({ error: "Invalid key" }, { status: 400 });
    }

    await s3Client.send(
      new DeleteObjectCommand({ Bucket: S3_BUCKET, Key: key }),
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete image:", error);
    return NextResponse.json(
      { error: "Failed to delete image" },
      { status: 500 },
    );
  }
}
