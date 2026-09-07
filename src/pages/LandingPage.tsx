import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/authContext.ts';
import { Button } from '../components/ui.tsx';

const STEPS = [
  { n: '1', title: 'Aponte a câmera', text: 'Leia o QR Code do cupom — sem digitar nada.' },
  { n: '2', title: 'Veja a nota', text: 'Estabelecimento, itens e valores organizados na hora.' },
  { n: '3', title: 'Entenda a compra', text: 'O que foi básico, o que foi supérfluo e uma nota de equilíbrio.' },
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
      setError('Não deu para começar agora. Tente de novo em instantes.');
      setStarting(false);
    }
  };

  return (
    <div className="min-h-screen bg-paper">
      <header className="mx-auto flex max-w-2xl items-center justify-between px-5 py-4">
        <div className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-accent text-base text-white">
            🛒
          </span>
          <span className="font-display text-sm font-extrabold tracking-tight text-ink">Carrinho Esperto</span>
        </div>
        <Link to="/login" className="text-sm font-medium text-muted hover:text-ink">
          Entrar
        </Link>
      </header>

      <main className="mx-auto max-w-2xl px-5 pb-16 pt-6 sm:pt-14">
        <h1 className="font-display text-[2rem] font-extrabold leading-[1.1] tracking-tight text-ink text-balance sm:text-4xl">
          Pegue sua nota. Aponte a câmera. Veja o que comprou.
        </h1>
        <p className="mt-3 max-w-md text-[15px] text-muted">
          O Carrinho Esperto lê a nota fiscal do seu supermercado e mostra, na hora, como foi a compra. Sem
          cadastro.
        </p>

        <div className="mt-6">
          <Button onClick={onTry} disabled={starting} className="w-full px-5 py-3.5 text-base sm:w-auto">
            {starting ? 'Preparando…' : 'Experimente com sua nota'}
          </Button>
          <p className="mt-2 text-xs text-muted">Sem cadastro. Sem senha.</p>
        </div>
        {error && (
          <p className="mt-3 rounded-lg border border-rose/40 bg-rose-soft px-3 py-2 text-sm text-rose">{error}</p>
        )}

        <ol className="mt-12 border-t border-line">
          {STEPS.map((step) => (
            <li key={step.n} className="flex gap-4 border-b border-line py-4">
              <span className="font-display text-sm font-extrabold text-accent">{step.n}</span>
              <div>
                <p className="text-[15px] font-semibold text-ink">{step.title}</p>
                <p className="mt-0.5 text-sm text-muted">{step.text}</p>
              </div>
            </li>
          ))}
        </ol>

        <p className="mt-8 text-sm text-muted">
          Quer guardar o histórico e ver seus gastos ao longo do tempo?{' '}
          <Link to="/cadastro" className="font-semibold text-accent hover:underline">
            Crie sua conta depois
          </Link>
          . Os dados do teste ficam só neste aparelho.
        </p>
      </main>
    </div>
  );
}
