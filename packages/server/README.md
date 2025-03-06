# @aurabloom/server

## setup

make sure you have everything installed with `bun install`.

then, run the database migrations with `bun run db:migrate`.

when you make changes to the database schema, you will need to:
- generate migrations, `bun run db:generate`, and
- run the migrations, `bun run db:migrate`

aurabloom will stop on startup if the database file either does not exist
or doesn't have the expected tables.

you can now start the server with `bun run start` or `bun run dev` if you'd like
the server to restart automatically when changes are made.

## copying

@aurabloom/server uses the same license as specified in the root README.
