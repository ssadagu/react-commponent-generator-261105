import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { usePersistentState } from './usePersistentState';

describe('usePersistentState', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it('저장된 값이 없으면 초기값을 사용한다', () => {
    const { result } = renderHook(() => usePersistentState('k', 'init'));
    expect(result.current[0]).toBe('init');
  });

  it('저장된 값이 있으면 복원한다', () => {
    localStorage.setItem('k', JSON.stringify('saved'));
    const { result } = renderHook(() => usePersistentState('k', 'init'));
    expect(result.current[0]).toBe('saved');
  });

  it('값을 바꾸면 localStorage에 JSON으로 저장한다', () => {
    const { result } = renderHook(() => usePersistentState('k', 'init'));
    act(() => result.current[1]('next'));
    expect(result.current[0]).toBe('next');
    expect(localStorage.getItem('k')).toBe(JSON.stringify('next'));
  });

  it('저장된 JSON이 손상되었으면 초기값을 사용한다', () => {
    localStorage.setItem('k', '{broken');
    const { result } = renderHook(() => usePersistentState('k', 'init'));
    expect(result.current[0]).toBe('init');
  });

  it('revive가 undefined를 반환하면(검증 실패) 초기값을 사용한다', () => {
    localStorage.setItem('k', JSON.stringify('nope'));
    const { result } = renderHook(() =>
      usePersistentState<'a' | 'b'>('k', 'a', (raw) =>
        raw === 'a' || raw === 'b' ? raw : undefined,
      ),
    );
    expect(result.current[0]).toBe('a');
  });

  it('localStorage 쓰기가 실패해도 상태는 정상 동작한다', () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('quota');
    });
    const { result } = renderHook(() => usePersistentState('k', 'init'));
    act(() => result.current[1]('next'));
    expect(result.current[0]).toBe('next');
  });
});
