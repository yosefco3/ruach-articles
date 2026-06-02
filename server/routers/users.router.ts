import { router } from "../_core/trpc";
import { adminProcedure } from "./middleware";
import type { RouterDeps } from "./context";

export const createUsersRouter = (deps: RouterDeps) => router({
  list: adminProcedure.query(async () => {
    return await deps.db.getAllUsers();
  }),
});