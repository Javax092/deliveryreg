export default function OfflinePage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-lg flex-col justify-center px-5">
      <h1 className="text-2xl font-semibold text-slate-950">Você está sem conexão</h1>
      <p className="mt-3 text-slate-700">
        Assim que a internet voltar, abra o catálogo novamente para ver preços e disponibilidade
        atualizados.
      </p>
    </main>
  );
}
