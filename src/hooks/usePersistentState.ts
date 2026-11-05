import { useState, useEffect, type Dispatch, type SetStateAction } from 'react';

/**
 * localStorage와 동기화되는 상태.
 * revive: 저장된 원본(JSON.parse 결과)을 검증/변환한다. undefined를 반환하면 초기값을 쓴다.
 */
export function usePersistentState<T>(
  key: string,
  initial: T,
  revive?: (raw: unknown) => T | undefined,
): [T, Dispatch<SetStateAction<T>>] {
  const [value, setValue] = useState<T>(() => {
    try {
      const stored = localStorage.getItem(key);
      if (stored === null) return initial;
      const raw: unknown = JSON.parse(stored);
      if (!revive) return raw as T;
      return revive(raw) ?? initial;
    } catch {
      return initial;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {
      // 용량 초과/접근 차단 시에도 메모리 상태는 계속 동작한다.
    }
  }, [key, value]);

  return [value, setValue];
}
