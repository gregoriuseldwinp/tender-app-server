import { FastifyRequest, FastifyReply } from "fastify";
import * as negotiationsService from "./negotiations.service";
import { createCommentSchema } from "./negotiations.schema";
import { successResponse } from "../../utils/response";

export async function getBuyerNegotiations(request: FastifyRequest, reply: FastifyReply) {
  const { proposalId } = request.params as { proposalId: string };
  const data = await negotiationsService.getBuyerNegotiations(proposalId, request.user.accountId);
  return reply.send(successResponse(data));
}

export async function createBuyerComment(request: FastifyRequest, reply: FastifyReply) {
  const { proposalId } = request.params as { proposalId: string };
  const input = createCommentSchema.parse(request.body);
  const { userId, accountId } = request.user;
  const data = await negotiationsService.createBuyerComment(proposalId, input, userId, accountId);
  return reply.status(201).send(successResponse(data, "Comment added"));
}

export async function getSupplierNegotiations(request: FastifyRequest, reply: FastifyReply) {
  const { proposalId } = request.params as { proposalId: string };
  const data = await negotiationsService.getSupplierNegotiations(proposalId, request.user.accountId);
  return reply.send(successResponse(data));
}

export async function createSupplierComment(request: FastifyRequest, reply: FastifyReply) {
  const { proposalId } = request.params as { proposalId: string };
  const input = createCommentSchema.parse(request.body);
  const { userId, accountId } = request.user;
  const data = await negotiationsService.createSupplierComment(proposalId, input, userId, accountId);
  return reply.status(201).send(successResponse(data, "Comment added"));
}

export async function getInternalNegotiations(request: FastifyRequest, reply: FastifyReply) {
  const { proposalId } = request.params as { proposalId: string };
  const data = await negotiationsService.getInternalNegotiations(proposalId);
  return reply.send(successResponse(data));
}
