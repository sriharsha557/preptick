// Feature Flags Configuration
// This file controls which features are enabled or disabled in the application

/**
 * Feature flags for controlling application features
 * Requirements: 5.1, 5.2
 */
export const FEATURE_FLAGS = {
  /**
   * Custom Topics Feature
   * When enabled, users can add custom topics that are validated against the syllabus
   * When disabled, only predefined syllabus topics are available
   * Default: false (disabled)
   */
  CUSTOM_TOPICS_ENABLED: false,
} as const;

export type FeatureFlags = typeof FEATURE_FLAGS;
