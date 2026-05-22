import express, { Request, Response } from "express";
import cors from "cors";
import "dotenv/config";
import passport from "./config/oauth";
import sessionConfig from "./config/sessionConfig";
import userRouter from "./modules/auth/auth.routes";
import { AppError } from "./utils/AppError";
import { errorHandler } from "./middleware/errorHandler";

const app = express();

app.use(
	cors({
		origin: "http://localhost:5173",
		credentials: true,
	}),
);
app.use(express.json());

// Session middleware
app.use(sessionConfig);

// Passport middleware
app.use(passport.initialize());
app.use(passport.session());

// log requests and responses
app.use((req: Request, res: Response, next: Function) =>{
	console.log(`request: ${req.method} ${req.url} ${req.method === "POST" ? JSON.stringify(req.body) : ""}`);
	console.log(`response: ${res.statusCode}`)
	next()
})

app.get("/", (req: Request, res: Response) => res.json({success: true, message: "Server health: OK!"}));

// Protected route
app.get("/home", (req: Request, res: Response) => {
	if (!req.user) {
		return res.status(401).send("Unauthorized");
	}

	res.json({
		message: "Successfully authenticated",
		user: req.user,
	});
});

app.use("/api/auth", userRouter)

// not found
app.use((req: Request, res: Response) => { 
	throw new AppError("Route not found", 404);
})

// error handler
app.use(errorHandler)

app.listen(3000, () => {
	console.log("Server running on http://localhost:3000");
});
