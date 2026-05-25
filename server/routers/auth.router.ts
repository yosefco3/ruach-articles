import { router, publicProcedure } from "../_core/trpc";

export const authRouter = router({
  me: publicProcedure.query((opts) => opts.ctx.user),
  logout: publicProcedure.mutation(({ ctx }) => {
    return new Promise((resolve) => {
      // Use passport's logout method to properly clear session
      ctx.req.logout((err: any) => {
        if (err) {
          console.error('[Logout] Error during passport logout:', err);
        }
        // Destroy the session completely
        ctx.req.session.destroy((destroyErr: any) => {
          if (destroyErr) {
            console.error('[Logout] Error destroying session:', destroyErr);
          }
          // Clear the session cookie
          ctx.res.clearCookie('connect.sid', {
            path: '/',
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production', // Match the session cookie settings
            sameSite: 'lax',
          });
          resolve({ success: true } as const);
        });
      });
    });
  }),
});