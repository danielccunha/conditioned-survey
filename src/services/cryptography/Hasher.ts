import bcrypt from 'bcrypt'

export class Hasher {
  constructor(private salt: number) {}

  hash(value: string): Promise<string> {
    return bcrypt.hash(value, this.salt)
  }

  compare(value: string, hash: string): Promise<boolean> {
    return bcrypt.compare(value, hash)
  }
}
