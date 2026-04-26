import { z } from "zod";
 
export const registerSchema = z.object({
  firstName: z.string().min(1, "Ime je obavezno."),
  lastName:  z.string().min(1, "Prezime je obavezno."),
  username:  z.string().min(2, "Korisničko ime mora imati najmanje 2 znaka."),
  email:     z.string().email("Format email adrese nije ispravan."),
  password:  z
    .string()
    .min(8, "Lozinka mora imati najmanje 8 znakova.")
    .regex(/[0-9]/, "Lozinka mora sadržavati najmanje jedan broj.")
    .regex(/[A-Z]/, "Lozinka mora sadržavati najmanje jedno veliko slovo."),
  companyId: z
    .number({ invalid_type_error: "companyId mora biti broj." })
    .int()
    .positive("companyId mora biti pozitivan cijeli broj.")
    .optional(),
});

export type RegisterInput = z.infer<typeof registerSchema>;