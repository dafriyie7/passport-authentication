// middleware/errorHandler.ts
import { ErrorRequestHandler } from 'express';
import { AppError } from '../utils/AppError.js'

export const errorHandler: ErrorRequestHandler = (err, req, res, next) => {
  if (err instanceof AppError) {
	  return res.status(err.statusCode).json({
		success: false,
      	message: err.message,
    });
  }
  // Handle unexpected errors
  console.error(err);
	return res.status(500).json({
		success: false,
		message: 'Something went wrong',
  });
};   