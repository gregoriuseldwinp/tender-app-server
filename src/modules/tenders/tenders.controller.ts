import { FastifyRequest, FastifyReply } from "fastify";
import * as tendersService from "./tenders.service";
import { createTenderSchema, updateTenderSchema, rejectTenderSchema } from "./tenders.schema";
import { successResponse } from "../../utils/response";

// Buyer controllers
export async function createTender(request: FastifyRequest, reply: FastifyReply) {
  const input = createTenderSchema.parse(request.body);
  const { accountId, userId } = request.user;
  const data = await tendersService.createTender(input, accountId, userId);
  return reply.status(201).send(successResponse(data, "Tender created successfully"));
}

export async function getBuyerTenders(request: FastifyRequest, reply: FastifyReply) {
  const data = await tendersService.getBuyerTenders(request.user.accountId);
  return reply.send(successResponse(data));
}

export async function getBuyerTenderById(request: FastifyRequest, reply: FastifyReply) {
  const { id } = request.params as { id: string };
  const data = await tendersService.getBuyerTenderById(id, request.user.accountId);
  return reply.send(successResponse(data));
}

export async function updateBuyerTender(request: FastifyRequest, reply: FastifyReply) {
  const { id } = request.params as { id: string };
  const input = updateTenderSchema.parse(request.body);
  const data = await tendersService.updateBuyerTender(id, input, request.user.accountId);
  return reply.send(successResponse(data, "Tender updated successfully"));
}

export async function deleteBuyerTender(request: FastifyRequest, reply: FastifyReply) {
  const { id } = request.params as { id: string };
  await tendersService.deleteBuyerTender(id, request.user.accountId);
  return reply.send(successResponse(null, "Tender deleted successfully"));
}

export async function getBuyerTenderProposals(request: FastifyRequest, reply: FastifyReply) {
  const { id } = request.params as { id: string };
  const data = await tendersService.getBuyerTenderProposals(id, request.user.accountId);
  return reply.send(successResponse(data));
}

// Supplier controllers
export async function getPublishedTenders(_request: FastifyRequest, reply: FastifyReply) {
  const data = await tendersService.getPublishedTenders();
  return reply.send(successResponse(data));
}

export async function getPublishedTenderById(request: FastifyRequest, reply: FastifyReply) {
  const { id } = request.params as { id: string };
  const data = await tendersService.getPublishedTenderById(id);
  return reply.send(successResponse(data));
}

// Internal controllers
export async function getAllTenders(_request: FastifyRequest, reply: FastifyReply) {
  const data = await tendersService.getAllTenders();
  return reply.send(successResponse(data));
}

export async function getPendingTenders(_request: FastifyRequest, reply: FastifyReply) {
  const data = await tendersService.getPendingTenders();
  return reply.send(successResponse(data));
}

export async function getInternalTenderById(request: FastifyRequest, reply: FastifyReply) {
  const { id } = request.params as { id: string };
  const data = await tendersService.getInternalTenderById(id);
  return reply.send(successResponse(data));
}

export async function approveTender(request: FastifyRequest, reply: FastifyReply) {
  const { id } = request.params as { id: string };
  const { userId, accountId } = request.user;
  const data = await tendersService.approveTender(id, userId, accountId);
  return reply.send(successResponse(data, "Tender approved and published"));
}

export async function rejectTender(request: FastifyRequest, reply: FastifyReply) {
  const { id } = request.params as { id: string };
  const { userId, accountId } = request.user;
  const { reason } = rejectTenderSchema.parse(request.body);
  const data = await tendersService.rejectTender(id, reason, userId, accountId);
  return reply.send(successResponse(data, "Tender rejected"));
}

export async function closeTender(request: FastifyRequest, reply: FastifyReply) {
  const { id } = request.params as { id: string };
  const { userId, accountId } = request.user;
  const data = await tendersService.closeTender(id, userId, accountId);
  return reply.send(successResponse(data, "Tender closed"));
}

export async function cancelTender(request: FastifyRequest, reply: FastifyReply) {
  const { id } = request.params as { id: string };
  const { userId, accountId } = request.user;
  const data = await tendersService.cancelTender(id, userId, accountId);
  return reply.send(successResponse(data, "Tender cancelled"));
}
