const Anthropic = require("@anthropic-ai/sdk");

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Content-Type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const SYSTEM_PROMPT = `You are an expert educational designer specialising in Diana Laurillard's Conversational Framework (CF) from "Teaching as a Design Science" (2012).

The six CF learning types are:
- Acquisition: learner engages with teacher's account (reading, watching, listening)
- Inquiry: learner investigates, compares, analyses resources or data
- Practice: learner applies knowledge and receives adaptive feedback
- Production: learner creates artefacts demonstrating understanding
- Discussion: learner dialogues with teacher/peers to test and refine concepts
- Collaboration: learner works with peers to build shared understanding

Key CF principles to reference in rationales:
- Teacher concept ↔ learner concept cycles
- Modulating and generating learner concepts
- Adaptive feedback loops (teacher-to-learner and peer-to-peer)
- Teacher communication, modelling, and practice cycles
- Iterative refinement through action and reflection

Digital tools available: Mentimeter, Padlet, Google Docs, Google Forms, Oxford Learner's Dictionary, COCA Corpus, Hypothesis, Flip, Miro, Quizlet, Poll Everywhere, Perusall, VoiceThread, Nearpod, Kahoot, Wakelet, Notion, Canva, Book Creator, Microsoft Forms, Socrative, Wooclap.

Return ONLY valid JSON with no markdown fences, no preamble, no trailing text. Strict schema:

{
  "summary": "string (2-3 sentences pedagogic summary of how CF applies to this lesson)",
  "cf_mapping": [
    { "type": "string (CF type name)", "relevance": "string (1-2 sentences on its role in this lesson)", "priority": "primary or secondary" }
  ],
  "tasks": [
    {
      "title": "string",
      "duration": "string (e.g. '15 min')",
      "cf_types": ["array of CF type names"],
      "description": "string (what teacher does + what students do, 2-3 sentences)",
      "digital_tool": "string (tool name)",
      "tool_url": "string (full URL to the tool)",
      "tool_rationale": "string (2-3 sentences connecting tool and task to specific CF principles)",
      "cf_principles": ["array of short principle labels e.g. 'adaptive feedback', 'peer concept cycle']"
    }
  ],
  "design_tips": "string (2-3 sentences practical advice tailored to this teacher's context)"
}

Include 3-5 tasks. Include all relevant CF types in cf_mapping (mark 2-3 as primary, rest as secondary). Ensure cf_principles are short, lowercase labels.`;

exports.handler = async (event) => {
  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 204, headers: CORS_HEADERS, body: "" };
  }

  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      headers: CORS_HEADERS,
      body: JSON.stringify({ error: "Method not allowed" }),
    };
  }

  let body;
  try {
    body = JSON.parse(event.body);
  } catch {
    return {
      statusCode: 400,
      headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
      body: JSON.stringify({ error: "Invalid JSON in request body" }),
    };
  }

  const { lesson, subject, level, mode, size, resourceUrl } = body;

  if (!lesson) {
    return {
      statusCode: 400,
      headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
      body: JSON.stringify({ error: "Lesson description is required" }),
    };
  }

  const userMessage = `Please design a lesson plan using the Conversational Framework for the following:

Lesson description / learning outcome: ${lesson}
Subject / discipline: ${subject || "Not specified"}
Level: ${level || "Not specified"}
Delivery mode: ${mode || "Not specified"}
Class size: ${size || "Not specified"}${resourceUrl ? `\nResource URL: ${resourceUrl}` : ""}

Generate a CF-aligned lesson design with 3-5 activities, drawing on the digital tools listed. Tailor everything to the specific level, mode, and class size provided.`;

  try {
    const client = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
      timeout: 25000,
    });

    const message = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 2000,
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: userMessage }],
    });

    const rawText = message.content[0].text;

    // Extract the first {...} JSON block
    const jsonMatch = rawText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("No JSON object found in API response");
    }

    const parsed = JSON.parse(jsonMatch[0]);

    return {
      statusCode: 200,
      headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
      body: JSON.stringify(parsed),
    };
  } catch (err) {
    console.error("API error:", err);
    return {
      statusCode: 502,
      headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
      body: JSON.stringify({
        error: err.message || "Failed to generate lesson plan",
      }),
    };
  }
};
