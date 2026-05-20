"use server";

import { db } from "@/db";
import { doctorsTable } from "@/db/schema";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { actionClient } from "@/lib/next-safe-action";
import { upsertDoctorSchema } from "./schema";
/**
 * Cria um novo médico e associa à clínica.
 * @param doctorData Dados do médico a ser cadastrado
 */
export const upsertDoctor = actionClient
  .schema(upsertDoctorSchema)
  .action(async ({ parsedInput }) => {
    // Verificar se usuário está logado
    const session = await auth.api.getSession({
      headers: await headers(),
    });
    // Se não estiver logado, lança erro
    if (!session?.user) {
      throw new Error("Unauthorized");
    }
    // Verificar se o usuário tem uma clínica associada
    if (!session?.user.clinic?.id) {
      throw new Error("Clinic not found");
    }

    // Cria o médico e associa a clínica
    await db
      .insert(doctorsTable)
      .values({
        id: parsedInput.id,
        ...parsedInput,
        clinicId: session?.user.clinic?.id,
      })
      // Se o médico já existir (baseado no ID), atualiza os dados
      .onConflictDoUpdate({
        target: [doctorsTable.id],
        set: {
          ...parsedInput,
        },
      });
  });
