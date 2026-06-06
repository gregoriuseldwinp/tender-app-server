import { FastifyError, FastifyRequest, FastifyReply } from "fastify";
import { ZodError } from "zod";

export function errorHandler(
  error: FastifyError,
  request: FastifyRequest,
  reply: FastifyReply
) {
  if (error instanceof ZodError) {
    return reply.status(400).send({
      success: false,
      message: "Validation error",
      errors: error.flatten().fieldErrors,
    });
  }

  if (error.statusCode === 400) {
    return reply.status(400).send({
      success: false,
      message: error.message || "Bad request",
    });
  }

  if (error.statusCode === 401) {
    return reply.status(401).send({
      success: false,
      message: error.message || "Unauthorized",
    });
  }

  if (error.statusCode === 403) {
    return reply.status(403).send({
      success: false,
      message: error.message || "Forbidden",
    });
  }

  if (error.statusCode === 404) {
    return reply.status(404).send({
      success: false,
      message: error.message || "Not found",
    });
  }

  // FST_ERR_VALIDATION is Fastify's built-in schema validation error
  if (error.code === "FST_ERR_VALIDATION") {
    return reply.status(400).send({
      success: false,
      message: "Validation error",
      errors: error.message,
    });
  }

  request.log.error(error);

  return reply.status(500).send({
    success: false,
    message: "Internal server error",
  });
}
