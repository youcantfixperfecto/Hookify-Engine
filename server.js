const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Standardized 7-Criterion Schema (Each 1 to 10)
const CRITERIA_PROPERTIES = {
  attention: {
    type: "OBJECT",
    properties: {
      score: { type: "INTEGER", description: "Integer from 1 to 10" },
      explanation: { type: "STRING", description: "Plain-language diagnosis" },
      improvement: { type: "STRING", description: "Concrete, actionable recommendation" }
    },
    required: ["score", "explanation", "improvement"]
  },
  relevance: {
    type: "OBJECT",
    properties: {
      score: { type: "INTEGER", description: "Integer from 1 to 10" },
      explanation: { type: "STRING" },
      improvement: { type: "STRING" }
    },
    required: ["score", "explanation", "improvement"]
  },
  curiosity: {
    type: "OBJECT",
    properties: {
      score: { type: "INTEGER", description: "Integer from 1 to 10" },
      explanation: { type: "STRING" },
      improvement: { type: "STRING" }
    },
    required: ["score", "explanation", "improvement"]
  },
  clarity: {
    type: "OBJECT",
    properties: {
      score: { type: "INTEGER", description: "Integer from 1 to 10" },
      explanation: { type: "STRING" },
      improvement: { type: "STRING" }
    },
    required: ["score", "explanation", "improvement"]
  },
  credibility: {
    type: "OBJECT",
    properties: {
      score: { type: "INTEGER", description: "Integer from 1 to 10" },
      explanation: { type: "STRING" },
      improvement: { type: "STRING" }
    },
    required: ["score", "explanation", "improvement"]
  },
  payoff: {
    type: "OBJECT",
    properties: {
      score: { type: "INTEGER", description: "Integer from 1 to 10" },
      explanation: { type: "STRING" },
      improvement: { type: "STRING" }
    },
    required: ["score", "explanation", "improvement"]
  },
  goalFit: {
    type: "OBJECT",
    properties: {
      score: { type: "INTEGER", description: "Integer from 1 to 10" },
      explanation: { type: "STRING" },
      improvement: { type: "STRING" }
    },
    required: ["score", "explanation", "improvement"]
  }
};

const ANALYSIS_SCHEMA = {
  type: "OBJECT",
  properties: {
    contextAndAssumptions: { type: "STRING" },
    detectedTechniques: {
      type: "ARRAY",
      items: {
        type: "OBJECT",
        properties: {
          techniqueName: { type: "STRING" },
          exactQuote: { type: "STRING" },
          effectiveness: { type: "STRING" }
        },
        required: ["techniqueName", "exactQuote", "effectiveness"]
      }
    },
    criteriaScores: {
      type: "OBJECT",
      properties: CRITERIA_PROPERTIES,
      required: ["attention", "relevance", "curiosity", "clarity", "credibility", "payoff", "goalFit"]
    },
    mainStrength: { type: "STRING" },
    biggestWeakness: { type: "STRING" },
    prioritizedImprovements: {
      type: "ARRAY",
      items: { type: "STRING" },
      description: "Top 3 highest-impact improvements"
    },
    factualClaimsNeedingVerification: {
      type: "ARRAY",
      items: { type: "STRING" }
    },
    rewrittenAlternatives: {
      type: "ARRAY",
      items: {
        type: "OBJECT",
        properties: {
          hook: { type: "STRING" },
          approachAngle: { type: "STRING" },
          whyBetterForGoal: { type: "STRING" },
          whatChanged: { type: "STRING" }
        },
        required: ["hook", "approachAngle", "whyBetterForGoal", "whatChanged"]
      }
    }
  },
  required: [
    "contextAndAssumptions",
    "detectedTechniques",
    "criteriaScores",
    "mainStrength",
    "biggestWeakness",
    "prioritizedImprovements",
    "factualClaimsNeedingVerification",
    "rewrittenAlternatives"
  ]
};

const GENERATION_SCHEMA = {
  type: "OBJECT",
  properties: {
    contextAndAssumptions: { type: "STRING" },
    factualGuardrails: { type: "ARRAY", items: { type: "STRING" } },
    generatedHooks: {
      type: "ARRAY",
      items: {
        type: "OBJECT",
        properties: {
          hook: { type: "STRING" },
          approachDescription: { type: "STRING", description: "One simple sentence explaining the angle" },
          criteriaScores: {
            type: "OBJECT",
            properties: CRITERIA_PROPERTIES,
            required: ["attention", "relevance", "curiosity", "clarity", "credibility", "payoff", "goalFit"]
          },
          mainStrength: { type: "STRING" },
          mainWeakness: { type: "STRING" }
        },
        required: ["hook", "approachDescription", "criteriaScores", "mainStrength", "mainWeakness"]
      }
    }
  },
  required: ["contextAndAssumptions", "factualGuardrails", "generatedHooks"]
};

