import { Route } from "wouter";
import {
  LazyAbout,
  LazyArticlePage,
  LazyCategoryPage,
  LazyContact,
  LazyGuestPostForm,
  LazyHome,
  LazyUserProfile,
} from "./lazy";

/**
 * Public route definitions — exported as an array for spreading into Switch.
 */
export const publicRoutes = [
  <Route key="home" path="/" component={LazyHome} />,
  <Route key="article" path="/article/:slug" component={LazyArticlePage} />,
  <Route key="category" path="/category/:slug" component={LazyCategoryPage} />,
  <Route key="about" path="/about" component={LazyAbout} />,
  <Route key="contact" path="/contact" component={LazyContact} />,
  <Route key="guest-post" path="/guest-post" component={LazyGuestPostForm} />,
  <Route key="profile" path="/profile/:id" component={LazyUserProfile} />,
];