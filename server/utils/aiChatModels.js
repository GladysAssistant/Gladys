const DEFAULT_TEXT_MODEL = 'mistral-small-3.2-24b-instruct-2506';
const DEFAULT_VISION_MODEL = 'gemma-4-26b-a4b-it';

const AI_CHAT_MODEL_PRICE_TIER = {
  LOW: 1,
  MEDIUM: 2,
  HIGH: 3,
};

const AI_CHAT_MODEL_PRICE_LABELS = {
  [AI_CHAT_MODEL_PRICE_TIER.LOW]: '€',
  [AI_CHAT_MODEL_PRICE_TIER.MEDIUM]: '€€',
  [AI_CHAT_MODEL_PRICE_TIER.HIGH]: '€€€',
};

// Scaleway Generative APIs models suited for smart-home command parsing (chat + JSON).
// Excludes audio-only (whisper, voxtral), embeddings, and code-specialized models.
// Price tiers are based on Scaleway serverless output token pricing (Paris region).
const ALLOWED_SCALEWAY_MODELS = {
  // Defaults — fast, cheap, good instruction following
  [DEFAULT_TEXT_MODEL]: { vision: true, priceTier: AI_CHAT_MODEL_PRICE_TIER.LOW },
  [DEFAULT_VISION_MODEL]: { vision: true, priceTier: AI_CHAT_MODEL_PRICE_TIER.LOW },
  // Vision — image analysis (cameras, scene understanding)
  'qwen3.6-35b-a3b': { vision: true, priceTier: AI_CHAT_MODEL_PRICE_TIER.MEDIUM },
  'pixtral-12b-2409': { vision: true, priceTier: AI_CHAT_MODEL_PRICE_TIER.LOW },
  'gemma-3-27b-it': { vision: true, priceTier: AI_CHAT_MODEL_PRICE_TIER.LOW },
  'holo2-30b-a3b': { vision: true, priceTier: AI_CHAT_MODEL_PRICE_TIER.LOW },
  // Premium vision — complex multimodal requests
  'qwen3.5-397b-a17b': { vision: true, priceTier: AI_CHAT_MODEL_PRICE_TIER.HIGH },
  // Text — richer reasoning for ambiguous or multi-step commands
  'llama-3.3-70b-instruct': { vision: false, priceTier: AI_CHAT_MODEL_PRICE_TIER.MEDIUM },
  'qwen3-235b-a22b-instruct-2507': { vision: false, priceTier: AI_CHAT_MODEL_PRICE_TIER.HIGH },
};

/**
 * @description Return the price label for a model tier.
 * @param {number} priceTier - Price tier value.
 * @returns {string} Price label such as "€", "€€" or "€€€".
 * @example
 * getAiChatModelPriceLabel(1);
 */
function getAiChatModelPriceLabel(priceTier) {
  return AI_CHAT_MODEL_PRICE_LABELS[priceTier] || AI_CHAT_MODEL_PRICE_LABELS[AI_CHAT_MODEL_PRICE_TIER.LOW];
}

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
 * @returns {Array<{ id: string, vision: boolean, priceTier: number, priceLabel: string }>} Allowed models.
 * @example
 * getAiChatModelsList();
 */
function getAiChatModelsList() {
  return Object.entries(ALLOWED_SCALEWAY_MODELS).map(([id, metadata]) => ({
    id,
    vision: metadata.vision === true,
    priceTier: metadata.priceTier,
    priceLabel: getAiChatModelPriceLabel(metadata.priceTier),
  }));
}

module.exports = {
  DEFAULT_TEXT_MODEL,
  DEFAULT_VISION_MODEL,
  AI_CHAT_MODEL_PRICE_TIER,
  AI_CHAT_MODEL_PRICE_LABELS,
  ALLOWED_SCALEWAY_MODELS,
  isAllowedAiChatModel,
  resolveAiChatModel,
  getAiChatModelPriceLabel,
  getAiChatModelsList,
};