const RUBRIC_SYSTEM_PROMPT = `You are Hookify Engine v0.2, an expert marketing hook evaluation and generation engine.
You analyze hooks with objective direct-response rigor and clear, human-accessible language.

CRITICAL SCORING RULES:
1. Every score MUST be an integer between 1 and 10:
   - 1-3: Weak (A critical issue renders this dimension ineffective)
   - 4-6: Average (Demonstrates potential, but notable flaws compromise impact)
   - 7-8: Strong (Effective, punchy, well-crafted, minor polish possible)
   - 9-10: Excellent (Exceptional benchmark execution; 10 must be rare and justified)
2. NEVER use or mention a 0-14 scale. All individual criteria are evaluated out of 10.
3. Apply the EXACT same scoring standards to both submitted hooks and generated hooks. Never inflate scores.

ANCHOR DEFINITIONS FOR CONSISTENT SCORING:
- ATTENTION:
  * 2: Passive opening, cliché filler ("Hey guys", "In today's video"), easily scrolled past.
  * 5: Recognizable topic, but lacks an interrupt, tension, or distinctive visual/verbal punch.
  * 8: Sharp pattern interrupt, evocative scenario, or compelling tension in the first 3 seconds.
  * 10: Flawless scroll-stopper; impossible for the target audience to ignore without being clickbait.
- RELEVANCE:
  * 2: Speaks to nobody in particular or targets completely irrelevant trivia.
  * 5: Broad niche appeal, but lacks acute connection to a specific, urgent pain point or desire.
  * 8: Directly addresses a known, top-of-mind frustration or aspiration of the defined audience.
  * 10: Feels bespoke—the intended viewer instantly feels personally understood.
- CURIOSITY:
  * 2: Fully resolves immediately, gives away the punchline, or triggers zero desire to know more.
  * 5: Creates mild interest, but the question is predictable or standard.
  * 8: Opens a compelling information loop or unexpected contrast without being confusing.
  * 10: Creates an irresistible cognitive itch that demands watching the next 15 seconds to resolve.
- CLARITY:
  * 2: Convoluted sentence structure, confusing syntax, or high cognitive friction in 2 seconds.
  * 5: Understandable on a second read, but slightly verbose or contains throat-clearing words.
  * 8: Crisp, conversational, plain-language message delivered with immediate cognitive ease.
  * 10: Flawless economy of language; not a single wasted syllable or ambiguous word.
- CREDIBILITY:
  * 2: Outlandish promises, fake urgency, suspicious testimonials, or spammy claims ("Make $10K today!").
  * 5: Plausible, but relies on unsupported superlatives ("the best", "game changer") without grounding.
  * 8: Natural, realistic tone; avoids false hype; frames claims with honest boundaries.
  * 10: Instantly authoritative, transparent, and authentic; grounded in demonstrable reality.
- PAYOFF:
  * 2: Content appears self-serving, promotional, or offers zero clear benefit to the viewer.
  * 5: General promise of value, but unclear whether the video will deliver practical payoff.
  * 8: Clear implicit or explicit promise of valuable insight, tactical benefit, or entertainment.
  * 10: Massive perceived return on the viewer's time investment clearly signaled up front.
- GOAL FIT:
  * 2: Entirely misaligned (e.g., trying to close a high-ticket sale when the goal is broad retention).
  * 5: Loosely supports the objective, but secondary elements dilute the primary intent.
  * 8: Calibrated directly to the user's objective (retention, clicks, leads, sales, education, etc.).
  * 10: Optimal structural match designed specifically to trigger the requested viewer action.

ETHICAL MARKETING & TRUTHFULNESS:
- Never invent customer results, testimonials, scientific consensus, or false endorsements.
- Flag unverified claims explicitly in 'factualClaimsNeedingVerification'.
- Keep structural quality separate from guaranteed audience performance.`;

