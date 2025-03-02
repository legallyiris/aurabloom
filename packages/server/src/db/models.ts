import { createInsertSchema, createSelectSchema } from "drizzle-typebox";
import { t } from "elysia";
import * as schema from "./schema";

const _userInsert = createInsertSchema(schema.users);
const _userSelect = createSelectSchema(schema.users);

export const models = {
  user: {
    insert: _userInsert,
    select: _userSelect,

    create: t.Omit(_userInsert, ["id"]),
    login: t.Pick(_userInsert, ["username", "password"]),
  },
};
