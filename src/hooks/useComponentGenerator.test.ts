import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useComponentGenerator } from './useComponentGenerator';

const STORAGE_KEY = 'rcg:components';

const saved = [
  { id: 'a', prompt: '카드', code: 'render(<div/>)', createdAt: '2026-01-02T03:04:05.000Z' },
  { id: 'b', prompt: '표', code: 'render(<p/>)', createdAt: '2026-01-03T03:04:05.000Z' },
];

describe('useComponentGenerator 영속화', () => {
  beforeEach(() => localStorage.clear());

  it('저장된 컴포넌트 목록을 복원하고 createdAt을 Date로 되살린다', () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(saved));
    const { result } = renderHook(() => useComponentGenerator());

    expect(result.current.components).toHaveLength(2);
    expect(result.current.components[0].createdAt).toBeInstanceOf(Date);
    expect(result.current.components[0].createdAt.toISOString()).toBe(saved[0].createdAt);
  });

  it('형식이 잘못된 저장 데이터는 무시하고 빈 목록으로 시작한다', () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([{ id: 1 }]));
    const { result } = renderHook(() => useComponentGenerator());
    expect(result.current.components).toEqual([]);
  });

  it('컴포넌트를 삭제하면 저장소에도 반영된다', () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(saved));
    const { result } = renderHook(() => useComponentGenerator());

    act(() => result.current.removeComponent('a'));

    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY)!);
    expect(stored.map((c: { id: string }) => c.id)).toEqual(['b']);
  });

  it('전체 삭제하면 저장소도 비워진다', () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(saved));
    const { result } = renderHook(() => useComponentGenerator());

    act(() => result.current.clearAll());

    expect(JSON.parse(localStorage.getItem(STORAGE_KEY)!)).toEqual([]);
  });
});
