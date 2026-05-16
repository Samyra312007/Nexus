import * as dotenv from 'dotenv';

dotenv.config();

interface AuditPayload {
  jobId: bigint;
  originalSpec: string;
  submittedResult: string;
}

interface QualityRubric {
  accuracyWeight: number;
  completenessWeight: number;
  formatComplianceWeight: number;
}

const DEFAULT_RUBRIC: QualityRubric = {
  accuracyWeight: 0.5,
  completenessWeight: 0.3,
  formatComplianceWeight: 0.2,
};

export class NexusAuditorAgent {
  private llmProvider: string;
  private llmModel: string;

  constructor(llmProvider: string = 'ollama', llmModel: string = 'llama3.2') {
    this.llmProvider = llmProvider;
    this.llmModel = llmModel;
  }

  async evaluate(payload: AuditPayload, rubric: QualityRubric = DEFAULT_RUBRIC): Promise<number> {
    const { originalSpec, submittedResult } = payload;

    const score = await this.runLLMInference(originalSpec, submittedResult);

    const adjustedScore = this.applyRubric(score, rubric);
    const finalScore = Math.max(0, Math.min(100, Math.round(adjustedScore)));

    console.log(`[AuditorAgent] Score: ${finalScore}/100`);
    return finalScore;
  }

  private async runLLMInference(spec: string, result: string): Promise<number> {
    const prompt = this.buildPrompt(spec, result);

    if (this.llmProvider === 'ollama') {
      return this.queryOllama(prompt);
    } else if (this.llmProvider === 'deepseek') {
      return this.queryDeepSeek(prompt);
    }

    // Fallback: deterministic scoring based on result structure
    return this.deterministicScore(spec, result);
  }

  private buildPrompt(spec: string, result: string): string {
    return `You are an autonomous quality auditor for an agent marketplace.
Original Task Specification: ${spec}
Submitted Result: ${result}
Score the result from 0-100 based on: accuracy, completeness, format compliance.
Return ONLY the numeric score.`;
  }

  private async queryOllama(prompt: string): Promise<number> {
    try {
      const response = await fetch(process.env.OLLAMA_URL || 'http://localhost:11434/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: this.llmModel,
          prompt,
          stream: false,
        }),
      });

      const data = await response.json();
      const score = parseInt(data.response?.trim() || '50', 10);
      return isNaN(score) ? 50 : score;
    } catch {
      console.warn('[AuditorAgent] Ollama unavailable, using fallback scoring');
      return 50;
    }
  }

  private async queryDeepSeek(prompt: string): Promise<number> {
    try {
      const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.DEEPSEEK_API_KEY || ''}`,
        },
        body: JSON.stringify({
          model: 'deepseek-chat',
          messages: [{ role: 'user', content: prompt }],
        }),
      });

      const data = await response.json();
      const content = data.choices?.[0]?.message?.content || '50';
      const score = parseInt(content.trim(), 10);
      return isNaN(score) ? 50 : score;
    } catch {
      console.warn('[AuditorAgent] DeepSeek unavailable, using fallback scoring');
      return 50;
    }
  }

  private deterministicScore(spec: string, result: string): number {
    let score = 50;

    // Check if result contains valid JSON
    try {
      JSON.parse(result);
      score += 20;
    } catch {
      score -= 10;
    }

    // Check result length relative to spec
    if (result.length > spec.length * 0.5) score += 10;
    else score -= 5;

    // Check for common required fields
    const requiredFields = ['result', 'confidence', 'data', 'status'];
    const matchedFields = requiredFields.filter((f) => result.includes(f));
    score += matchedFields.length * 5;

    return Math.max(0, Math.min(100, score));
  }

  private applyRubric(score: number, rubric: QualityRubric): number {
    return score;
  }

  static async verifyMultiple(payloads: AuditPayload[], threshold: number = 75): Promise<{ score: number; passed: boolean }[]> {
    const agent = new NexusAuditorAgent();
    const results: { score: number; passed: boolean }[] = [];

    for (const payload of payloads) {
      const score = await agent.evaluate(payload);
      results.push({ score, passed: score >= threshold });
    }

    return results;
  }
}
