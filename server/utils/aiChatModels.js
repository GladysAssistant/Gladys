const DEFAULT_TEXT_MODEL = 'mistral-small-3.2-24b-instruct-2506';
const DEFAULT_VISION_MODEL = 'gemma-4-26b-a4b-it';

// Scaleway Generative APIs models suited for smart-home command parsing (chat + JSON).
// Excludes audio-only (whisper, voxtral), embeddings, and code-specialized models.
const ALLOWED_SCALEWAY_MODELS = {
  // Defaults — fast, cheap, good instruction following
  [DEFAULT_TEXT_MODEL]: { vision: true },
  [DEFAULT_VISION_MODEL]: { vision: true },
  // Vision — image analysis (cameras, scene understanding)
  'qwen3.6-35b-a3b': { vision: true },
  'pixtral-12b-2409': { vision: true },
  'gemma-3-27b-it': { vision: true },
  'holo2-30b-a3b': { vision: true },
  // Premium vision — complex multimodal requests
  'qwen3.5-397b-a17b': { vision: true },
  // Text — richer reasoning for ambiguous or multi-step commands
  'gpt-oss-120b': { vision: false },
  'llama-3.3-70b-instruct': { vision: false },
  'qwen3-235b-a22b-instruct-2507': { vision: false },
};

/**
 * @description Return true when the model id is allowed for AI chat.
 * @param {string} modelId - Model identifier.
 * @returns {boolean} Whether the model is allowed.
 * @example
 * isAllowedAiChatModel('mistral-small-3.2-24b-instruct-2506');
 */
function isAllowedAiChatModel(modelId) {
  return Boolean(modelId && Object.prototype.hasOwnProperty.call(ALLOWED_SCALEWAY_MODELS, modelId));
}

/**
 * @description Resolve a client model value to an API model id.
 * @param {string|undefined|null} model - Client model value ("auto" omits the model field).
 * @returns {string|undefined} Resolved model id or undefined for auto/default.
 * @example
 * resolveAiChatModel('auto');
 */
function resolveAiChatModel(model) {
  if (!model || model === 'auto') {
    return undefined;
  }
  if (!isAllowedAiChatModel(model)) {
    return null;
  }
  return model;
}

/**
 * @description List allowed AI chat models for the UI.
 * @returns {Array<{ id: string, vision: boolean }>} Allowed models.
 * @example
 * getAiChatModelsList();
 */
function getAiChatModelsList() {
  return Object.entries(ALLOWED_SCALEWAY_MODELS).map(([id, metadata]) => ({
    id,
    vision: metadata.vision === true,
  }));
}

module.exports = {
  DEFAULT_TEXT_MODEL,
  DEFAULT_VISION_MODEL,
  ALLOWED_SCALEWAY_MODELS,
  isAllowedAiChatModel,
  resolveAiChatModel,
  getAiChatModelsList,
};
