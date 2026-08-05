import { Injectable, Logger } from '@nestjs/common';
import OpenAI from 'openai';

export interface AssessmentPromptInput {
  claimText: string;
  evidenceText: string;
  sampleSize?: number;
}

export interface AssessmentResult {
  justified: 'JUSTIFIED' | 'PARTIAL' | 'NOT_JUSTIFIED';
  confidenceScore: number;
  reasoning: string;
}

@Injectable()
export class OpenAIService {
  private readonly logger = new Logger(OpenAIService.name);
  private client: OpenAI | null = null;

  constructor() {
    const apiKey = process.env.OPENAI_API_KEY;
    if (apiKey) {
      this.client = new OpenAI({ apiKey });
    } else {
      this.logger.warn(
        'OPENAI_API_KEY not set — using mock assessment logic so the app still runs end-to-end for a demo.',
      );
    }
  }

  async assessClaim(input: AssessmentPromptInput): Promise<AssessmentResult> {
    if (!this.client) {
      return this.mockAssess(input);
    }

    const systemPrompt = `You evaluate whether clinical/consumer study evidence supports a
cosmetic product claim. Compare magnitude, timeframe, and sample size between the claim
and the evidence. Use "PARTIAL" when the direction matches but magnitude clearly falls
short, or evidence is weak (e.g. very small sample size). Respond ONLY as strict JSON,
no markdown, no prose outside the JSON:
{"justified": "JUSTIFIED" | "PARTIAL" | "NOT_JUSTIFIED", "confidenceScore": <0-100 integer>, "reasoning": "<2-3 sentences>"}`;

    const userPrompt = `Claim: "${input.claimText}"
Evidence: "${input.evidenceText}"
Sample size: ${input.sampleSize ?? 'not provided'}`;

    const completion = await this.client.chat.completions.create({
      model: 'gpt-4o-mini',
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
    });

    const raw = completion.choices[0]?.message?.content ?? '{}';
    return this.validateShape(JSON.parse(raw));
  }

  /** Never trust the LLM's output shape blindly — validate before it touches the DB. */
  private validateShape(parsed: any): AssessmentResult {
    const allowed = ['JUSTIFIED', 'PARTIAL', 'NOT_JUSTIFIED'];
    const justified = allowed.includes(parsed.justified) ? parsed.justified : 'NOT_JUSTIFIED';
    const confidenceScore = Number.isFinite(parsed.confidenceScore)
      ? Math.max(0, Math.min(100, Math.round(parsed.confidenceScore)))
      : 0;
    const reasoning = typeof parsed.reasoning === 'string' ? parsed.reasoning : 'No reasoning returned.';
    return { justified, confidenceScore, reasoning };
  }

  /** Deterministic mock used only when no API key is configured — lets the whole
   * pipeline (DB writes, UI rendering) be demoed without needing a live OpenAI key. */
  private mockAssess(input: AssessmentPromptInput): AssessmentResult {
    const claimNumberMatch = input.claimText.match(/(\d+)\s?%/);
    const evidenceNumberMatch = input.evidenceText.match(/(\d+)\s?%/);
    const claimPct = claimNumberMatch ? parseInt(claimNumberMatch[1], 10) : null;
    const evidencePct = evidenceNumberMatch ? parseInt(evidenceNumberMatch[1], 10) : null;

    if (claimPct !== null && evidencePct !== null) {
      const gap = claimPct - evidencePct;
      if (gap <= 0) {
        return {
          justified: 'JUSTIFIED',
          confidenceScore: 85,
          reasoning: `[MOCK] Evidence reports ${evidencePct}%, meeting or exceeding the claimed ${claimPct}%.`,
        };
      }
      if (gap <= 8) {
        return {
          justified: 'PARTIAL',
          confidenceScore: 55,
          reasoning: `[MOCK] Evidence reports ${evidencePct}% against a claimed ${claimPct}% — directionally supportive but short of the stated magnitude.`,
        };
      }
      return {
        justified: 'NOT_JUSTIFIED',
        confidenceScore: 30,
        reasoning: `[MOCK] Evidence reports ${evidencePct}%, well short of the claimed ${claimPct}%.`,
      };
    }

    return {
      justified: 'PARTIAL',
      confidenceScore: 40,
      reasoning: '[MOCK] Could not extract comparable figures from claim/evidence text — set OPENAI_API_KEY for real assessment.',
    };
  }
}
