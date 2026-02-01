import { ref, readonly, provide, inject, type InjectionKey, type Ref } from 'vue';
import type { PageContext } from '@/services/aiChatService';

/**
 * Injection key for AI context.
 */
const AI_CONTEXT_KEY: InjectionKey<{
  context: Ref<PageContext>;
  setContext: (ctx: PageContext) => void;
  clearContext: () => void;
}> = Symbol('ai-context');

/**
 * Creates the AI context provider.
 * Should be called once at the app root level.
 */
export function createAIContext() {
  const context = ref<PageContext>({});

  const setContext = (ctx: PageContext) => {
    context.value = { ...ctx };
  };

  const clearContext = () => {
    context.value = {};
  };

  provide(AI_CONTEXT_KEY, {
    context: readonly(context) as Ref<PageContext>,
    setContext,
    clearContext,
  });

  return {
    context: readonly(context) as Ref<PageContext>,
    setContext,
    clearContext,
  };
}

/**
 * Uses the AI context in child components.
 * The context is used to provide page-specific information to the AI chat.
 */
export function useAIContext() {
  const injected = inject(AI_CONTEXT_KEY);

  if (!injected) {
    // Return a fallback for components that might be used outside the provider
    const context = ref<PageContext>({});
    return {
      context: readonly(context) as Ref<PageContext>,
      setContext: (ctx: PageContext) => { context.value = { ...ctx }; },
      clearContext: () => { context.value = {}; },
    };
  }

  return injected;
}

/**
 * Helper to set player page context.
 */
export function usePlayerContext(playerName: string, game?: string) {
  const { setContext } = useAIContext();

  setContext({
    pageType: 'player',
    playerName,
    game: game || 'bf1942',
  });
}

/**
 * Helper to set server page context.
 * @param serverGuid - API identifier for the server
 * @param serverName - Optional display name (shown in chat; avoids exposing GUID to users)
 */
export function useServerContext(serverGuid: string, serverName?: string, game?: string) {
  const { setContext } = useAIContext();

  setContext({
    pageType: 'server',
    serverGuid,
    serverName,
    game: game || 'bf1942',
  });
}
