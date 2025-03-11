import { randomUUID } from "node:crypto";
import { Logger } from "@aurabloom/common";
import {
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
const logger = new Logger("s3");

export const s3Client = new S3Client({
  region: "aurabloom",
  endpoint: process.env.S3_ENDPOINT || "http://localhost:9500",
  credentials: {
    accessKeyId: process.env.S3_ACCESS_KEY || "minioadmin",
    secretAccessKey: process.env.S3_SECRET_KEY || "minioadmin",
  },
  forcePathStyle: true,
});

export async function getObject(key: string) {
  try {
    const command = new GetObjectCommand({
      Bucket: process.env.S3_BUCKET || "aurabloom",
      Key: key,
    });

    const response = await s3Client.send(command);
    const stream = response.Body;

    if (!stream) {
      throw new Error("file not found");
    }

    const buffer = await stream.transformToByteArray();
    return {
      data: buffer,
      contentType: response.ContentType || "application/octet-stream",
    };
  } catch (err) {
    logger.error("failed to fetch from s3:", err);
    throw err;
  }
}

export async function uploadObject(file: File, prefix: string) {
  try {
    if (!file.type.startsWith("image/")) {
      throw new Error("file must be an image");
    }
    if (file.size > 4 * 1024 * 1024) {
      throw new Error("file must be less than 4MB");
    }

    const fileExt = file.name.split(".").pop()?.toLowerCase() || "jpg";
    const fileName = `${prefix}/${randomUUID()}.${fileExt}`;
    const buffer = await file.arrayBuffer();

    await s3Client.send(
      new PutObjectCommand({
        Bucket: process.env.S3_BUCKET || "aurabloom",
        Key: fileName,
        Body: Buffer.from(buffer),
        ContentType: file.type,
      }),
    );

    return fileName;
  } catch (err) {
    logger.error("failed to upload to s3:", err);
    throw err;
  }
}
