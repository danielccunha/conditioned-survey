import bcrypt from 'bcrypt'

export class Hasher {
  private salt: number

  constructor() {
    this.salt = parseInt(process.env.HASHER_SALT)
  }

  hash(value: string): Promise<string> {
    return bcrypt.hash(value, this.salt)
  }

  compare(value: string, hash: string): Promise<boolean> {
    return bcrypt.compare(value, hash)
  }
}
