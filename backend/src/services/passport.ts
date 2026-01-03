import passport from "passport";
import {
  Strategy as GoogleStrategy,
  Profile,
  VerifyCallback,
} from "passport-google-oauth20";
import { config } from "../config";
import {
  findUserByProvider,
  createUser,
  updateUserProfile,
  User,
} from "../db/queries";

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
          const providerId = profile.id;
          const email = profile.emails?.[0]?.value;
          const name = profile.displayName;
          let pictureUrl = profile.photos?.[0]?.value;

          // Upgrade Google profile picture to higher resolution
          if (pictureUrl && pictureUrl.includes("googleusercontent.com")) {
            pictureUrl = pictureUrl.replace(/=s\d+-c$/, "=s400-c");
          }

          if (!email) {
            return done(new Error("No email found in Google profile"));
          }

          // Check if user already exists
          let user = await findUserByProvider("google", providerId);

          if (user) {
            // Update existing user profile (name and picture may have changed)
            user = await updateUserProfile(user.id, name, pictureUrl ?? null);
          } else {
            // Create new user with provider info
            user = await createUser(
              "google",
              providerId,
              email,
              name,
              pictureUrl ?? null,
              config.initialAdmin.email
            );
          }

          return done(null, user ?? undefined);
        } catch (error) {
          return done(error as Error);
        }
      }
    )
  );

  // Serialize user to session
  passport.serializeUser((user: Express.User, done) => {
    done(null, (user as User).id);
  });

  // Deserialize user from session
  passport.deserializeUser(async (id: number, done) => {
    try {
      const { findUserById } = await import("../db/queries");
      const user = await findUserById(id);
      done(null, user ?? undefined);
    } catch (error) {
      done(error as Error);
    }
  });
}
