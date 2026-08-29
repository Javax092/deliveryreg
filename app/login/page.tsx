import { LoginForm } from "./LoginForm";

export default function LoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-100 px-4 py-8">
      <section className="w-full max-w-sm rounded-lg bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-semibold text-slate-950">Entrar</h1>
        <p className="mt-2 text-sm text-slate-700">Acesso interno da operação.</p>
        <LoginForm />
      </section>
    </main>
  );
}
