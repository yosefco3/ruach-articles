import { Route } from "wouter";
import {
  LazyAbout,
  LazyAccessibility,
  LazyArticlePage,
  LazyDerech,
  LazyCategoryPage,
  LazyContact,
  LazyGuestPostForm,
  LazyHome,
  LazyIChing,
  LazyTarot,
  LazyTarotDeck,
  LazyUserProfile,
} from "./lazy";

/**
 * Public route definitions — exported as an array for spreading into Switch.
 */
export const publicRoutes = [
  <Route key="home" path="/" component={LazyHome} />,
  <Route key="article" path="/article/:slug" component={LazyArticlePage} />,
  <Route key="category" path="/category/:slug" component={LazyCategoryPage} />,
  <Route key="derech" path="/derech" component={LazyDerech} />,
  <Route key="about" path="/about" component={LazyAbout} />,
  <Route key="contact" path="/contact" component={LazyContact} />,
  <Route key="accessibility" path="/accessibility" component={LazyAccessibility} />,
  <Route key="guest-post" path="/guest-post" component={LazyGuestPostForm} />,
  <Route key="profile" path="/profile/:id" component={LazyUserProfile} />,
  <Route key="iching" path="/iching" component={LazyIChing} />,
  <Route key="tarot" path="/tarot" component={LazyTarot} />,
  <Route key="tarot-deck" path="/tarot/deck" component={LazyTarotDeck} />,
];