import { z } from "zod";

export const rejectAccountSchema = z.object({
  reason: z.string().min(5),
});

export type RejectAccountInput = z.infer<typeof rejectAccountSchema>;
