const clamp = (value, minimum = 0, maximum = 100) =>
  Math.min(maximum, Math.max(minimum, Math.round(value)));

const STOP_WORDS = new Set([
  "about", "after", "also", "and", "are", "because", "been", "being", "but", "can",
  "could", "does", "for", "from", "have", "into", "its", "more", "most", "that",
  "the", "their", "then", "there", "these", "they", "this", "through", "using", "was",
  "were", "what", "when", "where", "which", "while", "with", "would", "your",
]);

const tokenize = (value) =>
  [...new Set(
    String(value || "")
      .toLowerCase()
      .match(/[a-z0-9+#.-]{3,}/g) || []
  )].filter((word) => !STOP_WORDS.has(word));

const evaluateLocally = ({ question, answer }) => {
  const answerWords = String(answer).trim().split(/\s+/).filter(Boolean);
  const answerTokens = new Set(tokenize(answer));
  const rubricTokens = tokenize([
    question.question,
    question.skill,
    ...(question.expectedPoints || []),
  ].join(" "));
  const matchedTokens = rubricTokens.filter((token) => answerTokens.has(token));
  const relevanceRatio = rubricTokens.length ? matchedTokens.length / rubricTokens.length : 0;
  const sentenceCount = String(answer).split(/[.!?]+/).filter((item) => item.trim()).length;
  const hasExample = /\b(example|project|situation|task|action|result|implemented|developed|created|worked)\b/i.test(answer);
  const hasOutcome = /\b(result|improved|reduced|increased|completed|achieved|learned|outcome|impact|percent|%)\b/i.test(answer);
  const hasStructure = sentenceCount >= 3 || /\b(first|then|finally|because|therefore|however)\b/i.test(answer);
  const hasHedging = /\b(maybe|probably|i guess|not sure|perhaps)\b/i.test(answer);
  const depthScore = Math.min(answerWords.length / 100, 1);

  const correctness = clamp(35 + relevanceRatio * 45 + depthScore * 10 + (hasExample ? 10 : 0));
  const communication = clamp(42 + depthScore * 25 + (hasStructure ? 18 : 0) + (sentenceCount >= 2 ? 10 : 0));
  const confidence = clamp(55 + depthScore * 20 + (hasOutcome ? 15 : 0) - (hasHedging ? 15 : 0));
  const technicalAccuracy = question.type === "Technical"
    ? clamp(32 + relevanceRatio * 48 + depthScore * 10 + (hasExample ? 10 : 0))
    : clamp(55 + relevanceRatio * 25 + depthScore * 20);
  const overall = clamp(
    correctness * 0.35 + confidence * 0.2 + communication * 0.25 + technicalAccuracy * 0.2
  );

  const strengths = [];
  if (relevanceRatio >= 0.2) strengths.push("The answer addresses relevant ideas from the question.");
  if (hasExample) strengths.push("A practical example or experience supports the response.");
  if (hasStructure) strengths.push("The response has a clear and understandable structure.");
  if (hasOutcome) strengths.push("The answer explains an outcome, impact, or lesson.");
  if (!strengths.length) strengths.push("The response provides a starting point that can be developed further.");

  const weaknesses = [];
  const suggestions = [];
  if (answerWords.length < 45) {
    weaknesses.push("The answer is too brief to demonstrate the full reasoning.");
    suggestions.push("Expand the answer with context, specific actions, and a clear result.");
  }
  if (!hasExample) {
    weaknesses.push("The response does not include a concrete example.");
    suggestions.push("Add a real project, task, or workplace example.");
  }
  if (!hasOutcome) {
    weaknesses.push("The result or impact is not clearly stated.");
    suggestions.push("Finish by explaining the measurable result or what you learned.");
  }
  if (relevanceRatio < 0.15) {
    weaknesses.push("The response could connect more directly to the question's key points.");
    suggestions.push(`Address these expected areas: ${(question.expectedPoints || []).join("; ")}.`);
  }
  if (!weaknesses.length) weaknesses.push("More concise wording could make the strongest points stand out.");
  if (!suggestions.length) suggestions.push("Keep the answer focused and support important claims with evidence.");

  return {
    scores: { correctness, confidence, communication, technicalAccuracy, overall },
    strengths: strengths.slice(0, 3),
    weaknesses: weaknesses.slice(0, 3),
    suggestions: suggestions.slice(0, 3),
  };
};

module.exports = { evaluateLocally };
