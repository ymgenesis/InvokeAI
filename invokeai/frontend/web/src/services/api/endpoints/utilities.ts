import { api } from '..';
import { components } from '../schema';

export const utilitiesApi = api.injectEndpoints({
  endpoints: (build) => ({
    dynamicPrompts: build.query<
      components['schemas']['DynamicPromptsResponse'],
      { prompt: string; max_prompts: number }
    >({
      query: (arg) => ({
        url: 'utilities/dynamicprompts',
        body: arg,
        method: 'POST',
      }),
      keepUnusedDataFor: 86400, // 24 hours
    }),
  }),
});

export const { useDynamicPromptsQuery } = utilitiesApi;
