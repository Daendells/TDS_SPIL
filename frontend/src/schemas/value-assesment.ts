import z from "zod";

export const GreetingsSchema = z.object({
  email: z
    .string()
    .min(1, { message: "Email wajib diisi" })
    .max(100, { message: "Email maksimal 100 karakter" })
    .email({ message: "Format email tidak valid" }),
  consent: z.string().min(1),
});

export const PersonalIdentitySchema = z.object({
  fullName: z.string().min(1, { message: "Nama lengkap harus diisi" }),
  rank: z.string().min(1, { message: "Rank harus dipilih" }),
  vesselName: z.string().min(1, { message: "Nama vessel/akademi harus diisi" }),
  seamanCode: z.string().min(1, { message: "Seaman code harus diisi" }),
});

export type GreetingsData = z.infer<typeof GreetingsSchema>;
export type PersonalIdentityData = z.infer<typeof PersonalIdentitySchema>;