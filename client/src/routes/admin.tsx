import { Route } from "wouter";
import {
  LazyAdminPage,
  LazyAdminArticleForm,
  LazyAdminArticleOrder,
  LazyAdminCategories,
  LazyAdminGuestPosts,
  LazyAdminNewsletter,
  LazyAdminSettings,
  LazyAdminUsers,
  LazyAdminIChing,
} from "./lazy";

/**
 * Admin route definitions — exported as an array for spreading into Switch.
 * Protection is handled by each admin page's own auth check (via useAuth / DashboardLayout).
 */
export const adminRoutes = [
  <Route key="admin" path="/admin" component={LazyAdminPage} />,
  <Route key="admin-new" path="/admin/new" component={LazyAdminArticleForm} />,
  <Route key="admin-edit" path="/admin/edit/:id" component={LazyAdminArticleForm} />,
  <Route key="admin-settings" path="/admin/settings" component={LazyAdminSettings} />,
  <Route key="admin-guest-posts" path="/admin/guest-posts" component={LazyAdminGuestPosts} />,
  <Route key="admin-users" path="/admin/users" component={LazyAdminUsers} />,
  <Route key="admin-categories" path="/admin/categories" component={LazyAdminCategories} />,
  <Route key="admin-newsletter" path="/admin/newsletter" component={LazyAdminNewsletter} />,
  <Route key="admin-article-order" path="/admin/article-order" component={LazyAdminArticleOrder} />,
  <Route key="admin-iching" path="/admin/iching" component={LazyAdminIChing} />,
];