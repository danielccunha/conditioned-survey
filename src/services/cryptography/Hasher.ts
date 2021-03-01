import bcrypt from 'bcrypt'

export interface Hasher {
  hash(value: string): Promise<string>
  compare(value: string, hash: string): Promise<boolean>
}

export class HasherImpl implements Hasher {
  constructor(private salt: number) {}

  hash(value: string): Promise<string> {
    return bcrypt.hash(value, this.salt)
  }

  compare(value: string, hash: string): Promise<boolean> {
    return bcrypt.compare(value, hash)
  }
}
