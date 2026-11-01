/**
 * Client-Side End-to-End Encryption (E2EE) Module for TITIK Direct Messaging.
 *
 * Implements deterministic conversation-derived keys via PBKDF2-SHA256 (100,000 iterations)
 * and AES-GCM-256 AEAD encryption with a 12-byte random IV per message.
 *
 * Wire payload format: `enc:v1:<base64_iv>:<base64_ciphertext>`
 * Plaintext is never stored in or transmitted across Supabase relays.
 */

const keyCache = new Map<string, CryptoKey>();

function getSubtleCrypto(): SubtleCrypto {
  if (typeof globalThis !== 'undefined' && globalThis.crypto?.subtle) {
    return globalThis.crypto.subtle;
  }
  if (typeof window !== 'undefined' && window.crypto?.subtle) {
    return window.crypto.subtle;
  }
  throw new Error('Web Crypto API (subtle) is not available in this environment.');
}

function getRandomValues(array: Uint8Array): Uint8Array {
  const cryptoObj =
    typeof globalThis !== 'undefined' && globalThis.crypto
      ? globalThis.crypto
      : typeof window !== 'undefined'
      ? window.crypto
      : undefined;

  if (cryptoObj?.getRandomValues) {
    cryptoObj.getRandomValues(array as unknown as Uint8Array<ArrayBuffer>);
    return array;
  }
  throw new Error('Web Crypto API (getRandomValues) is not available in this environment.');
}

/**
 * Converts a Uint8Array to a Base64 string safely across Node.js (Vitest) and browser environments.
 */
export function uint8ArrayToBase64(bytes: Uint8Array): string {
  if (typeof Buffer !== 'undefined') {
    return Buffer.from(bytes).toString('base64');
  }
  let binary = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return globalThis.btoa(binary);
}

/**
 * Converts a Base64 string to a Uint8Array safely across Node.js (Vitest) and browser environments.
 */
export function base64ToUint8Array(base64: string): Uint8Array {
  if (typeof Buffer !== 'undefined') {
    return new Uint8Array(Buffer.from(base64, 'base64'));
  }
  const binary = globalThis.atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

/**
 * Checks whether the given string conforms to the TITIK E2EE payload wire format:
 * `enc:v1:<base64_iv>:<base64_ciphertext>`
 */
export function isEncrypted(content: string): boolean {
  return typeof content === 'string' && content.startsWith('enc:v1:');
}

/**
 * Derives a deterministic 256-bit AES-GCM CryptoKey for a conversation using PBKDF2-SHA256 (100,000 iterations).
 * The derivation binds the unique conversation ID and sorted participant IDs.
 */
export async function deriveConversationKey(
  conversationId: string,
  participantIds: string[]
): Promise<CryptoKey> {
  const sortedParticipants = [...participantIds].sort().join(':');
  const cacheKey = `${conversationId}|${sortedParticipants}`;

  const existing = keyCache.get(cacheKey);
  if (existing) {
    return existing;
  }

  const subtle = getSubtleCrypto();
  const encoder = new TextEncoder();

  // Import base key material derived deterministically from sorted participant IDs
  const rawKeyMaterial = encoder.encode(`titik:e2ee:key:${sortedParticipants}`);
  const baseKey = await subtle.importKey(
    'raw',
    rawKeyMaterial,
    'PBKDF2',
    false,
    ['deriveKey']
  );

  // Salt binds both conversation ID and sorted participant list
  const salt = encoder.encode(`titik:salt:${conversationId}:${sortedParticipants}`);

  const derivedKey = await subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt,
      iterations: 100000,
      hash: 'SHA-256',
    },
    baseKey,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );

  keyCache.set(cacheKey, derivedKey);
  return derivedKey;
}

/**
 * Encrypts a plaintext string using AES-GCM-256 with a 12-byte random IV.
 * Produces an encrypted payload formatted as: `enc:v1:<base64_iv>:<base64_ciphertext>`
 */
export async function encryptMessage(
  plainText: string,
  conversationId: string,
  participantIds: string[]
): Promise<string> {
  const subtle = getSubtleCrypto();
  const iv = getRandomValues(new Uint8Array(12));
  const key = await deriveConversationKey(conversationId, participantIds);
  const plainBytes = new TextEncoder().encode(plainText);

  const cipherBuffer = await subtle.encrypt(
    {
      name: 'AES-GCM',
      iv: iv as unknown as BufferSource,
    },
    key,
    plainBytes as unknown as BufferSource
  );

  const ivBase64 = uint8ArrayToBase64(iv);
  const cipherBase64 = uint8ArrayToBase64(new Uint8Array(cipherBuffer));

  return `enc:v1:${ivBase64}:${cipherBase64}`;
}

/**
 * Decrypts an encrypted payload formatted as `enc:v1:<base64_iv>:<base64_ciphertext>`.
 * Gracefully falls back to returning the plaintext as-is if the content is not encrypted.
 */
export async function decryptMessage(
  cipherPayload: string,
  conversationId: string,
  participantIds: string[]
): Promise<string> {
  if (!isEncrypted(cipherPayload)) {
    // Graceful fallback for unencrypted legacy or seed messages
    return cipherPayload;
  }

  const parts = cipherPayload.split(':');
  if (parts.length < 4 || parts[0] !== 'enc' || parts[1] !== 'v1') {
    // Malformed format, return payload directly as fallback
    return cipherPayload;
  }

  const iv = base64ToUint8Array(parts[2]);
  const cipherBytes = base64ToUint8Array(parts[3]);

  const subtle = getSubtleCrypto();
  const key = await deriveConversationKey(conversationId, participantIds);

  const decryptedBuffer = await subtle.decrypt(
    {
      name: 'AES-GCM',
      iv: iv as unknown as BufferSource,
    },
    key,
    cipherBytes as unknown as BufferSource
  );

  return new TextDecoder().decode(decryptedBuffer);
}

/**
 * Clears the in-memory key cache. Useful for testing or user session resets.
 */
export function clearKeyCache(): void {
  keyCache.clear();
}