// Helper: Dynamic Model Discovery
async function discoverModels(apiKey) {
  try {
    const listRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
    if (!listRes.ok) return [];
    const listData = await listRes.json();
    const models = (listData.models || [])
      .filter(m => m.supportedGenerationMethods && m.supportedGenerationMethods.includes('generateContent'))
      .map(m => m.name.replace(/^models\//, ''));

    models.sort((a, b) => {
      const score = (name) => {
        if (name.includes('flash-lite')) return 100;
        if (name.includes('flash')) return 90;
        return 10;
      };
      return score(b) - score(a);
    });
    return models;
  } catch (err) {
    return [];
  }
}

// Helper: Gemini API Caller with Fallback
async function callGemini(apiKey, promptText, schema) {
  let models = await discoverModels(apiKey);
  if (models.length === 0) {
    models = ['gemini-2.5-flash', 'gemini-2.0-flash', 'gemini-1.5-flash'];
  }

  const payload = {
    contents: [{ role: "user", parts: [{ text: `${RUBRIC_SYSTEM_PROMPT}\n\n${promptText}` }] }],
    generationConfig: {
      responseMimeType: "application/json",
      responseSchema: schema,
      temperature: 0.2
    }
  };

  let lastError = null;
  for (const model of models) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        lastError = `[${model}] ${await res.text()}`;
        continue;
      }

      const data = await res.json();
      const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!rawText) continue;

      return JSON.parse(rawText);
    } catch (e) {
      lastError = e.message;
    }
  }
  throw new Error(`AI generation failed: ${lastError}`);
}

// Compute arithmetic mean rounded to 1 decimal place
function computeOverallScore(criteriaScores) {
  const keys = ['attention', 'relevance', 'curiosity', 'clarity', 'credibility', 'payoff', 'goalFit'];
  let sum = 0;
  for (const k of keys) {
    let val = criteriaScores[k]?.score;
    if (typeof val !== 'number' || val < 1 || val > 10) val = 5;
    criteriaScores[k].score = Math.round(val);
    sum += criteriaScores[k].score;
  }
  return Number((sum / 7).toFixed(1));
}

// 1. Analyze Existing Hook Endpoint
app.post('/api/analyze', async (req, res) => {
  const { hook, product, audience, objective, platform, tone, facts, avoid } = req.body;

  if (!hook || typeof hook !== 'string' || !hook.trim()) {
    return res.status(400).json({ error: "The hook text is required." });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: "GEMINI_API_KEY is not configured on the server." });
  }

  const userPrompt = `TASK: ANALYZE AND IMPROVE SUBMITTED HOOK
HOOK: "${hook.trim()}"
CONTEXT:
- Product/Subject: "${product ? product.trim() : 'General / Unspecified'}"
- Target Audience: "${audience ? audience.trim() : 'General social media audience'}"
- Stated Objective: "${objective || 'Retention / Watch Time'}"
- Platform: "${platform ? platform.trim() : 'Short-form video'}"
- Desired Tone: "${tone ? tone.trim() : 'Direct, authentic'}"
- Verified Facts/Evidence: "${facts ? facts.trim() : 'None provided'}"
- Topics/Claims to Avoid: "${avoid ? avoid.trim() : 'None specified'}"

Analyze the hook's mechanics, score the seven criteria against their anchor rubrics (1-10), calculate the biggest weakness, top 3 prioritized fixes, and craft 3 distinct rewritten alternatives tailored to the goal.`;

  try {
    const analysis = await callGemini(apiKey, userPrompt, ANALYSIS_SCHEMA);
    analysis.overallScore = computeOverallScore(analysis.criteriaScores);
    res.json(analysis);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 2. Generate Original Hooks Endpoint
app.post('/api/generate', async (req, res) => {
  const { product, audience, objective, platform, tone, facts, avoid } = req.body;

  if (!product || typeof product !== 'string' || !product.trim()) {
    return res.status(400).json({ error: "Product, topic, or content description is required." });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: "GEMINI_API_KEY is not configured on the server." });
  }

  const userPrompt = `TASK: GENERATE ORIGINAL MARKETING HOOKS FROM SCRATCH
CONTEXT:
- Product/Subject: "${product.trim()}"
- Target Audience: "${audience ? audience.trim() : 'Prospective audience/customers'}"
- Primary Objective: "${objective || 'Retention / Watch Time'}"
- Platform: "${platform ? platform.trim() : 'Short-form video'}"
- Preferred Tone: "${tone ? tone.trim() : 'Authentic, punchy, conversational'}"
- Verified Facts/Evidence/Differentiators: "${facts ? facts.trim() : 'None'}"
- Topics/Claims to Avoid: "${avoid ? avoid.trim() : 'No false urgency, no unverified stats'}"

Generate 4 genuinely distinct hooks exploring distinct angles (e.g., Pattern Interrupt, Visceral Pain Point, Contrarian Claim, Curiosity Loop).
Evaluate each generated hook against the EXACT same 7 criteria (1-10) using the rubric. Do not inflate scores.`;

  try {
    const generation = await callGemini(apiKey, userPrompt, GENERATION_SCHEMA);
    if (generation.generatedHooks && Array.isArray(generation.generatedHooks)) {
      generation.generatedHooks.forEach(item => {
        item.overallScore = computeOverallScore(item.criteriaScores);
      });
    }
    res.json(generation);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`Hookify Engine v0.2 running on port ${PORT}`);
});
