import { renderHook, act } from '@testing-library/react-hooks';
import { useReports } from './useReports';
import { vi } from 'vitest';
import { supabase } from '../supabase';

vi.mock('../supabase', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        order: vi.fn(() => ({
          data: [
            { id: 1, mes: 'Enero', ventas: 1000, costos: 500, ganancia: 500, gastos: 200, balance: 300 },
            { id: 2, mes: 'Febrero', ventas: 1200, costos: 600, ganancia: 600, gastos: 250, balance: 350 },
          ],
          error: null,
        })),
      })),
    })),
  },
}));

describe('useReports', () => {
  it('carga los reportes correctamente', async () => {
    const { result, waitForNextUpdate } = renderHook(() => useReports());

    expect(result.current.loading).toBe(true);

    await waitForNextUpdate();

    expect(result.current.loading).toBe(false);
    expect(result.current.reports.length).toBe(2);
    expect(result.current.reports[0].mes).toBe('Enero');
  });

  it('maneja errores de Supabase', async () => {
    supabase.from.mockReturnValueOnce({
      select: () => ({
        order: () => ({
          data: null,
          error: { message: 'Error de conexión' },
        }),
      }),
    });

    const { result, waitForNextUpdate } = renderHook(() => useReports());

    await waitForNextUpdate();

    expect(result.current.reports).toEqual([]);
    expect(result.current.loading).toBe(false);
  });
});