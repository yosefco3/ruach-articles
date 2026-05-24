import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { DEFAULT_FROM_EMAIL } from "@shared/const";
import {
  createArticle,
  createComment,
  deleteArticle,
  deleteComment,
  getArticleById,
  getArticleBySlug,
  getArticles,
  getCommentById,
  getCommentsByArticle,
  updateArticle,
  getAttachmentsByArticle,
  createAttachment,
  deleteAttachment,
  getSiteSettings,
  updateSiteSettings,
  getGuestPosts,
  createGuestPost,
  updateGuestPostStatus,
  deleteGuestPost,
  getLikeCount,
  getUserLike,
  createLike,
  deleteLike,
  getUserProfile,
  createUserProfile,
  updateUserProfile,
  getUserCommentCount,
  getAboutPage,
  updateAboutPage,
  approveGuestWriter,
  revokeGuestWriter,
  getApprovedGuestWriters,
  getAllUsers,
  getCategories,
  getCategoryBySlug,
  createCategory,
  updateCategory,
  deleteCategory,
  reorderCategories,
  subscribeToNewsletter,
  unsubscribeFromNewsletter,
  getNewsletterSubscribers,
  deleteNewsletterSubscriber,
  searchNewsletterSubscribers,
  getFeaturedArticle,
  setFeaturedArticle,
  reorderArticles,
  getCategoriesWithArticleCount,
} from "./db";
import { systemRouter } from "./_core/systemRouter";
import { sendArticleNewsletter } from "./newsletterEmail";
import { protectedProcedure, publicProcedure, router } from "./_core/trpc";
import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { contactRouter } from "./contact";

// Admin guard middleware
const adminProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.user.role !== "admin") {
    throw new TRPCError({ code: "FORBIDDEN", message: "Access denied" });
  }
  return next({ ctx });
});

// Writer guard: admin OR approved guest writer
const writerProcedure = protectedProcedure.use(({ ctx, next }) => {
  const isAdmin = ctx.user.role === "admin";
  const isApprovedWriter = (ctx.user as any).guestPostApproved === true;
  if (!isAdmin && !isApprovedWriter) {
    throw new TRPCError({ code: "FORBIDDEN", message: "Access denied" });
  }
  return next({ ctx });
});

