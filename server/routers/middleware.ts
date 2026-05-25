import { TRPCError } from "@trpc/server";
import { protectedProcedure } from "../_core/trpc";

/**
 * Admin-only procedure guard
 * Requires user to have admin role
 */
export const adminProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.user.role !== "admin") {
    throw new TRPCError({ code: "FORBIDDEN", message: "Access denied" });
  }
  return next({ ctx });
});

/**
 * Writer procedure guard
 * Allows admin OR approved guest writers
 */
export const writerProcedure = protectedProcedure.use(({ ctx, next }) => {
  const isAdmin = ctx.user.role === "admin";
  const isApprovedWriter = (ctx.user as any).guestPostApproved === true;
  if (!isAdmin && !isApprovedWriter) {
    throw new TRPCError({ code: "FORBIDDEN", message: "Access denied" });
  }
  return next({ ctx });
});