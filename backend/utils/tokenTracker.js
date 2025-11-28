/**
 * Token usage tracker for LLM calls
 */
export class TokenTracker {
  constructor() {
    this.totalTokens = 0;
    this.inputTokens = 0;
    this.outputTokens = 0;
  }

  /**
   * Add token usage from a single LLM call
   * Handles different token usage formats from LangChain/OpenAI
   */
  addUsage(usage) {
    if (usage) {
      // Handle different formats
      const input = usage.promptTokens || 
                    usage.inputTokens || 
                    usage.prompt_tokens || 
                    (usage.prompt && typeof usage.prompt === 'number' ? usage.prompt : 0) ||
                    0;
      
      const output = usage.completionTokens || 
                     usage.outputTokens || 
                     usage.completion_tokens ||
                     (usage.completion && typeof usage.completion === 'number' ? usage.completion : 0) ||
                     0;
      
      const total = usage.totalTokens || 
                    usage.total_tokens || 
                    (input + output);

      this.inputTokens += input;
      this.outputTokens += output;
      this.totalTokens += total;
    }
  }

  /**
   * Get current token usage summary
   */
  getUsage() {
    return {
      total_tokens: this.totalTokens,
      input_tokens: this.inputTokens,
      output_tokens: this.outputTokens
    };
  }

  /**
   * Reset tracker
   */
  reset() {
    this.totalTokens = 0;
    this.inputTokens = 0;
    this.outputTokens = 0;
  }
}

