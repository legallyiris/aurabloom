import crypto from "node:crypto";
import { eq } from "drizzle-orm";
import db, { schema } from "../db";

import rootLogger from "./logger";
const logger = rootLogger.child("crypto");

export async function generateKeyPair(): Promise<{
  publicKey: string;
  privateKey: string;
}> {
  try {
    const { publicKey, privateKey } = crypto.generateKeyPairSync("rsa", {
      modulusLength: 2048,
      publicKeyEncoding: {
        type: "spki",
        format: "pem",
      },
      privateKeyEncoding: {
        type: "pkcs8",
        format: "pem",
      },
    });

    return {
      publicKey,
      privateKey,
    };
  } catch (error) {
    logger.error("failed to generate key pair:", error);
    throw new Error("failed to generate key pair");
  }
}

export async function signData(
  data: string,
  privateKey: string,
): Promise<string> {
  try {
    const sign = crypto.createSign("sha256");
    sign.update(data);
    sign.end();
    const signature = sign.sign(privateKey, "base64");
    return signature;
  } catch (error) {
    logger.error("failed to sign data:", error);
    throw new Error("failed to sign data");
  }
}

export function createHttpSignatureHeader(
  keyId: string,
  signature: string,
  headers: string[] = ["(request-target)", "host", "date"],
): string {
  return `keyId="${keyId}",algorithm="rsa-sha256",headers="${headers.join(" ")}",signature="${signature}"`;
}

export async function verifySignature(
  request: Request,
  publicKey: string,
): Promise<boolean> {
  try {
    const signatureHeader = request.headers.get("signature");

    if (!signatureHeader) {
      logger.error("missing signature header");
      return false;
    }

    const parsedSignature = parseSignatureHeader(signatureHeader);
    if (!parsedSignature) {
      logger.error("invalid signature header format");
      return false;
    }
    if (parsedSignature.algorithm.toLowerCase() !== "rsa-sha256") {
      logger.warn("signature algorithm is not rsa-sha256");
      return false;
    }

    const { keyId, signature, headers } = parsedSignature;
    const { host } = new URL(request.url);

    const actor = db
      .select()
      .from(schema.federatedActors)
      .where(eq(schema.federatedActors.actorUrl, keyId.split("#")[0])) // Extract actor URL from keyId
      .get();

    if (!actor) {
      logger.error(`actor not found for keyId: ${keyId}`);
      return false;
    }

    if (!actor.publicKey) {
      logger.error(`no public key found for actor: ${actor.actorUrl}`);
      return false;
    }

    if (host !== request.headers.get("host")) {
      logger.error(
        `host mismatch. Expected ${request.headers.get("host")}, got ${host}`,
      );
      return false;
    }

    const stringToVerify = headers
      .map((header) => {
        if (header === "(request-target)") {
          return `(request-target): ${request.method.toLowerCase()} ${new URL(request.url).pathname}`;
        }
        if (header === "digest") {
          return `digest: ${request.headers.get("digest")}`;
        }

        const headerValue = request.headers.get(header);
        if (!headerValue) {
          throw new Error(`Missing header: ${header}`);
        }
        return `${header}: ${headerValue}`;
      })
      .join("\n");
    const verify = crypto.createVerify("sha256");
    verify.update(stringToVerify);
    verify.end();
    return verify.verify(actor.publicKey, signature, "base64");
  } catch (error) {
    logger.error("failed to verify signature:", error);
    return false;
  }
}

function parseSignatureHeader(header: string): {
  keyId: string;
  signature: string;
  algorithm: string;
  headers: string[];
} | null {
  const parts: Record<string, string> = {};
  const matches = header
    .split(",")
    .map((part) => part.trim().match(/([^=]+)="([^"]*)"/));

  if (!matches.every((match): match is RegExpMatchArray => match !== null)) {
    return null;
  }

  for (const match of matches) {
    parts[match[1]] = match[2];
  }

  if (!parts.keyId || !parts.signature || !parts.headers || !parts.algorithm) {
    return null;
  }

  return {
    keyId: parts.keyId,
    signature: parts.signature,
    algorithm: parts.algorithm,
    headers: parts.headers.split(" "),
  };
}
