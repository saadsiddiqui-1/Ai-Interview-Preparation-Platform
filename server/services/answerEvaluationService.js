const { evaluateWithGemini } = require("./geminiAnswerEvaluator");
const { evaluateLocally } = require("./localAnswerEvaluator");

const GEMINI_MODELS = [
  process.env.GEMINI_MODEL,
  "gemini-3.5-flash-lite",
  "gemini-3.5-flash",
  "gemini-3.1-flash-lite",
].filter((model, index, models) => model && models.indexOf(model) === index);

const evaluateAnswer = async (options) => {
  let lastError;

  for (const model of GEMINI_MODELS) {
    try {
      const evaluation = await evaluateWithGemini({ ...options, model });
      return { ...evaluation, source: "gemini", model };
    } catch (error) {
      lastError = error;
    }
  }

  if (lastError) {
    console.warn(`Gemini evaluation unavailable; using local fallback: ${lastError.message}`);
  }
  return { ...evaluateLocally(options), source: "local", model: null };
};

module.exports = { evaluateAnswer };
