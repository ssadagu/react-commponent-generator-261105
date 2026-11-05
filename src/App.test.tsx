import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from './App';

function mockFetch() {
  vi.stubGlobal(
    'fetch',
    vi.fn((url: string) => {
      if (url === '/api/config') {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ envKeys: { anthropic: false, google: false } }),
        });
      }
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ code: 'render(<div/>)' }),
      });
    }),
  );
}

describe('App 영속화', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.unstubAllGlobals();
    mockFetch();
  });

  it('저장된 Provider와 API 키를 복원한다', () => {
    localStorage.setItem('rcg:provider', JSON.stringify('anthropic'));
    localStorage.setItem('rcg:apiKey', JSON.stringify('sk-ant-saved'));
    render(<App />);

    expect(screen.getByLabelText('Provider')).toHaveValue('anthropic');
    expect(screen.getByLabelText('API Key')).toHaveValue('sk-ant-saved');
  });

  it('저장된 Provider 값이 유효하지 않으면 기본값(google)을 쓴다', () => {
    localStorage.setItem('rcg:provider', JSON.stringify('openai'));
    render(<App />);
    expect(screen.getByLabelText('Provider')).toHaveValue('google');
  });

  it('API 키와 Provider 변경이 저장소에 반영된다', async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.selectOptions(screen.getByLabelText('Provider'), 'anthropic');
    await user.type(screen.getByLabelText('API Key'), 'sk-1');

    expect(JSON.parse(localStorage.getItem('rcg:provider')!)).toBe('anthropic');
    expect(JSON.parse(localStorage.getItem('rcg:apiKey')!)).toBe('sk-1');
  });

  it('생성한 프롬프트가 히스토리에 저장되고, 중복은 맨 앞으로 올라간다', async () => {
    localStorage.setItem('rcg:apiKey', JSON.stringify('key'));
    localStorage.setItem('rcg:promptHistory', JSON.stringify(['예전 것', '카드']));
    const user = userEvent.setup();
    render(<App />);

    await user.type(screen.getByRole('textbox', { name: '' }), '카드');
    await user.click(screen.getByRole('button', { name: '컴포넌트 생성' }));

    await screen.findByText('생성된 컴포넌트');
    expect(JSON.parse(localStorage.getItem('rcg:promptHistory')!)).toEqual(['카드', '예전 것']);
  });
});
