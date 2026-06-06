import { z } from "zod";

export const createTenderSchema = z.object({
  title: z.string().min(3),
  description: z.string().min(10),
  openTender: z.boolean().default(true),
  needs: z.string().min(5),
  category: z.string().optional(),
  budgetEstimate: z.number().positive().optional(),
  deadline: z.string().datetime().optional(),
  deliveryLocation: z.string().optional(),
  attachments: z.array(z.record(z.unknown())).optional(),
});

export const updateTenderSchema = z.object({
  title: z.string().min(3).optional(),
  description: z.string().min(10).optional(),
  openTender: z.boolean().optional(),
  needs: z.string().min(5).optional(),
  category: z.string().optional(),
  budgetEstimate: z.number().positive().optional(),
  deadline: z.string().datetime().optional(),
  deliveryLocation: z.string().optional(),
  attachments: z.array(z.record(z.unknown())).optional(),
});

export const rejectTenderSchema = z.object({
  reason: z.string().min(5),
});

export type CreateTenderInput = z.infer<typeof createTenderSchema>;
export type UpdateTenderInput = z.infer<typeof updateTenderSchema>;
export type RejectTenderInput = z.infer<typeof rejectTenderSchema>;
