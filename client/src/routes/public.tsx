import { Route } from "wouter";
import {
  LazyAbout,
  LazyAccessibility,
  LazyArticlePage,
  LazyBooksIndex,
  LazyBookPage,
  LazyTeachersIndex,
  LazyTeacherPage,
  LazyMyTeacherProfile,
  LazyDerech,
  LazyCategoryPage,
  LazyContact,
  LazyHome,
  LazyIChing,
  LazyTarot,
  LazyTarotCard,
  LazyTarotDeck,
  LazyTarotGuide,
  LazyUserProfile,
} from "./lazy";

/**
 * Public route definitions — exported as an array for spreading into Switch.
 */
export const publicRoutes = [
  <Route key="home" path="/" component={LazyHome} />,
  <Route key="article" path="/article/:slug" component={LazyArticlePage} />,
  <Route key="category" path="/category/:slug" component={LazyCategoryPage} />,
  <Route key="books" path="/books" component={LazyBooksIndex} />,
  <Route key="book" path="/book/:slug" component={LazyBookPage} />,
  <Route key="book-chapter" path="/book/:book/:slug" component={LazyArticlePage} />,
  <Route key="teachers" path="/teachers" component={LazyTeachersIndex} />,
  <Route key="my-teacher-profile" path="/my-teacher-profile" component={LazyMyTeacherProfile} />,
  <Route key="teacher" path="/teacher/:slug" component={LazyTeacherPage} />,
  <Route key="derech" path="/derech" component={LazyDerech} />,
  <Route key="about" path="/about" component={LazyAbout} />,
  <Route key="contact" path="/contact" component={LazyContact} />,
  <Route key="accessibility" path="/accessibility" component={LazyAccessibility} />,
  <Route key="profile" path="/profile/:id" component={LazyUserProfile} />,
  <Route key="iching" path="/iching" component={LazyIChing} />,
  <Route key="tarot" path="/tarot" component={LazyTarot} />,
  <Route key="tarot-deck" path="/tarot/deck" component={LazyTarotDeck} />,
  <Route key="tarot-card" path="/tarot/card/:slug" component={LazyTarotCard} />,
  <Route key="tarot-guide" path="/tarot/guide" component={LazyTarotGuide} />,
];