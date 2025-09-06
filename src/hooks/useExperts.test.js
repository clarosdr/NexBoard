import { renderHook } from '@testing-library/react-hooks-testing-library';
import { useExperts } from './useExperts';
import { vi } from 'vitest';

// Mock de Supabase o cualquier dependencia externa
vi.mock('../lib/supabaseClient', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn().mockResolvedValue({
        data: [{ id: 1, name: 'Expert A' }, { id: 2, name: 'Expert B' }],
        error: null,
      }),
    })),
  },
}));

describe('useExperts', () => {
  it('debe retornar la lista de expertos', async () => {
    const { result, waitForNextUpdate } = renderHook(() => useExperts());

    await waitForNextUpdate();

    expect(result.current.experts).toHaveLength(2);
    expect(result.current.experts[0].name).toBe('Expert A');
  });
});
