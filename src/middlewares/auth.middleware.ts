import { FastifyRequest, FastifyReply } from "fastify";
import { verifyToken, JwtPayload } from "../utils/jwt";
import { env } from "../config/env";

declare module "fastify" {
  interface FastifyRequest {
    user: JwtPayload;
  }
}

export async function authMiddleware(request: FastifyRequest, reply: FastifyReply) {
  const token = request.cookies[env.COOKIE_NAME];

  if (!token) {
    return reply.status(401).send({ success: false, message: "Unauthorized: No token provided" });
  }

  try {
    const payload = verifyToken(token);
    request.user = payload;
  } catch {
    return reply.status(401).send({ success: false, message: "Unauthorized: Invalid or expired token" });
  }
}
