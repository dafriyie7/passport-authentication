import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import "dotenv/config";
import { prisma } from "../utils/prisma";
import { Strategy as LocalStrategy } from "passport-local";
import bcrypt from "bcryptjs";

// import prisma from "./prisma";
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;

if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
	throw new Error("Missing Google OAuth environment variables");
}

// google auth 2.0 strategy
passport.use(
	new GoogleStrategy(
		{
			clientID: GOOGLE_CLIENT_ID,
			clientSecret: GOOGLE_CLIENT_SECRET,
			callbackURL: "http://localhost:3000/api/auth/google/callback",
		},
		async (accessToken, refreshToken, profile, done) => {
			try {
				const email = profile.emails?.[0]?.value;
				console.log(profile)

				if (!email) {
					return done(new Error("No email found from Google"));
				}

				// Find existing user
				let user = await prisma.user.findUnique({
					where: {
						email,
					},
				});

				// Create user if doesn't exist
				if (!user) {
					user = await prisma.user.create({
						data: {
							username: profile.displayName,
							email,
							// password can stay null for OAuth users
						},
					});
				}

				return done(null, user);
			} catch (err) {
				return done(err as Error);
			}
		},
	),
);

// passport local strategy
passport.use(
	new LocalStrategy(
		{
			usernameField: "identifier",
			passwordField: "password",
		},
		
		async (identifier, password, done) => {

			try {
				// Find by email OR username
				const user = await prisma.user.findFirst({
					where: {
						OR: [
							{
								email: identifier,
							},
							{
								username: identifier,
							},
						],
					},
				});

				if (!user) {
					return done(null, false, {
						message: "Invalid credentials",
					});
				}

				// User exists but has no password
				if (!user.password) {
					return done(null, false, {
						message: "This account uses Google sign-in.",
					});
				}

				const validPassword = await bcrypt.compare(
					password,
					user.password,
				);

				if (!validPassword) {
					return done(null, false, {
						message: "Invalid credentials",
					});
				}

				return done(null, user);
			} catch (error) {
				return done(error as Error);
			}
		},
	),
);

// Save user ID to session
passport.serializeUser((user: any, done) => {
	done(null, user.id);
});

// Get full user from DB using ID
passport.deserializeUser(async (id: string, done) => {
	try {
		const user = await prisma.user.findUnique({
			where: {
				id,
			},
		});

		if (!user) {
			return done(null, false);
		}

		done(null, user);
	} catch (err) {
		done(err);
	}
});

export default passport;