// Articles router
const articlesRouter = router({
  list: publicProcedure
    .input(
      z
        .object({
          category: z.string().optional(),
          all: z.boolean().optional(),
        })
        .optional()
    )
    .query(async ({ input, ctx }) => {
      const isAdmin = ctx.user?.role === "admin";
      const all = isAdmin && input?.all;
      const articles = await getArticles({
        category: input?.category,
        published: all ? undefined : true,
      });
      return articles;
    }),

  bySlug: publicProcedure
    .input(z.object({ slug: z.string() }))
    .query(async ({ input }) => {
      const article = await getArticleBySlug(input.slug);
      if (!article) return null;
      const attachments = await getAttachmentsByArticle(article.id);
      return { ...article, attachments };
    }),

  create: writerProcedure
    .input(
      z.object({
        title: z.string().min(1),
        slug: z.string(),
        excerpt: z.string().optional(),
        body: z.string().min(1),
        coverImage: z.string().optional(),
        category: z.string().min(1),
        tags: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      // Server-side slug normalization: strip non-ASCII, fallback to timestamp slug
      let slug = input.slug
        .toLowerCase()
        .replace(/[^\w\s-]/g, "")
        .replace(/\s+/g, "-")
        .replace(/-+/g, "-")
        .trim();
      if (!slug || slug === "-") {
        slug = "article-" + Date.now().toString(36);
      }
      // Ensure slug uniqueness by appending a suffix if needed
      const existing = await getArticleBySlug(slug);
      if (existing) {
        slug = slug + "-" + Date.now().toString(36);
      }
      return await createArticle({
        ...input,
        slug,
        authorId: ctx.user!.id,
        published: false,
      });
    }),

  update: writerProcedure
    .input(
      z.object({
        id: z.number(),
        title: z.string().optional(),
        slug: z.string().optional(),
        body: z.string().optional(),
        excerpt: z.string().optional(),
        coverImage: z.string().optional(),
        category: z.string().optional(),
        tags: z.string().optional(),
        published: z.boolean().optional(),
        siteUrl: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const { id, siteUrl: _siteUrl, ...data } = input;
      const updated = await updateArticle(id, data);
      return updated;
    }),

  sendNewsletter: adminProcedure
    .input(
      z.object({
        articleId: z.number(),
        siteUrl: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      const article = await getArticleById(input.articleId);
      if (!article) throw new TRPCError({ code: "NOT_FOUND", message: "מאמר לא נמצא" });
      await sendArticleNewsletter({
        title: article.title,
        excerpt: article.excerpt,
        slug: article.slug,
        coverImage: article.coverImage,
        category: article.category,
        siteUrl: input.siteUrl,
      });
      return { success: true };
    }),

  delete: adminProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      await deleteArticle(input.id);
      return { success: true };
    }),

   reorder: adminProcedure
    .input(
      z.object({
        items: z.array(z.object({ id: z.number(), sortOrder: z.number() })),
      })
    )
    .mutation(async ({ input }) => {
      await reorderArticles(input.items);
      return { success: true };
    }),
  // Save attachment metadata after file upload to S3
  addAttachment: writerProcedure
    .input(
      z.object({
        articleId: z.number(),
        fileName: z.string().min(1),
        fileUrl: z.string().url(),
        fileSize: z.number(),
      })
    )
    .mutation(async ({ input }) => {
      await createAttachment({
        articleId: input.articleId,
        fileName: input.fileName,
        fileUrl: input.fileUrl,
        fileSize: input.fileSize,
      });
      return { success: true };
    }),
  // Delete an attachment (admin only)
  deleteAttachment: adminProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      await deleteAttachment(input.id);
      return { success: true };
    }),
});
// Comments router
const commentsRouter = router({
  list: publicProcedure
    .input(z.object({ articleId: z.number() }))
    .query(async ({ input }) => {
      return await getCommentsByArticle(input.articleId);
    }),

  create: protectedProcedure
    .input(
      z.object({
        articleId: z.number(),
        body: z.string(),
        parentCommentId: z.number().optional(),
        siteUrl: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const comment = await createComment({
        articleId: input.articleId,
        userId: ctx.user!.id,
        body: input.body,
        parentCommentId: input.parentCommentId,
      });

      // Notify owner about new comment via email (fire-and-forget)
      try {
        const article = await getArticleById(input.articleId);
        if (article) {
          const commenterName = ctx.user!.name || ctx.user!.email || "משתמש";
          const articleLink = input.siteUrl ? `${input.siteUrl}/article/${article.slug}` : `/article/${article.slug}`;

          // Send email if contactEmail is configured
          const settings = await getSiteSettings();
          const adminEmail = settings.contactEmail;
          if (adminEmail) {
            const { Resend } = await import("resend");
            const resend = new Resend(process.env.RESEND_API_KEY);
            const FROM_EMAIL = process.env.NEWSLETTER_FROM_EMAIL || DEFAULT_FROM_EMAIL;
            await resend.emails.send({
              from: `${settings.siteTitle || "רוּחַ חָכְמָה"} <${FROM_EMAIL}>`,
              to: adminEmail,
              subject: `תגובה חדשה: ${article.title}`,
              html: `<div dir="rtl" style="font-family:Arial,sans-serif;background:#1a1008;color:#f0e6d0;padding:32px;border-radius:12px;max-width:600px;">
  <h2 style="color:#c9a84c;">תגובה חדשה על המאמר</h2>
  <p><strong>מאמר:</strong> <a href="${articleLink}" style="color:#c9a84c;">${article.title}</a></p>
  <p><strong>מגיב:</strong> ${commenterName}</p>
  <div style="background:#231508;border-radius:8px;padding:16px;margin:16px 0;border-right:4px solid #c9a84c;">
    <p style="margin:0;">${input.body.replace(/\n/g, "<br/>")}</p>
  </div>
  <a href="${articleLink}" style="display:inline-block;background:#8B6914;color:#fff;text-decoration:none;padding:10px 24px;border-radius:8px;font-weight:600;">עבור למאמר</a>
</div>`,
            });
          }
        }
      } catch (err) {
        // Non-critical — log but don't fail the comment creation
        console.warn("[Comment] Failed to send owner notification:", err);
      }

      return comment;
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input, ctx }) => {
      const comment = await getCommentById(input.id);
      if (!comment) throw new TRPCError({ code: "NOT_FOUND" });
      // Allow deletion by comment owner OR admin
      if (comment.userId !== ctx.user!.id && ctx.user!.role !== "admin") {
        throw new TRPCError({ code: "FORBIDDEN" });
      }
      await deleteComment(input.id);
      return { success: true };
    }),
});

