// @ts-nocheck
import passport from 'passport';
import { Strategy as GoogleStrategy, Profile, VerifyCallback } from 'passport-google-oauth20';
import { config } from '../config';
import { findUserByGoogleId, createUser, updateUserProfile, User } from '../db/queries';

/**
 * Configure Passport with Google OAuth 2.0 Strategy
 */
export function configurePassport() {
  passport.use(
    new GoogleStrategy(
      {
        clientID: config.google.clientId,
        clientSecret: config.google.clientSecret,
        callbackURL: config.google.callbackUrl,
      },
      async (
        accessToken: string,
        refreshToken: string,
        profile: Profile,
        done: VerifyCallback
      ) => {
        try {
          // Extract user info from Google profile
          const googleId = profile.id;
          const email = profile.emails?.[0]?.value;
          const name = profile.displayName;
          let pictureUrl = profile.photos?.[0]?.value;

          // Upgrade Google profile picture to higher resolution
          if (pictureUrl && pictureUrl.includes('googleusercontent.com')) {
            pictureUrl = pictureUrl.replace(/=s\d+-c$/, '=s400-c');
          }

          if (!email) {
            return done(new Error('No email found in Google profile'));
          }

          // Check if user already exists
          let user = await findUserByGoogleId(googleId);

          if (user) {
            // Update existing user profile (name and picture may have changed)
            user = await updateUserProfile(user.id, name, pictureUrl);
          } else {
            // Create new user
            user = await createUser(
              googleId,
              email,
              name,
              pictureUrl,
              config.initialAdmin.email
            );
          }

          return done(null, user);
        } catch (error) {
          return done(error as Error);
        }
      }
    )
  );

  // Serialize user to session
  passport.serializeUser((user: any, done) => {
    done(null, user.id);
  });

  // Deserialize user from session
  passport.deserializeUser(async (id: number, done) => {
    try {
      const { findUserById } = await import('../db/queries');
      const user = await findUserById(id);
      done(null, user);
    } catch (error) {
      done(error);
    }
  });
}
