import { useState, useEffect, useCallback } from 'react';
import {
  BackgroundTarget,
  BackgroundConfig,
  getBackgroundConfig,
  saveBackgroundConfig,
  resetBackgroundConfig,
  getBackgroundInlineStyles,
} from '../services/customBackgroundService';

export function useCustomBackground(target: BackgroundTarget) {
  const [config, setConfig] = useState<BackgroundConfig | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadConfig = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await getBackgroundConfig(target);
      setConfig(data);
    } catch {
      setConfig(null);
    } finally {
      setIsLoading(false);
    }
  }, [target]);

  useEffect(() => {
    loadConfig();

    const handleChanged = (e: Event) => {
      const customEvent = e as CustomEvent<{ target: BackgroundTarget; config: BackgroundConfig | null }>;
      if (customEvent.detail?.target === target) {
        setConfig(customEvent.detail.config ?? null);
      }
    };

    window.addEventListener('titik-background-changed', handleChanged);
    return () => window.removeEventListener('titik-background-changed', handleChanged);
  }, [target, loadConfig]);

  const save = useCallback(
    async (newConfig: BackgroundConfig) => {
      await saveBackgroundConfig(newConfig);
      setConfig(newConfig);
    },
    []
  );

  const reset = useCallback(async () => {
    await resetBackgroundConfig(target);
    setConfig(null);
  }, [target]);

  const inlineStyle = getBackgroundInlineStyles(config);

  return {
    config,
    isLoading,
    inlineStyle,
    save,
    reset,
    refresh: loadConfig,
  };
}