// Settings router
const settingsRouter = router({
  get: publicProcedure.query(async () => {
    return await getSiteSettings();
  }),

  update: adminProcedure
    .input(
      z.object({
        siteTitle: z.string().optional(),
        heroSubtitle: z.string().optional(),
        contactEmail: z.string().email().optional().or(z.literal("")),
      })
    )
    .mutation(async ({ input }) => {
      await updateSiteSettings(input);
      return await getSiteSettings();
    }),
});

// Guest Posts router
const guestPostsRouter = router({
  list: adminProcedure
    .input(z.object({ status: z.enum(["pending", "approved", "rejected"]).optional() }))
    .query(async ({ input }) => {
      return await getGuestPosts(input.status);
    }),

  submit: protectedProcedure
    .input(
      z.object({
        title: z.string(),
        authorName: z.string(),
        authorEmail: z.string(),
        body: z.string(),
        category: z.string().min(1),
      })
    )
    .mutation(async ({ input }) => {
      return await createGuestPost(input);
    }),

  approve: adminProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      await updateGuestPostStatus(input.id, "approved");
      return { success: true };
    }),

  reject: adminProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      await updateGuestPostStatus(input.id, "rejected");
      return { success: true };
    }),

  delete: adminProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      await deleteGuestPost(input.id);
      return { success: true };
    }),
});

