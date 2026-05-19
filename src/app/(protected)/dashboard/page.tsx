import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import SignOutButton from "./_components/sign-out-button";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { eq } from "drizzle-orm";
import { usersToClinicsTable } from "@/db/schema";

const DashboardPage = async () => {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  /**
   * Se o usuário não estiver logado, redireciona para a página de autenticação.
   * Isso garante que apenas usuários autenticados possam acessar o dashboard.
   */
  if (!session?.user) {
    redirect("/authentication");
  }

  /**
   * Se o usuário não tiver clínicas associadas, redireciona para o formulário de criação de clínica.
   */
  if (!session.user.clinic) {
    redirect("/clinic-form");
  }

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold">Dashboard</h1>
      <h1>{session?.user?.name}</h1>
      <h1>{session?.user?.email}</h1>
      <SignOutButton />
    </div>
  );
};

export default DashboardPage;
