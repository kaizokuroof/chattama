// Models that support vision capabilities
const VISION_PATTERNS = [
  'llava',
  'bakllava',
  'llama-vision',
  'llama2-vision',
  'llama-2-vision'
];

export const supportsVision = (modelName) => {
  if (!modelName) return false;
  
  // Convert to lowercase, normalize separators, and remove :latest suffix
  const normalizedName = modelName.toLowerCase()
    .replace(/[:_]/g, '-')      // Replace colons and underscores with hyphens
    .replace(/-?latest$/, '');  // Remove :latest or -latest suffix
  
  // First check for exact pattern matches
  if (VISION_PATTERNS.some(pattern => normalizedName.includes(pattern))) {
    return true;
  }
  
  // Then check for the vision suffix with optional version numbers
  // This handles cases like:
  // - llama3.2-vision
  // - llama-3.2-vision
  // - 13b-vision
  // - v1.5-vision
  const visionSuffixPattern = /(?:\d+(?:\.\d+)?[b]?)?-?vision$/;
  if (visionSuffixPattern.test(normalizedName)) {
    return true;
  }
  
  // Also check for version numbers without hyphens
  // This handles cases like:
  // - llama3.2vision
  // - llama32vision
  const versionWithoutHyphenPattern = /\d+(?:\.\d+)?[b]?vision$/;
  if (versionWithoutHyphenPattern.test(normalizedName)) {
    return true;
  }
  
  return false;
};

// For debugging
if (typeof window !== 'undefined') {
  window.testVisionSupport = (modelName) => {
    console.log('Testing:', modelName);
    const normalized = modelName.toLowerCase()
      .replace(/[:_]/g, '-')
      .replace(/-?latest$/, '');
    console.log('Normalized:', normalized);
    console.log('Result:', supportsVision(modelName));
  };
}
