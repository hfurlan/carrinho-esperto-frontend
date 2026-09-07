import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { QrCameraScanner, type CameraScanStart } from './QrCameraScanner.tsx';

describe('QrCameraScanner', () => {
  it('reports a decoded value once and stops the camera', async () => {
    const stop = vi.fn();
    let emit: (text: string) => void = () => {};
    const start: CameraScanStart = vi.fn(async (_video, onDecode) => {
      emit = onDecode;
      return { stop };
    });
    const onResult = vi.fn();

    render(<QrCameraScanner onResult={onResult} onClose={() => {}} start={start} />);

    await screen.findByText('Aponte a câmera para o QR Code da nota fiscal.');
    emit('https://example.com/a');
    emit('https://example.com/b'); // late frame — must be ignored

    await waitFor(() => expect(onResult).toHaveBeenCalledTimes(1));
    expect(onResult).toHaveBeenCalledWith('https://example.com/a');
    expect(stop).toHaveBeenCalled();
  });

  it('falls back with guidance when camera permission is denied (not trapped)', async () => {
    const start: CameraScanStart = vi.fn(async () => {
      throw Object.assign(new Error('denied'), { name: 'NotAllowedError' });
    });

    render(<QrCameraScanner onResult={vi.fn()} onClose={() => {}} start={start} />);

    expect(await screen.findByText(/Acesso à câmera negado/)).toBeInTheDocument();
    expect(screen.getByText(/Enviar foto.*cole a URL/s)).toBeInTheDocument();
  });

  it('can be closed', async () => {
    const onClose = vi.fn();
    const start: CameraScanStart = vi.fn(async () => ({ stop: vi.fn() }));

    render(<QrCameraScanner onResult={vi.fn()} onClose={onClose} start={start} />);
    await userEvent.click(screen.getByRole('button', { name: 'Fechar leitor' }));
    expect(onClose).toHaveBeenCalled();
  });
});
