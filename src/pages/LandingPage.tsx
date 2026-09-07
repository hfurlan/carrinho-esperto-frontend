import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/authContext.ts';
import { Button } from '../components/ui.tsx';

const STEPS = [
  { icon: '📷', title: 'Aponte a câmera', text: 'Leia o QR Code do cupom fiscal — sem digitar nada.' },
  { icon: '🧾', title: 'Veja a nota', text: 'Estabelecimento, itens e valores organizados na hora.' },
  { icon: '🥗', title: 'Entenda a compra', text: 'O que foi básico, o que foi supérfluo e uma nota de equilíbrio.' },
];

export function LandingPage() {
  const { startAnonymousSession } = useAuth();
  const navigate = useNavigate();
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onTry = async () => {
    setError(null);
    setStarting(true);
    try {
      await startAnonymousSession();
      navigate('/importar');
    } catch {
      setError('Não foi possível começar agora. Tente novamente em instantes.');
      setStarting(false);
    }
  };

  return (
    <div className="min-h-screen bg-stone-50">
      <header className="mx-auto flex max-w-3xl items-center justify-between px-4 py-4">
        <div className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-600 text-base text-white">
            🛒
          </span>
          <span className="text-sm font-bold tracking-tight text-slate-900">Carrinho Esperto</span>
        </div>
        <Link to="/login" className="text-sm font-medium text-slate-500 hover:text-slate-800">
          Entrar
        </Link>
      </header>

      <main className="mx-auto max-w-3xl px-4 pb-16 pt-6 sm:pt-12">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
          Pegue sua nota. Aponte a câmera. Veja o que comprou.
        </h1>
        <p className="mt-3 max-w-xl text-base text-slate-600">
          O Carrinho Esperto lê a nota fiscal (NFC-e) do seu supermercado e mostra, na hora, como foi a
          compra — sem precisar criar conta.
        </p>

        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
          <Button onClick={onTry} disabled={starting} className="px-5 py-3 text-base">
            {starting ? 'Preparando…' : 'Experimente com sua nota fiscal'}
          </Button>
          <span className="text-xs text-slate-400">Sem cadastro. Sem senha.</span>
        </div>
        {error && (
          <p className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
        )}

        <ol className="mt-12 grid gap-4 sm:grid-cols-3">
          {STEPS.map((step, i) => (
            <li key={step.title} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-50 text-lg" aria-hidden>
                {step.icon}
              </div>
              <p className="mt-3 text-sm font-semibold text-slate-900">
                {i + 1}. {step.title}
              </p>
              <p className="mt-1 text-sm text-slate-500">{step.text}</p>
            </li>
          ))}
        </ol>

        <p className="mt-10 text-sm text-slate-500">
          Quer guardar o histórico e ver relatórios ao longo do tempo?{' '}
          <Link to="/login" className="font-medium text-emerald-700 hover:underline">
            Crie sua conta depois
          </Link>{' '}
          — os dados do teste ficam só neste navegador.
        </p>
      </main>
    </div>
  );
}
