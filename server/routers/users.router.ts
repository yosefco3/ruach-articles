import { router } from "../_core/trpc";
import { adminProcedure } from "./middleware";
import { getAllUsers } from "../db";

export const usersRouter = router({
  list: adminProcedure.query(async () => {
    return await getAllUsers();
  }),
});