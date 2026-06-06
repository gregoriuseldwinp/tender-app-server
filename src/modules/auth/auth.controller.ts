import { FastifyRequest, FastifyReply } from "fastify";
import * as authService from "./auth.service";
import { registerBuyerSchema, registerSupplierSchema, loginSchema } from "./auth.schema";
import { successResponse } from "../../utils/response";
import { env } from "../../config/env";

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
};

export async function registerBuyer(request: FastifyRequest, reply: FastifyReply) {
  const input = registerBuyerSchema.parse(request.body);
  const result = await authService.registerBuyer(input);
  return reply.status(201).send(
    successResponse(result, "Buyer account registered successfully. Awaiting admin approval.")
  );
}

export async function registerSupplier(request: FastifyRequest, reply: FastifyReply) {
  const input = registerSupplierSchema.parse(request.body);
  const result = await authService.registerSupplier(input);
  return reply.status(201).send(
    successResponse(result, "Supplier account registered successfully. Awaiting admin approval.")
  );
}

export async function login(request: FastifyRequest, reply: FastifyReply) {
  const input = loginSchema.parse(request.body);
  const { token, user, account } = await authService.login(input);

  reply.setCookie(env.COOKIE_NAME, token, {
    ...COOKIE_OPTIONS,
    maxAge: 7 * 24 * 60 * 60, // 7 days
  });

  return reply.send(successResponse({ user, account }, "Logged in successfully"));
}

export async function logout(_request: FastifyRequest, reply: FastifyReply) {
  reply.clearCookie(env.COOKIE_NAME, { path: "/" });
  return reply.send(successResponse(null, "Logged out successfully"));
}

export async function getMe(request: FastifyRequest, reply: FastifyReply) {
  const result = await authService.getMe(request.user.userId);
  return reply.send(successResponse(result));
}

export async function getMyPermissions(request: FastifyRequest, reply: FastifyReply) {
  const result = await authService.getMyPermissions(request.user.userId);
  return reply.send(successResponse(result));
}
