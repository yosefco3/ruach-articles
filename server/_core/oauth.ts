import express from 'express';
import session from 'express-session';
import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { env } from './env.js';

/**
 * Google OAuth 2.0 authentication setup.
 * Replaces Manus OAuth with Passport.js + Google strategy.
 * Admin role is assigned when the user's email matches ADMIN_EMAIL.
 */

// Serialize / deserialize for express-session
passport.serializeUser((user: any, done) => {
  done(null, user);
});

passport.deserializeUser((user: any, done) => {
  done(null, user);
});

// Configure Google OAuth strategy
passport.use(
  new GoogleStrategy(
    {
      clientID: env.GOOGLE_CLIENT_ID,
      clientSecret: env.GOOGLE_CLIENT_SECRET,
      callbackURL: env.GOOGLE_CALLBACK_URL,
    },
    (
      _accessToken: string,
      _refreshToken: string,
      profile: any,
      done: (error: any, user?: any) => void,
    ) => {
      const email = profile.emails?.[0]?.value ?? '';
      const isAdmin = email.toLowerCase() === env.ADMIN_EMAIL.toLowerCase();

      const user = {
        id: profile.id,
        email,
        name: profile.displayName,
        avatar: profile.photos?.[0]?.value ?? '',
        role: isAdmin ? 'admin' : 'user',
      };

      return done(null, user);
    },
  ),
);

export function setupOAuth(app: express.Express) {
  // Session middleware — replaces Manus session management
  app.use(
    session({
      secret: env.JWT_SECRET,
      resave: false,
      saveUninitialized: false,
      cookie: {
        secure: env.NODE_ENV === 'production',
        httpOnly: true,
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
        sameSite: env.NODE_ENV === 'production' ? 'lax' : undefined,
      },
    }),
  );

  app.use(passport.initialize());
  app.use(passport.session());

  // ---- Google OAuth routes ----

  // Start Google login flow
  app.get('/api/auth/google', passport.authenticate('google', { scope: ['profile', 'email'] }));

  // Google callback
  app.get(
    '/api/auth/google/callback',
    passport.authenticate('google', { failureRedirect: '/' }),
    (_req, res) => {
      res.redirect('/');
    },
  );

  // Logout
  app.post('/api/auth/logout', (req, res) => {
    req.logout(() => {
      req.session.destroy(() => {
        res.clearCookie('connect.sid');
        res.json({ ok: true });
      });
    });
  });
}