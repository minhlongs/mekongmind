/**
 * RequestClassifier — lightweight intent classifier for model routing.
 * Uses regex + keyword matching, runs in <1ms, no LLM call needed.
 */

export type Intent = 'planning' | 'reasoning' | 'coding' | 'debugging' | 'testing' | 'default';

const INTENT_PATTERNS: Array<{ intent: Intent; patterns: RegExp[] }> = [
  {
    intent: 'planning',
    patterns: [
      /plan|roadmap|architecture|design\s+(system|arch|pipeline|workflow)/i,
      /blueprint|strategy|sprint\s+plan|product\s+roadmap/i,
      /\b(?:break\s+down|outline|structure)\s+(the\s+)?(task|project|feature)/i,
    ],
  },
  {
    intent: 'reasoning',
    patterns: [
      /analyze|compare|evaluate|decide|recommend|assess/i,
      /\b(?:why|how|what\s+if)\s+(is|are|would|should)/i,
      /trade.?off|pros\s+and\s+cons|best\s+approach/i,
    ],
  },
  {
    intent: 'coding',
    patterns: [
      /implement|write\s+(code|function|class|api)|build|create\s+(a\s+)?(component|module|service)/i,
      /refactor|rewrite|migrate|convert/i,
      /\b(?:add|implement)\s+(the\s+)?(feature|endpoint|handler)/i,
    ],
  },
  {
    intent: 'debugging',
    patterns: [
      /fix\s*(bug|error|issue)|resolve|crash|throw|exception/i,
      /\b(?:why|what)\s+(is|causes)(\s+this)?\s+(error|bug)/i,
      /not\s+working|broken|fail(ed|ing|s)/i,
    ],
  },
  {
    intent: 'testing',
    patterns: [
      /\b(?:test|verify|validate|check)\s+(the|this|\w)/i,
      /unit\s+test|integration\s+test|e2e/i,
      /assert|expect|should\s+(pass|fail|work)/i,
    ],
  },
];

export class RequestClassifier {
   /** Classify a single message or full conversation as intent */
  classify(messages: Array<{ role: string; content?: string }>): Intent {
    const text = messages.map(m => m.content ?? '').join(' ');

    for (const { intent, patterns } of INTENT_PATTERNS) {
      if (patterns.some(p => p.test(text))) {
        return intent;
       }
     }

    // Default to coding model — faster throughput for unspecified requests
    return 'default';
   }

   /** Classify a raw string directly */
  classifyText(text: string): Intent {
    return this.classify([{ role: 'user', content: text }]);
   }
}

// Singleton instance
export const classifier = new RequestClassifier();
