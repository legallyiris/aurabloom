import { Elysia } from "elysia";
import { routes } from "./routes";

const app = new Elysia().use(routes);
export type App = typeof app;
