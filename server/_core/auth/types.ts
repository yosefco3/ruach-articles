/**
 * Authenticated user shape used throughout the server.
 * Extracted from context.ts so auth logic and tRPC context can
 * share a single canonical type.
 */
export interface AuthUser {
  id: string; // OpenID for session identification
  dbId: number; // Numeric database ID for foreign keys
  email: string;
  name: string;
  avatar: string;
  role: 'admin' | 'user';
}