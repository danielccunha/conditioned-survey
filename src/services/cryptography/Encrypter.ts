import jwt from 'jsonwebtoken'
import { singleton } from 'tsyringe'

@singleton()
export class Encrypter {
  private readonly secret: string

  constructor() {
    this.secret = process.env.ENCRYPTER_SECRET
  }

  decrypt<T = any>(value: string): Promise<T> {
    return new Promise(resolve => {
      const decryptedValue: any = jwt.verify(value, this.secret)
      resolve(decryptedValue as T)
    })
  }

  encrypt(value: any): Promise<string> {
    return new Promise(resolve => {
      const accessToken = jwt.sign(value, this.secret, { expiresIn: '1d' })
      resolve(accessToken)
    })
  }
}
