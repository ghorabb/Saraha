export function successResponse({
  res,
  statusCode,
  status = "success",
  message,
  data,
}) {
  return res.status(statusCode).json({
    status,
    message,
    data,
  });
}

export function globalHandling(error, req, res, next) {
  const statusCode = error.cause?.statusCode ?? 500;

  if (process.env.NODE_ENV === "dev") {
    return res.status(statusCode).json({
      status: "error",
      message: error.message,
      error,
      stack: error.stack,
    });
  }

  return res.status(statusCode).json({
    status: "error",
    message: statusCode >= 500 ? "Something went wrong" : error.message,
  });
}

export function notFoundException(msg) {
  throw new Error(msg, { cause: { statusCode: 404 } });
}

export function badRequestException(msg) {
  throw new Error(msg, { cause: { statusCode: 400 } });
}

export function conflictException(msg) {
  throw new Error(msg, { cause: { statusCode: 409 } });
}

export function unAuthorizedException(msg) {
  throw new Error(msg, { cause: { statusCode: 401 } });
}

export function forbiddenException(msg) {
  throw new Error(msg, { cause: { statusCode: 403 } });
}
