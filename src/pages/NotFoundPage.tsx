import { Link } from 'react-router-dom';

export function NotFoundPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-paper px-5 text-center">
      <p className="font-display text-lg font-bold text-ink">Essa página não existe</p>
      <Link to="/" className="text-sm font-semibold text-accent hover:underline">
        Voltar para o início
      </Link>
    </div>
  );
}
