// src/utils/AppError.ts
export class AppError extends Error {
  constructor(
    public message: string,
    public statusCode = 500
  ) {
    super(message);
  }
}

/**
 * example usage
 * throw new AppError(message, statusCode)
 * throw new AppError("User already exists", 400);
 * 					   	message				statusCode
 */