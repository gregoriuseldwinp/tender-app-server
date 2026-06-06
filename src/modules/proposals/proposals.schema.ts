import { z } from "zod";

export const createProposalSchema = z.object({
  title: z.string().min(3),
  description: z.string().min(10),
  priceOffer: z.number().positive().optional(),
  estimatedDeliveryTime: z.string().optional(),
  termsAndConditions: z.string().optional(),
  attachments: z.array(z.record(z.unknown())).optional(),
});

export const updateProposalSchema = z.object({
  title: z.string().min(3).optional(),
  description: z.string().min(10).optional(),
  priceOffer: z.number().positive().optional(),
  estimatedDeliveryTime: z.string().optional(),
  termsAndConditions: z.string().optional(),
  attachments: z.array(z.record(z.unknown())).optional(),
});

export type CreateProposalInput = z.infer<typeof createProposalSchema>;
export type UpdateProposalInput = z.infer<typeof updateProposalSchema>;
