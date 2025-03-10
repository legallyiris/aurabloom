import type { App as AurabloomApp } from "@aurabloom/server";
import type { treaty } from "@elysiajs/eden";

type ApiClient = ReturnType<typeof treaty<AurabloomApp>>;

export type User = NonNullable<
  Awaited<ReturnType<ApiClient["api"]["users"]["me"]["get"]>>["data"]
>["data"];
export type Channel = NonNullable<
  Awaited<
    ReturnType<ApiClient["api"]["channels"][":communityId"]["get"]>
  >["data"]
>["data"][0];
