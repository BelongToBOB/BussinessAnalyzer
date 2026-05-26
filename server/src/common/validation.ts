import { z } from 'zod';

export const upsertEntrySchema = z.object({
  grossSales: z.number().min(0).nullable().optional(),
  creditSales: z.number().min(0).nullable().optional(),
  cogs: z.number().min(0).nullable().optional(),
  otherExpenses: z.number().min(0).nullable().optional(),
  cashIn: z.number().min(0).nullable().optional(),
  arBalance: z.number().min(0).nullable().optional(),
  apBalance: z.number().min(0).nullable().optional(),
  cashOnHand: z.number().min(0).nullable().optional(),
  leakNote: z.string().max(500).nullable().optional(),
}).refine(
  (data) => {
    if (data.creditSales != null && data.grossSales != null) {
      return data.creditSales <= data.grossSales;
    }
    return true;
  },
  { message: 'creditSales must not exceed grossSales', path: ['creditSales'] },
);

export const createBusinessSchema = z.object({
  name: z.string().min(1).max(200),
  monthlyDebtService: z.number().min(0).nullable().optional(),
});

export const updateBusinessSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  monthlyDebtService: z.number().min(0).nullable().optional(),
});

/** Parse YYYY-MM string into Date (1st of month). Rejects future months. */
export function parseMonth(yyyyMm: string): Date {
  const match = yyyyMm.match(/^(\d{4})-(\d{2})$/);
  if (!match) throw new Error('Invalid month format. Use YYYY-MM.');

  const year = parseInt(match[1], 10);
  const month = parseInt(match[2], 10);
  if (month < 1 || month > 12) throw new Error('Invalid month.');

  const date = new Date(year, month - 1, 1);

  const now = new Date();
  const currentMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  if (date > currentMonth) throw new Error('Cannot enter data for future months.');

  return date;
}

export type UpsertEntryDto = z.infer<typeof upsertEntrySchema>;
export type CreateBusinessDto = z.infer<typeof createBusinessSchema>;
export type UpdateBusinessDto = z.infer<typeof updateBusinessSchema>;
