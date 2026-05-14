"use server";
/**
 * Todas as funções que escrever aqui são Server Actions, ou seja, podem chamar recursos do servidor (banco de dados)
 * e podem ser chamadas por Client Components, como uma rota de API.
 */

import { db } from "@/db";
import { clinicsTable, usersToClinicsTable } from "@/db/schema";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

/**
 * Cria uma nova clínica e associa o usuário logado a ela.
 * @param name Nome da clínica a ser cadastrada
 */
export const createClinic = async (name: string) => {
  // Verificar se usuário está logado
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  // Se não estiver logad, lança erro
  if (!session?.user) {
    throw new Error("Unauthorized");
  }
  // Cria a clínica e associa ao usuário logado
  const [clinic] = await db.insert(clinicsTable).values({ name }).returning();
  await db.insert(usersToClinicsTable).values({
    userId: session.user.id,
    clinicId: clinic.id,
  });
  redirect("/dashboard"); // Redireciona para o dashboard após criar a clínica
};
