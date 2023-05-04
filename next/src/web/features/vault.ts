import { Feature, FeatureState, FeatureOptions, features } from '../feature.js'
import { WebContainer} from '../container.js'

export interface WebVaultState extends FeatureState {
  secret?: string 
}

export interface WebVaultOptions extends FeatureOptions {
  secret?: string 
}

export class WebVault extends Feature<WebVaultState, WebVaultOptions> {
  static attach(c: WebContainer ) {

  }

  override get shortcut() {
    return 'vault' as const
  }
  
  async secret({ refresh = false, set = true } = {}) : Promise<ArrayBuffer> {
    if (!this.state.get('secret') && this.options.secret) {
      this.state.set('secret', this.options.secret)
    }

    if (!refresh && this.state.get('secret')) {
      return base64ToArrayBuffer(this.state.get('secret')!)
    }

    const val = await generateSecretKey()   
    const asString = arrayBufferToBase64(val)

    if(set && !this.state.get('secret')) {
      this.state.set('secret', asString)
    }
    
    return val
  }
 
  async decrypt(payload: string) {
    const parts = payload.split("\n------\n")
    const iv = base64ToUint8Array(parts[1])
    const ciphertext = base64ToArrayBuffer(parts[0])
    const secret = await this.secret()
    
    console.log(ciphertext, secret, iv)
    return await decrypt(ciphertext, secret, iv)
  }

  async encrypt(payload: string) {
    const secret = await this.secret()
    console.log("encrypting", payload, secret)
    const { iv, ciphertext, } = await encrypt(payload, secret)

    return [
      arrayBufferToBase64(ciphertext),
      uint8ArrayToBase64(iv)
    ].join("\n------\n")
  }
  
  utils = {
    arrayToString: arrayBufferToBase64,
    stringToArray: base64ToArrayBuffer,
    uintToString: uint8ArrayToBase64,
  }
}

export default features.register('vault', WebVault)

async function generateSecretKey(): Promise<ArrayBuffer> {
  const key = await crypto.subtle.generateKey(
    { name: "AES-GCM", length: 256 },
    true,
    ["encrypt", "decrypt"]
  );
  const secretKey = await crypto.subtle.exportKey("raw", key);
  return secretKey;
}

async function encrypt(plaintext: string, secretKey: ArrayBuffer): Promise<{ iv: Uint8Array; ciphertext: ArrayBuffer }> {
  const encoder = new TextEncoder();
  const encodedText = encoder.encode(plaintext);
  const key = await crypto.subtle.importKey(
    "raw",
    secretKey,
    { name: "AES-GCM" },
    false,
    ["encrypt", "decrypt"]
  );
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const ciphertext = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    key,
    encodedText
  );
  return { iv, ciphertext };
}

async function decrypt(ciphertext: ArrayBuffer, secretKey: ArrayBuffer, iv: Uint8Array): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    secretKey,
    { name: "AES-GCM" },
    false,
    ["encrypt", "decrypt"]
  );
  const plaintextArrayBuffer = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv },
    key,
    ciphertext
  );
  const decoder = new TextDecoder();
  const plaintext = decoder.decode(plaintextArrayBuffer);
  return plaintext;
}

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
  let base64 = "";

  for (let i = 0; i < bytes.byteLength; i += 3) {
    const a = bytes[i];
    const b = bytes[i + 1];
    const c = bytes[i + 2];

    const index1 = a >> 2;
    const index2 = ((a & 0x03) << 4) | (b >> 4);
    const index3 = isNaN(b) ? 64 : ((b & 0x0f) << 2) | (c >> 6);
    const index4 = isNaN(b) || isNaN(c) ? 64 : c & 0x3f;

    base64 += chars[index1] + chars[index2] + chars[index3] + chars[index4];
  }

  return base64.replace('undefined', '==');
}

function uint8ArrayToBase64(u: Uint8Array): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
  let base64 = "";

  for (let i = 0; i < u.byteLength; i += 3) {
    const a = u[i];
    const b = u[i + 1];
    const c = u[i + 2];

    const index1 = a >> 2;
    const index2 = ((a & 0x03) << 4) | (b >> 4);
    const index3 = isNaN(b) ? 64 : ((b & 0x0f) << 2) | (c >> 6);
    const index4 = isNaN(b) || isNaN(c) ? 64 : c & 0x3f;

    base64 += chars[index1] + chars[index2] + chars[index3] + chars[index4];
  }

  return base64;
}

function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const uint8Array = base64ToUint8Array(base64);
  return uint8Array.buffer;
}

function base64ToUint8Array(base64: string): Uint8Array {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
  const lookup = new Uint8Array(256);
  
  for (let i = 0; i < chars.length; i++) {
    lookup[chars.charCodeAt(i)] = i;
  }

  const padding = base64.endsWith("==") ? 2 : base64.endsWith("=") ? 1 : 0;
  const length = (base64.length * 3 / 4) - padding;
  const bytes = new Uint8Array(length);

  for (let i = 0, j = 0; i < base64.length; i += 4, j += 3) {
    const index1 = lookup[base64.charCodeAt(i)];
    const index2 = lookup[base64.charCodeAt(i + 1)];
    const index3 = lookup[base64.charCodeAt(i + 2)];
    const index4 = lookup[base64.charCodeAt(i + 3)];

    bytes[j] = (index1 << 2) | (index2 >> 4);
    if (j + 1 < length) bytes[j + 1] = ((index2 & 0x0f) << 4) | (index3 >> 2);
    if (j + 2 < length) bytes[j + 2] = ((index3 & 0x03) << 6) | index4;
  }

  return bytes;
}