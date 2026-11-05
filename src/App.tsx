import { useState, useEffect } from 'react';
import { PromptInput } from './components/PromptInput';
import { WinTitle } from './components/WinTitle';
import { ComponentCard } from './components/ComponentCard';
import { useComponentGenerator } from './hooks/useComponentGenerator';
import { usePersistentState } from './hooks/usePersistentState';
import { addToHistory } from './utils/promptHistory';
import type { Provider } from './types';
import './App.css';

const PROVIDER_CONFIG = {
  anthropic: { label: 'Anthropic', placeholder: 'sk-ant-...' },
  google: { label: 'Google', placeholder: 'AIza...' },
} as const;

const reviveProvider = (raw: unknown): Provider | undefined =>
  typeof raw === 'string' && raw in PROVIDER_CONFIG ? (raw as Provider) : undefined;

const reviveHistory = (raw: unknown): string[] | undefined =>
  Array.isArray(raw) ? raw.filter((p): p is string => typeof p === 'string') : undefined;

const reviveString = (raw: unknown): string | undefined =>
  typeof raw === 'string' ? raw : undefined;

function App() {
  const [apiKey, setApiKey] = usePersistentState('rcg:apiKey', '', reviveString);
  const [showKey, setShowKey] = useState(false);
  const [provider, setProvider] = usePersistentState<Provider>('rcg:provider', 'google', reviveProvider);
  const [history, setHistory] = usePersistentState<string[]>('rcg:promptHistory', [], reviveHistory);
  const [envKeys, setEnvKeys] = useState<Record<Provider, boolean>>({
    anthropic: false,
    google: false,
  });
  const { components, isLoading, error, generate, removeComponent, clearAll } =
    useComponentGenerator();

  useEffect(() => {
    fetch('/api/config')
      .then((res) => res.json())
      .then((data) => setEnvKeys(data.envKeys))
      .catch(() => {});
  }, []);

  const hasEnvKey = envKeys[provider];

  const handleGenerate = (prompt: string) => {
    if (!apiKey.trim() && !hasEnvKey) {
      alert(`${PROVIDER_CONFIG[provider].label} API 키를 입력하거나 .env에 설정해주세요.`);
      return;
    }
    setHistory((prev) => addToHistory(prev, prompt));
    generate(prompt, apiKey || undefined, provider);
  };

  const handleProviderChange = (newProvider: Provider) => {
    setProvider(newProvider);
    setApiKey('');
  };

  const activeProvider = PROVIDER_CONFIG[provider].label;

  return (
    <div className="app">
      <header className="win app-header">
        <WinTitle title="React 컴포넌트 생성기" />
        <div className="win-body app-header-body">
          <div className="brand-mark" aria-hidden="true">RC</div>
          <div className="header-copy">
            <h1>프롬프트로 만드는 UI 워크벤치</h1>
            <p>요청을 입력하면 React 컴포넌트를 만들어 바로 미리보고, 코드까지 확인할 수 있어요.</p>
          </div>
          <dl className="header-meta" aria-label="현재 작업 상태">
            <div>
              <dt>Provider</dt>
              <dd>{activeProvider}</dd>
            </div>
            <div>
              <dt>컴포넌트</dt>
              <dd>{components.length}</dd>
            </div>
          </dl>
        </div>
      </header>

      <main className="workspace">
        <section className="win composer-panel" aria-label="컴포넌트 생성">
          <WinTitle title="새 컴포넌트" />
          <div className="win-body">
            <PromptInput onGenerate={handleGenerate} isLoading={isLoading} history={history} />
          </div>
        </section>

        <aside className="win settings-panel" aria-label="실행 설정">
          <WinTitle title="실행 설정" />
          <div className="win-body">
          <div className="provider-select">
            <label htmlFor="provider">Provider</label>
            <select
              id="provider"
              value={provider}
              onChange={(e) => handleProviderChange(e.target.value as Provider)}
            >
              {Object.entries(PROVIDER_CONFIG).map(([key, { label }]) => (
                <option key={key} value={key}>
                  {label}
                </option>
              ))}
            </select>
          </div>
          <div className="api-key-input">
            <label htmlFor="api-key">
              API Key
            </label>
            <div className="api-key-field">
              <input
                id="api-key"
                type={showKey ? 'text' : 'password'}
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder={
                  hasEnvKey
                    ? '서버 키 사용 중 (직접 입력으로 덮어쓰기 가능)'
                    : PROVIDER_CONFIG[provider].placeholder
                }
              />
              <button
                className="btn-toggle-key"
                onClick={() => setShowKey(!showKey)}
                type="button"
              >
                {showKey ? '숨기기' : '보기'}
              </button>
            </div>
            <p className={`key-status ${hasEnvKey ? 'key-status--ready' : ''}`}>
              {hasEnvKey ? '.env 키가 연결되어 있습니다.' : '직접 입력하거나 서버 환경변수를 설정하세요.'}
            </p>
          </div>
          </div>
        </aside>
      </main>

      {error && (
        <div className="error-banner" role="alert">
          <span className="error-icon" aria-hidden="true">!</span>
          <p>{error}</p>
        </div>
      )}

      <section className="results-section">
        {components.length > 0 && (
          <div className="results-header">
            <h2>생성된 컴포넌트</h2>
            <button className="btn-clear" onClick={clearAll}>
              전체 삭제
            </button>
          </div>
        )}

        {components.length === 0 && !isLoading && (
          <div className="win empty-state">
            <div className="empty-preview" aria-hidden="true">
              <div className="empty-window">
                <span />
                <span />
                <span />
              </div>
              <div className="empty-canvas">
                <div className="empty-card empty-card--primary" />
                <div className="empty-card" />
                <div className="empty-card empty-card--wide" />
              </div>
            </div>
            <div className="empty-copy">
              <h2>새 컴포넌트를 생성해보세요.</h2>
              <p>위 입력창에 만들고 싶은 UI를 적고 Ctrl/⌘ + Enter를 누르세요.</p>
            </div>
          </div>
        )}

        {isLoading && (
          <div className="win loading-card" role="status">
            <p>컴포넌트를 생성하고 있습니다...</p>
            <div className="loading-bar" aria-hidden="true"><span /></div>
          </div>
        )}

        <div className="results-grid">
          {components.map((component) => (
            <ComponentCard
              key={component.id}
              component={component}
              onRemove={removeComponent}
              onRegenerate={handleGenerate}
              isLoading={isLoading}
            />
          ))}
        </div>
      </section>
    </div>
  );
}

export default App;
