// src/utils/response.ts
export const sendResponse = <T>(
  res: any,
  data: T,
  message = "success",
  status = 200
) => {
  return res.status(status).json({
    success: true,
    message,
    data,
  });
};

/**
 * example usage
 * return sendResponse(res, data, message, statusCode)
 * return sendResponse(res, user, "User created", 201);
 * 					  const data   message		  status
 */