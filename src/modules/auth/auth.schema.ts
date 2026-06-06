import { z } from "zod";

export const registerBuyerSchema = z.object({
  companyName: z.string().min(2),
  legalName: z.string().optional(),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  address: z.string().optional(),
  ownerName: z.string().min(2),
  ownerEmail: z.string().email(),
  ownerPassword: z.string().min(8),
});

export const registerSupplierSchema = z.object({
  companyName: z.string().min(2),
  legalName: z.string().optional(),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  address: z.string().optional(),
  ownerName: z.string().min(2),
  ownerEmail: z.string().email(),
  ownerPassword: z.string().min(8),
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export type RegisterBuyerInput = z.infer<typeof registerBuyerSchema>;
export type RegisterSupplierInput = z.infer<typeof registerSupplierSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
