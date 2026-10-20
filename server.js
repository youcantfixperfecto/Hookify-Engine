const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Schema Definition for Gemini Structured Output
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
