export const MAX_PROMPT_LENGTH = 500;

export interface PromptLengthResult {
  valid: boolean;
  length: number;
  max: number;
}

export function validatePromptLength(prompt: string): PromptLengthResult {
  const length = prompt.length;
  return { valid: length <= MAX_PROMPT_LENGTH, length, max: MAX_PROMPT_LENGTH };
}
