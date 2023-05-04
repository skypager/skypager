import crypto from 'node:crypto'
import { FeatureState, FeatureOptions, Feature, features } from '../feature.js'
import { NodeContainer } from '../container.js'
import { ContainerContext } from '../../container.js'

export interface VaultState extends FeatureState {
  secret?: Buffer 
}

export interface VaultOptions extends FeatureOptions {
  secret?: Buffer | string
}

export class Vault extends Feature<VaultState, VaultOptions> {
  static attach(c: NodeContainer) {

  }

  override get shortcut() {
    return 'vault' as const
  }
  
  constructor(options: VaultOptions, context: ContainerContext) {
    let secret = options.secret
    
    if (typeof secret === 'string') {
      secret = Buffer.from(secret, 'base64')
    }

    super({ ...options, secret }, context)  
    
    this.state.set('secret', secret)
  }
  
  get secretText() {
    return this.state.get('secret')!?.toString('base64')
  }

  secret({ refresh = false, set = true } = {}) : Buffer {
    if (!refresh && this.state.get('secret')) {
      return this.state.get('secret')!
    }

    const val = generateSecretKey()   

    if(set && !this.state.get('secret')) {
      this.state.set('secret', val)
    }

    return val
  }
 
  decrypt(payload: string) {
    const [iv, ciphertext, authTag] = payload.split('\n------\n').map((v) => Buffer.from(v, 'base64'))
    return this._decrypt(ciphertext, iv, authTag)
  }

  encrypt(payload: string) {
    const { iv, ciphertext, authTag } = this._encrypt(payload)
    
    return [
      iv.toString('base64'),
      ciphertext.toString('base64'),
      authTag.toString('base64')
    ].join('\n------\n')
  }
  
  private _encrypt(payload: string) {
    const secret = this.secret()
    const { iv, ciphertext, authTag } = encrypt(payload, secret)
    return { iv, ciphertext, authTag }
  }
  
  private _decrypt(cipher: Buffer, iv: Buffer, authTag: Buffer) {
    return decrypt(cipher, this.secret(), iv, authTag)
  }
}

export default features.register('vault', Vault)

function generateSecretKey(): Buffer {
  return crypto.randomBytes(32);
}

type EncryptionResult = {
  iv: Buffer;
  ciphertext: Buffer;
  authTag: Buffer;
};

function encrypt(plaintext: string, secretKey: Buffer): EncryptionResult {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", secretKey, iv);
  const ciphertext = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const authTag = cipher.getAuthTag();
  return { iv, ciphertext, authTag };
}

function decrypt(ciphertext: Buffer, secretKey: Buffer, iv: Buffer, authTag: Buffer): string {
  const decipher = crypto.createDecipheriv("aes-256-gcm", secretKey, iv);
  decipher.setAuthTag(authTag);
  const plaintext = Buffer.concat([decipher.update(ciphertext), decipher.final()]).toString("utf8");
  return plaintext;
}
