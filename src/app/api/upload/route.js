import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const R2 = new S3Client({
  region: "auto",
  endpoint: `https://5474cae236590e9018ddc4d1dccfffaf.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
  },
});

export async function POST(request) {
  try {
    const { filename, contentType } = await request.json();
    if (!filename || !contentType) {
      return Response.json({ error: "filename and contentType required" }, { status: 400 });
    }
    const key = `uploads/${Date.now()}-${filename.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
    const command = new PutObjectCommand({
      Bucket: "skybin-videos",
      Key: key,
      ContentType: contentType,
    });
    const uploadUrl = await getSignedUrl(R2, command, { expiresIn: 3600 });
    const videoUrl = `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com/skybin-videos/${key}`;
    return Response.json({ uploadUrl, key, videoUrl });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
