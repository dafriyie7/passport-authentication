import session from "express-session";
import connectPgSimple from "connect-pg-simple";
import { Pool } from "pg";

const PgSession = connectPgSimple(session);

const pgPool = new Pool({
	host: "localhost",
	port: 5432,
	user: process.env.DB_USER,
	password: process.env.DB_PASSWORD as string,
	database: "oauth",
});

const sessionConfig: any = session({
	store: new PgSession({
		pool: pgPool,
		tableName: "user_sessions",
		createTableIfMissing: true,
	}),

	secret: process.env.COOKIE_SECRET as string,

	resave: false,
	saveUninitialized: false,

	cookie: {
		maxAge: 60 * 60 * 1000, // 1 hour
		httpOnly: true,
		secure: process.env.NODE_ENV === "production",
		sameSite: "lax",
	},
});

export default sessionConfig;
