// IDs of depth-0 industries known to be problematic when used as the
// Programmatic Module assignment — too-generic parents that should always
// be drilled down to a more specific child industry.
//
// Add or remove entries as new patterns emerge. F1 fires only when the
// Programmatic Module's resolved_industry_id is in this set.
export const HIGH_LEVEL_PARENTS_TO_WATCH = new Set([
  95,    // Apparel Manufacture
  202,   // Clothing Stores
  60,    // Consumer Finance
  207,   // Cosmetics, Beauty Supply, and Perfume Stores
  5109,  // Fashion accessories
  388,   // Food - Packaged
  173,   // Gambling Operations
  78,    // Healthcare
  9342,  // Home Products
  205,   // Consumer Electronics Stores
  123,   // Household Appliance Manufacture
  5228,  // Housekeeping
  299,   // Information Technology
  5258,  // Internet
  373,   // Pharmaceutical Manufacture and Sale - over the counter
  89,    // Pharmaceutical Manufacture and Sale - prescription
  9127,  // Political Issues and Policy
  378,   // Politicians
  9157,  // Software Applications
  5384,  // Toiletries
  158,   // Toy Manufacture
]);

export const flagConfig = {
  highImpressionThreshold: 100_000,
};
