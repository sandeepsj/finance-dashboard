// Auth-side types — visible to UI components.

export interface User {
  sub: string;
  email: string;
  name?: string;
  picture?: string;
}

export interface AccessToken {
  value: string;
  /** Epoch ms when the token expires. */
  expiresAt: number;
  scope: string;
}

export type AuthStatus =
  | { kind: 'unconfigured' }                     // no VITE_GOOGLE_CLIENT_ID
  | { kind: 'loading' }                          // GIS script not yet ready
  | { kind: 'signed-out' }
  | { kind: 'signing-in' }
  | { kind: 'signed-in'; user: User; token: AccessToken }
  | { kind: 'error'; message: string };
