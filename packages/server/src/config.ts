import { readFileSync } from "node:fs";
import { Logger } from "common";
import { z } from "zod";

const developerSchema = z.object({
  name: z.string(),
  email: z.string().email(),
});

const appSchema = z.object({
  name: z.string(),
  prefix: z.string().optional(),
  fullName: z.string().max(32).default(""),
  version: z.string(),
  description: z.string().min(10).max(100),
  privacyPolicy: z.string().url(),
  termsOfService: z.string().url(),
});

const repositorySchema = z.object({
  url: z.string().url(),
  branch: z.string(),
});

const serverSchema = z.object({
  port: z.number().int().positive().min(1024).max(65535),
  basePath: z.string().default("/"),
});

const configSchema = z.object({
  app: appSchema,
  developer: developerSchema,
  repository: repositorySchema,
  server: serverSchema,
});

export type Config = z.infer<typeof configSchema>;

const loadConfig = (filePath = "./config.json"): Config => {
  const configLogger = new Logger("config");

  try {
    const configFile = readFileSync(filePath, "utf8");
    const config: Config = configSchema.parse(JSON.parse(configFile));
    if (config.app.fullName === "") {
      if (!config.app.prefix) config.app.fullName = config.app.name;
      else config.app.fullName = `${config.app.prefix} ${config.app.name}`;
    }
    configLogger.info("configuration loaded successfully");
    return config;
  } catch (error) {
    if (error instanceof z.ZodError) {
      configLogger.error("invalid configuration");
      for (const issue of error.issues) {
        if (issue.code === z.ZodIssueCode.invalid_type) {
          configLogger.error(
            `- ${issue.path.join(".")}: expected ${issue.expected}, received ${issue.received}`,
          );
        } else {
          configLogger.error(`- ${issue.path.join(".")}: ${issue.message}`);
        }
      }
    } else {
      configLogger.error("error loading configuration:", error);
    }
    process.exit(1);
  }
};

const config = loadConfig();
export default config;
