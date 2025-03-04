import { Elysia } from "elysia";

const ip = new Elysia().derive({ as: "global" }, ({ server, request }) => ({
  ip: server?.requestIP(request) || undefined,
}));

export default ip;