// Likes router
const likesRouter = router({
  toggle: protectedProcedure
    .input(
      z.object({
        articleId: z.number().optional(),
        commentId: z.number().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const existing = await getUserLike(ctx.user!.id, input.articleId, input.commentId);
      if (existing) {
        await deleteLike(existing.id);
        return { liked: false };
      } else {
        await createLike({
          userId: ctx.user!.id,
          articleId: input.articleId,
          commentId: input.commentId,
        });
        return { liked: true };
      }
    }),

  count: publicProcedure
    .input(
      z.object({
        articleId: z.number().optional(),
        commentId: z.number().optional(),
      })
    )
    .query(async ({ input }) => {
      return await getLikeCount(input.articleId, input.commentId);
    }),

  userLike: protectedProcedure
    .input(
      z.object({
        articleId: z.number().optional(),
        commentId: z.number().optional(),
      })
    )
    .query(async ({ input, ctx }) => {
      return await getUserLike(ctx.user!.id, input.articleId, input.commentId);
    }),
});

// Profiles router
const profilesRouter = router({
  get: publicProcedure
    .input(z.object({ userId: z.number() }))
    .query(async ({ input }) => {
      const profile = await getUserProfile(input.userId);
      const commentCount = await getUserCommentCount(input.userId);
      return { profile, commentCount };
    }),

  update: protectedProcedure
    .input(z.object({ bio: z.string().optional() }))
    .mutation(async ({ input, ctx }) => {
      const existing = await getUserProfile(ctx.user!.id);
      if (!existing) {
        await createUserProfile({ userId: ctx.user!.id, bio: input.bio });
      } else {
        await updateUserProfile(ctx.user!.id, { bio: input.bio });
      }
      return { success: true };
    }),
});

// About Page router
const aboutRouter = router({
  get: publicProcedure.query(async () => {
    return await getAboutPage();
  }),

  update: adminProcedure
    .input(z.object({ title: z.string(), content: z.string(), imageUrl: z.string().optional() }))
    .mutation(async ({ input }) => {
      await updateAboutPage({ title: input.title, content: input.content, imageUrl: input.imageUrl ?? null });
      return await getAboutPage();
    }),
});

// Users router (admin)
const usersRouter = router({
  list: adminProcedure.query(async () => {
    return await getAllUsers();
  }),
});

// Guest Writers router
const guestWritersRouter = router({
  list: adminProcedure.query(async () => {
    return await getApprovedGuestWriters();
  }),

  approve: adminProcedure
    .input(z.object({ userId: z.number() }))
    .mutation(async ({ input }) => {
      await approveGuestWriter(input.userId);
      return { success: true };
    }),

  revoke: adminProcedure
    .input(z.object({ userId: z.number() }))
    .mutation(async ({ input }) => {
      await revokeGuestWriter(input.userId);
      return { success: true };
    }),
});

// Categories router
const categoriesRouter = router({
  list: publicProcedure.query(async () => {
    return await getCategories();
  }),

  listWithCounts: publicProcedure.query(async () => {
    return await getCategoriesWithArticleCount();
  }),

  bySlug: publicProcedure
    .input(z.object({ slug: z.string() }))
    .query(async ({ input }) => {
      return await getCategoryBySlug(input.slug);
    }),

  create: adminProcedure
    .input(
      z.object({
        name: z.string().min(1),
        slug: z.string().min(1),
        description: z.string().optional(),
        color: z.string().optional(),
        sortOrder: z.number().optional(),
      })
    )
    .mutation(async ({ input }) => {
      return await createCategory(input);
    }),

  update: adminProcedure
    .input(
      z.object({
        id: z.number(),
        name: z.string().optional(),
        slug: z.string().optional(),
        description: z.string().optional(),
        color: z.string().optional(),
        sortOrder: z.number().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const { id, ...data } = input;
      await updateCategory(id, data);
      return { success: true };
    }),

  delete: adminProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      await deleteCategory(input.id);
      return { success: true };
    }),
  reorder: adminProcedure
    .input(
      z.object({
        items: z.array(z.object({ id: z.number(), sortOrder: z.number() })),
      })
    )
    .mutation(async ({ input }) => {
      await reorderCategories(input.items);
      return { success: true };
    }),
});

// Newsletter router
const newsletterRouter = router({
  subscribe: publicProcedure
    .input(
      z.object({
        email: z.string().email(),
        name: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      await subscribeToNewsletter(input);
      return { success: true };
    }),

  unsubscribe: publicProcedure
    .input(z.object({ email: z.string().email() }))
    .mutation(async ({ input }) => {
      await unsubscribeFromNewsletter(input.email);
      return { success: true };
    }),

  list: adminProcedure
    .input(z.object({ search: z.string().optional() }).optional())
    .query(async ({ input }) => {
      if (input?.search && input.search.trim()) {
        return await searchNewsletterSubscribers(input.search.trim());
      }
      return await getNewsletterSubscribers();
    }),

  delete: adminProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      await deleteNewsletterSubscriber(input.id);
      return { success: true };
    }),
});

// Featured Article router
const featuredArticleRouter = router({
  get: publicProcedure.query(async () => {
    return await getFeaturedArticle();
  }),

  set: adminProcedure
    .input(z.object({ articleId: z.number() }))
    .mutation(async ({ input }) => {
      await setFeaturedArticle(input.articleId);
      return { success: true };
    }),
});

// App router
export const appRouter = router({
  system: systemRouter,
  auth: router({
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
  }),
  articles: articlesRouter,
  comments: commentsRouter,
  contact: contactRouter,
  settings: settingsRouter,
  about: aboutRouter,
  guestPosts: guestPostsRouter,
  guestWriters: guestWritersRouter,
  likes: likesRouter,
  profiles: profilesRouter,
  users: usersRouter,
  categories: categoriesRouter,
  newsletter: newsletterRouter,
  featured: featuredArticleRouter,
});

export type AppRouter = typeof appRouter;
