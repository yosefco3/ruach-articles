/**
 * OAuth strategy — Google OAuth 2.0 via Passport.js.
 *
 * Extracted from the old `server/_core/oauth.ts` monolith.
 * Responsible for: Passport config, session store, and OAuth route handlers.
 */
import express from 'express';
import session from 'express-session';
import MySQLStoreFactory from 'express-mysql-session';
import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { env } from '../../env.js';
import { upsertUser, getUserByOpenId } from '../../../db.js';

// Create MySQL session store
const MySQLStore = MySQLStoreFactory(session);

function parseDatabaseUrl(url: string) {
  const match = url.match(/mysql:\/\/([^:]+):([^@]+)@([^:]+):(\d+)\/(.+)/);
  if (!match) {
    throw new Error('Invalid DATABASE_URL format. Expected: mysql://user:password@host:port/database');
  }
  return {
    host: match[3],
    port: parseInt(match[4], 10),
    user: match[1],
    password: match[2],
    database: match[5],
  };
}

const dbConfig = parseDatabaseUrl(env.DATABASE_URL);
const sessionStore = new MySQLStore({
  ...dbConfig,
  createDatabaseTable: true,
  schema: {
    tableName: 'sessions',
    columnNames: {
      session_id: 'session_id',
      expires: 'expires',
      data: 'data',
    },
  },
});

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
    async (
      _accessToken: string,
      _refreshToken: string,
      profile: any,
      done: (error: any, user?: any) => void,
    ) => {
      try {
        const email = profile.emails?.[0]?.value ?? '';
        const isAdmin = email.toLowerCase() === env.ADMIN_EMAIL.toLowerCase();

        await upsertUser({
          openId: profile.id,
          email,
          name: profile.displayName,
          loginMethod: 'google',
          role: isAdmin ? 'admin' : 'user',
          lastSignedIn: new Date(),
        });

        const dbUser = await getUserByOpenId(profile.id);

        if (!dbUser) {
          throw new Error('Failed to retrieve user from database after upsert');
        }

        const user = {
          id: profile.id,
          dbId: dbUser.id,
          email,
          name: profile.displayName,
          avatar: profile.photos?.[0]?.value ?? '',
          role: isAdmin ? 'admin' : 'user',
        };

        return done(null, user);
      } catch (error) {
        console.error('[OAuth] Failed to upsert user:', error);
        return done(error);
      }
    },
  ),
);

/**
 * Mount OAuth session middleware + routes on the Express app.
 */
export function setupOAuth(app: express.Express) {
  app.use(
    session({
      secret: env.JWT_SECRET,
      resave: false,
      saveUninitialized: false,
      store: sessionStore,
      cookie: {
        secure: env.NODE_ENV === 'production',
        httpOnly: true,
        maxAge: 7 * 24 * 60 * 60 * 1000,
        sameSite: 'lax',
      },
    }),
  );

  app.use(passport.initialize());
  app.use(passport.session());

  // Start Google login flow
  app.get('/api/auth/google', passport.authenticate('google', { scope: ['profile', 'email'] }));

  // Google callback
  app.get(
    '/api/auth/google/callback',
    passport.authenticate('google', { failureRedirect: '/', session: true }),
    (req, res) => {
      console.log('[OAuth] User authenticated successfully:', {
        userId: (req.user as any)?.id,
        email: (req.user as any)?.email,
        role: (req.user as any)?.role,
        sessionID: req.sessionID,
      });

      req.session.save((err) => {
        if (err) {
          console.error('[OAuth] Session save error:', err);
        }
        res.redirect('/');
      });
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