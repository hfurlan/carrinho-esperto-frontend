import { Link } from 'react-router-dom';

export function NotFoundPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-stone-50 px-4 text-center">
      <p className="text-sm font-medium text-slate-800">Página não encontrada.</p>
      <Link to="/" className="text-sm font-semibold text-emerald-700 hover:underline">
        Voltar para o início
      </Link>
    </div>
  );
}
