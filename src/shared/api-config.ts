const API_BASE_URL_FALLBACK = "http://127.0.0.1:7878/api/workflow"

/**
 * Environment-based workflow API base URL.
 * - development: set in .env.development
 * - production: set in .env.production
 */
export const WORKFLOW_API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || API_BASE_URL_FALLBACK
