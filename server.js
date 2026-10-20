const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

const HOOK_ANALYSIS_SCHEMA = {
  type: "OBJECT",
  properties: {
    detectedMechanisms: {
      type: "ARRAY",
      items: {
        type: "OBJECT",
        properties: {
          mechanism: {
            type: "STRING",
            enum: [
              "Scenario or situation",
              "If–then framing",
              "Personal social proof",
              "Borrowed social proof",
              "Cost narration or price comparison",
              "Audience relatability",
              "Hypothetical recommendation"
            ]
          },
          explanation: { type: "STRING" },
          exactQuote: { type: "STRING" }
        },
        required: ["mechanism", "explanation", "exactQuote"]
      }
    },
    structuralScores: {
      type: "OBJECT",
      properties: {
        clarity: {
          type: "OBJECT",
          properties: {
            score: { type: "INTEGER" },
            explanation: { type: "STRING" },
            evidence: { type: "STRING" },
            improvement: { type: "STRING" }
          },
          required: ["score", "explanation", "evidence", "improvement"]
        },
        audienceRelevance: {
          type: "OBJECT",
          properties: {
            score: { type: "INTEGER" },
            explanation: { type: "STRING" },
            evidence: { type: "STRING" },
            improvement: { type: "STRING" }
          },
          required: ["score", "explanation", "evidence", "improvement"]
        },
        specificity: {
          type: "OBJECT",
          properties: {
            score: { type: "INTEGER" },
            explanation: { type: "STRING" },
            evidence: { type: "STRING" },
            improvement: { type: "STRING" }
          },
          required: ["score", "explanation", "evidence", "improvement"]
        },
        curiosity: {
          type: "OBJECT",
          properties: {
            score: { type: "INTEGER" },
            explanation: { type: "STRING" },
            evidence: { type: "STRING" },
            improvement: { type: "STRING" }
          },
          required: ["score", "explanation", "evidence", "improvement"]
        },
        credibility: {
          type: "OBJECT",
          properties: {
            score: { type: "INTEGER" },
            explanation: { type: "STRING" },
            evidence: { type: "STRING" },
            improvement: { type: "STRING" }
          },
          required: ["score", "explanation", "evidence", "improvement"]
        },
        productConnection: {
          type: "OBJECT",
          properties: {
            score: { type: "INTEGER" },
            explanation: { type: "STRING" },
            evidence: { type: "STRING" },
            improvement: { type: "STRING" }
          },
          required: ["score", "explanation", "evidence", "improvement"]
        },
        conciseness: {
          type: "OBJECT",
          properties: {
            score: { type: "INTEGER" },
            explanation: { type: "STRING" },
            evidence: { type: "STRING" },
            improvement: { type: "STRING" }
          },
          required: ["score", "explanation", "evidence", "improvement"]
        }
      },
      required: [
        "clarity",
        "audienceRelevance",
        "specificity",
        "curiosity",
        "credibility",
        "productConnection",
        "conciseness"
      ]
    },
    totalScore: { type: "INTEGER" },
    strongestAspects: { type: "ARRAY", items: { type: "STRING" } },
    weakestAspects: { type: "ARRAY", items: { type: "STRING" } },
    factualClaimsNeedingVerification: { type: "ARRAY", items: { type: "STRING" } },
    revisedHooks: {
      type: "ARRAY",
      items: {
        type: "OBJECT",
        properties: {
          hook: { type: "STRING" },
          whatChanged: { type: "STRING" },
          rationale: { type: "STRING" }
        },
        required: ["hook", "whatChanged", "rationale"]
      }
    }
  },
  required: [
    "detectedMechanisms",
    "structuralScores",
    "totalScore",
    "strongestAspects",
    "weakestAspects",
    "factualClaimsNeedingVerification",
    "revisedHooks"
  ]
};

// Candidate models in order of priority
const CANDIDATE_MODELS = [
  'gemini-2.5-flash',
  'gemini-2.0-flash',
  'gemini-2.5-flash-lite'
];

app.post('/api/analyze', async (req, res) => {
  const { hook, product, audience, objective } = req.body;

  if (!hook || typeof hook !== 'string' || !hook.trim()) {
    return res.status(400).json({ error: "The hook text is required." });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({
      error: "GEMINI_API_KEY is missing. Add it to your server environment variables."
    });
  }

  const systemPrompt = `You are Hookify Engine v0.1, an analytical AI specialized in evaluating marketing hooks for short-form videos.
Analyze the user's hook strictly:
1. DETECT THE 7 MECHANISMS:
- Scenario or situation
- If–then framing
- Personal social proof
- Borrowed social proof
- Cost narration or price comparison
- Audience relatability
- Hypothetical recommendation
Quote the exact wording from the hook as evidence for every mechanism found. If none are present, return an empty array.

2. STRUCTURAL SCORING (Score each 0 to 2 strictly):
- clarity, audienceRelevance, specificity, curiosity, credibility, productConnection, conciseness.
Total score must be the exact sum of all 7 criteria (0 to 14).
Flag unverified claims in 'factualClaimsNeedingVerification'.

3. THREE REVISED HOOKS:
Generate 3 distinct alternatives addressing weaknesses, respecting objective (${objective || 'attention'}), product (${product || 'unspecified'}), and audience (${audience || 'general'}).
Never invent fake customer results, discounts, or endorsements. Explain what changed and why.`;

  const userContent = `Hook: "${hook.trim()}"
Product/Niche: "${product ? product.trim() : 'Not specified'}"
Target Audience: "${audience ? audience.trim() : 'Not specified'}"
Target Objective: "${objective || 'attention'}"`;

  const apiPayload = {
    contents: [{ role: "user", parts: [{ text: `${systemPrompt}\n\n${userContent}` }] }],
    generationConfig: {
      responseMimeType: "application/json",
      responseSchema: HOOK_ANALYSIS_SCHEMA,
      temperature: 0.2
    }
  };

  let lastError = null;

  // Try candidate models in order to ensure compatibility with your API key
  for (const model of CANDIDATE_MODELS) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(apiPayload)
      });

      if (!response.ok) {
        const errText = await response.text();
        lastError = `Status ${response.status}: ${errText}`;
        continue; // Try next available model
      }

      const data = await response.json();
      const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!rawText) continue;

      const structuredResult = JSON.parse(rawText);
      const s = structuredResult.structuralScores;
      structuredResult.totalScore = (s.clarity?.score || 0) +
                                    (s.audienceRelevance?.score || 0) +
                                    (s.specificity?.score || 0) +
                                    (s.curiosity?.score || 0) +
                                    (s.credibility?.score || 0) +
                                    (s.productConnection?.score || 0) +
                                    (s.conciseness?.score || 0);

      return res.json(structuredResult);
    } catch (e) {
      lastError = e.message;
    }
  }

  res.status(502).json({ error: `Could not reach an available Gemini model. Details: ${lastError}` });
});

app.listen(PORT, () => {
  console.log(`Hookify Engine running on port ${PORT}`);
});
