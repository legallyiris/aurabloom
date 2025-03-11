import fs from "node:fs";
import { GetObjectCommand } from "@aws-sdk/client-s3";
import { Elysia } from "elysia";
import { s3Client } from "../utils/s3";
import { authRoutes } from "./auth";
import { channelsRoutes } from "./channels";
import { communitiesRoutes } from "./communities";
import { messagesRoutes } from "./messages";
import { usersRoutes } from "./users";

const rootTxt = fs.readFileSync("assets/root.txt", "utf8");

export const routes = new Elysia()
  .get("/s3/*", async ({ path, error }) => {
    try {
      const key = path.replace("/api/s3/", "");

      const command = new GetObjectCommand({
        Bucket: process.env.S3_BUCKET || "aurabloom",
        Key: key,
      });

      const response = await s3Client.send(command);
      const stream = response.Body;

      if (!stream) return error(404, "file not found");

      const buffer = await stream.transformToByteArray();
      return new Response(buffer, {
        headers: {
          "Content-Type": response.ContentType || "image/jpeg",
          "Cache-Control": "public, max-age=86400",
        },
      });
    } catch (err) {
      console.error("failed to fetch from s3:", err);
      return error(500, "failed to fetch file");
    }
  })
  .get(
    "/",
    (app) => {
      const txt = rootTxt
        .replace("<DOCS_URL>", `${app.server?.url}docs`)
        .replace("<APP_URL>", `${app.server?.url}`);
      return txt;
    },
    {
      detail: {
        summary: "root",
        description: "root route",
        tags: ["api root"],
      },
    },
  )
  .use(usersRoutes)
  .use(authRoutes)
  .use(communitiesRoutes)
  .use(messagesRoutes)
  .use(channelsRoutes);
