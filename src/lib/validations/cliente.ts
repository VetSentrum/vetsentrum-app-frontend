import { z } from "zod";

export const CreateClienteSchema = z.object({
  nombre_completo: z.string().min(3, "El nombre debe tener al menos 3 caracteres"),
  telefono: z.string().min(7, "Teléfono inválido"),
  email: z.string().email("Email inválido").optional(),
  direccion: z.string().optional(),
});

export const UpdateClienteSchema = CreateClienteSchema.partial(); // Para edición, todos opcionales