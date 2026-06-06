import { FastifyRequest, FastifyReply } from "fastify";
import * as proposalsService from "./proposals.service";
import { createProposalSchema, updateProposalSchema } from "./proposals.schema";
import { successResponse } from "../../utils/response";

// Supplier controllers
export async function createProposal(request: FastifyRequest, reply: FastifyReply) {
  const { tenderId } = request.params as { tenderId: string };
  const input = createProposalSchema.parse(request.body);
  const { accountId, userId } = request.user;
  const data = await proposalsService.createProposal(input, tenderId, accountId, userId);
  return reply.status(201).send(successResponse(data, "Proposal submitted successfully"));
}

export async function getSupplierProposals(request: FastifyRequest, reply: FastifyReply) {
  const data = await proposalsService.getSupplierProposals(request.user.accountId);
  return reply.send(successResponse(data));
}

export async function getSupplierProposalById(request: FastifyRequest, reply: FastifyReply) {
  const { id } = request.params as { id: string };
  const data = await proposalsService.getSupplierProposalById(id, request.user.accountId);
  return reply.send(successResponse(data));
}

export async function updateSupplierProposal(request: FastifyRequest, reply: FastifyReply) {
  const { id } = request.params as { id: string };
  const input = updateProposalSchema.parse(request.body);
  const data = await proposalsService.updateSupplierProposal(id, input, request.user.accountId);
  return reply.send(successResponse(data, "Proposal updated successfully"));
}

export async function withdrawProposal(request: FastifyRequest, reply: FastifyReply) {
  const { id } = request.params as { id: string };
  const data = await proposalsService.withdrawProposal(id, request.user.accountId);
  return reply.send(successResponse(data, "Proposal withdrawn successfully"));
}

// Buyer controllers
export async function getBuyerProposalById(request: FastifyRequest, reply: FastifyReply) {
  const { id } = request.params as { id: string };
  const data = await proposalsService.getBuyerProposalById(id, request.user.accountId);
  return reply.send(successResponse(data));
}

export async function shortlistProposal(request: FastifyRequest, reply: FastifyReply) {
  const { id } = request.params as { id: string };
  const data = await proposalsService.shortlistProposal(id, request.user.accountId);
  return reply.send(successResponse(data, "Proposal shortlisted"));
}

export async function rejectProposal(request: FastifyRequest, reply: FastifyReply) {
  const { id } = request.params as { id: string };
  const { accountId, userId } = request.user;
  const data = await proposalsService.rejectProposal(id, accountId, userId, accountId);
  return reply.send(successResponse(data, "Proposal rejected"));
}

export async function acceptProposal(request: FastifyRequest, reply: FastifyReply) {
  const { id } = request.params as { id: string };
  const { accountId, userId } = request.user;
  const data = await proposalsService.acceptProposal(id, accountId, userId, accountId);
  return reply.send(successResponse(data, "Proposal accepted"));
}

// Internal
export async function getInternalProposalById(request: FastifyRequest, reply: FastifyReply) {
  const { id } = request.params as { id: string };
  const data = await proposalsService.getInternalProposalById(id);
  return reply.send(successResponse(data));
}
