import { FastifyRequest, FastifyReply } from "fastify";
import * as accountsService from "./accounts.service";
import { rejectAccountSchema } from "./accounts.schema";
import { successResponse } from "../../utils/response";

export async function getPendingAccounts(_request: FastifyRequest, reply: FastifyReply) {
  const data = await accountsService.getPendingAccounts();
  return reply.send(successResponse(data));
}

export async function getAllAccounts(_request: FastifyRequest, reply: FastifyReply) {
  const data = await accountsService.getAllAccounts();
  return reply.send(successResponse(data));
}

export async function getAccountById(request: FastifyRequest, reply: FastifyReply) {
  const { id } = request.params as { id: string };
  const data = await accountsService.getAccountById(id);
  return reply.send(successResponse(data));
}

export async function approveAccount(request: FastifyRequest, reply: FastifyReply) {
  const { id } = request.params as { id: string };
  const { userId, accountId } = request.user;
  const data = await accountsService.approveAccount(id, userId, accountId);
  return reply.send(successResponse(data, "Account approved successfully"));
}

export async function rejectAccount(request: FastifyRequest, reply: FastifyReply) {
  const { id } = request.params as { id: string };
  const { userId, accountId } = request.user;
  const { reason } = rejectAccountSchema.parse(request.body);
  const data = await accountsService.rejectAccount(id, reason, userId, accountId);
  return reply.send(successResponse(data, "Account rejected successfully"));
}

export async function suspendAccount(request: FastifyRequest, reply: FastifyReply) {
  const { id } = request.params as { id: string };
  const { userId, accountId } = request.user;
  const data = await accountsService.suspendAccount(id, userId, accountId);
  return reply.send(successResponse(data, "Account suspended successfully"));
}
