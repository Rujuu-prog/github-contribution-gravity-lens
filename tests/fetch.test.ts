import { describe, it, expect, vi, beforeEach } from 'vitest';
import { fetchContributions } from '../src/fetch';

const mockGraphQLResponse = {
  data: {
    user: {
      contributionsCollection: {
        contributionCalendar: {
          weeks: [
            {
              contributionDays: [
                { date: '2024-01-01', contributionCount: 5, contributionLevel: 'SECOND_QUARTILE' },
                { date: '2024-01-02', contributionCount: 0, contributionLevel: 'NONE' },
                { date: '2024-01-03', contributionCount: 12, contributionLevel: 'FOURTH_QUARTILE' },
              ],
            },
            {
              contributionDays: [
                { date: '2024-01-08', contributionCount: 3, contributionLevel: 'FIRST_QUARTILE' },
              ],
            },
          ],
        },
      },
    },
  },
};

beforeEach(() => {
  vi.restoreAllMocks();
});

describe('fetchContributions', () => {
  it('GraphQLレスポンスを正しくパースする', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockGraphQLResponse),
    });
    vi.stubGlobal('fetch', mockFetch);

    const result = await fetchContributions('testuser', 'test-token');
    expect(result).toHaveLength(4);
    expect(result[0]).toEqual({ date: '2024-01-01', count: 5, level: 2 });
    expect(result[1]).toEqual({ date: '2024-01-02', count: 0, level: 0 });
    expect(result[2]).toEqual({ date: '2024-01-03', count: 12, level: 4 });
    expect(result[3]).toEqual({ date: '2024-01-08', count: 3, level: 1 });
  });

  it('APIエラー時に例外をスローする', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 401,
      statusText: 'Unauthorized',
    });
    vi.stubGlobal('fetch', mockFetch);

    await expect(fetchContributions('testuser', 'bad-token')).rejects.toThrow();
  });

  it('token未指定時にエラーをスローする', async () => {
    await expect(fetchContributions('testuser', '')).rejects.toThrow();
  });

  it('GraphQLエラーレスポンスで例外をスローする', async () => {
    const errorResponse = {
      errors: [{ message: 'User not found' }],
    };
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(errorResponse),
    });
    vi.stubGlobal('fetch', mockFetch);

    await expect(fetchContributions('nonexistent', 'token')).rejects.toThrow();
  });
});
