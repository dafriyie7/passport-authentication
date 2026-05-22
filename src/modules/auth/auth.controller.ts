import { NextFunction, Request, Response } from "express"
import passport from "../../config/oauth"
import { prisma } from "../../utils/prisma"
import bcrypt from "bcryptjs"
import { AppError } from "../../utils/AppError"
import { sendResponse } from "../../utils/response"

// signup user
const signupUser = async (req: Request, res: Response) => {
	const { username, email, password } = req.body

	// check if all fields are provided
	if (!username || !email || !password) {
		throw new AppError('Please provide all fields', 400)
	}

	// check if user already exists
	const user = await prisma.user.findFirst({
		where: {
			OR: [{ username }, { email }],
		},
	});

	// check if user already exists
	if (user) {
		throw new AppError('User already exists', 400)
	}

	const hashedPassword = await bcrypt.hash(password, 10)

	// create user
	const newUser = await prisma.user.create({
		data: {
			username,
			email,
			password: hashedPassword,
		},
	})

	// send response
	sendResponse(res, {user: newUser}, 'User created successfully', 201)
}

// logout
const logoutUser = async (req: Request, res: Response, next: NextFunction) => {
	req.logout((err) => {
		if (err) return next(err);

		req.session.destroy(() => {
			res.clearCookie("connect.sid");
			res.redirect("/");
		});
	});
};

export { signupUser, logoutUser }