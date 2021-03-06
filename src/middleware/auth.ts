import { Request, Response, NextFunction } from 'express'
import { container } from 'tsyringe'

import { Encrypter } from './../services/cryptography/Encrypter'

export interface UserInformation {
  id: string
}

export const auth = async (request: Request, response: Response, next: NextFunction) => {
  const token = request.headers['x-access-token'] as string

  if (!token) {
    return response.status(401).json({ message: 'Token not found.' })
  }

  const hasher = container.resolve(Encrypter)
  const decryptedUser = await hasher.decrypt<UserInformation>(token)

  if (!decryptedUser) {
    return response.status(403).json({ message: 'Token expired.' })
  }

  request.user = decryptedUser
  next()
}
