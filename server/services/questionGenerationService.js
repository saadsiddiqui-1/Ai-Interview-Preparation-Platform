const { generateGeminiQuestions } = require("./geminiQuestionGenerator");
const { generateLocalQuestions } = require("./localQuestionGenerator");

const GEMINI_MODELS = [
  process.env.GEMINI_MODEL,
  "gemini-3.5-flash-lite",
  "gemini-3.5-flash",
  "gemini-3.1-flash-lite",
].filter((model, index, models) => model && models.indexOf(model) === index);

const wait = (milliseconds) =>
  new Promise((resolve) => {
    setTimeout(resolve, milliseconds);
  });

const isTemporaryError = (error) => {
  const message = error.message?.toLowerCase() || "";
  return [
    "429",
    "503",
    "unavailable",
    "high demand",
    "fetch failed",
    "timeout",
    "timed out",
  ].some((indicator) => message.includes(indicator));
};

const generateQuestions = async (options) => {
  let lastError;

  for (let index = 0; index < GEMINI_MODELS.length; index += 1) {
    const model = GEMINI_MODELS[index];
    try {
      const questions = await generateGeminiQuestions(options, model);
      return { questions, source: "gemini", model };
    } catch (error) {
      lastError = error;
      const isUnavailableModel =
        error.message?.includes("404") || error.message?.includes("NOT_FOUND");
      if (!isTemporaryError(error) && !isUnavailableModel) break;
      if (index < GEMINI_MODELS.length - 1) await wait((index + 1) * 300);
    }
  }

  console.warn(`Gemini generation unavailable; using local fallback: ${lastError.message}`);
  return {
    questions: generateLocalQuestions(options),
    source: "local",
    model: null,
  };
};

module.exports = { generateQuestions };
