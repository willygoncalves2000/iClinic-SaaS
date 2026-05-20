"use server";

import { db } from "@/db";
import { doctorsTable } from "@/db/schema";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { actionClient } from "@/lib/next-safe-action";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";

import { upsertDoctorSchema } from "./schema";
import { revalidatePath } from "next/cache";

/**
 * Cria um novo médico e associa à clínica.
 * @param doctorData Dados do médico a ser cadastrado
 */

dayjs.extend(utc);

export const upsertDoctor = actionClient
  .schema(upsertDoctorSchema)
  .action(async ({ parsedInput }) => {
    const availableFromTime = parsedInput.availableFromTime; // 15:30:00
    const availableToTime = parsedInput.availableToTime; // 18:00:00

    // Formata os horários para UTC, garantindo que sejam armazenados de forma consistente no banco de dados
    const avaialbleFromTimeUTC = dayjs()
      .set(
        "hour",
        parseInt(availableFromTime.split(":")[0]), // [15, 30, 00] -> 15
      )
      .set(
        "minute",
        parseInt(availableFromTime.split(":")[1]), // [15, 30, 00] -> 30
      )
      .set(
        "second",
        parseInt(availableFromTime.split(":")[2]), // [15, 30, 00] -> 00
      )
      .utc();
    const avaialbleToTimeUTC = dayjs()
      .set(
        "hour",
        parseInt(availableToTime.split(":")[0]), // [15, 30, 00] -> 15
      )
      .set(
        "minute",
        parseInt(availableToTime.split(":")[1]), // [15, 30, 00] -> 30
      )
      .set(
        "second",
        parseInt(availableToTime.split(":")[2]), // [15, 30, 00] -> 00
      )
      .utc();

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
        ...parsedInput,
        id: parsedInput.id,
        clinicId: session?.user.clinic?.id,
        availableFromTime: avaialbleFromTimeUTC.format("HH:mm:ss"),
        availableToTime: avaialbleToTimeUTC.format("HH:mm:ss"),
      })
      // Se o médico já existir (baseado no ID), atualiza os dados
      .onConflictDoUpdate({
        target: [doctorsTable.id],
        set: {
          ...parsedInput,
          availableFromTime: avaialbleFromTimeUTC.format("HH:mm:ss"),
          availableToTime: avaialbleToTimeUTC.format("HH:mm:ss"),
        },
      });
    revalidatePath("/doctors");
  });
