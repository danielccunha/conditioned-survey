import auth from 'basic-auth'
import { Request, Response } from 'express'
import { container } from 'tsyringe'

import { CreateSession } from '../services/database/users/CreateSession'

export class SessionsController {
  async create(request: Request, response: Response): Promise<Response> {
    const { name: email, pass: password } = auth(request) || {}
    const service = container.resolve(CreateSession)
    const token = await service.execute({ email, password })
    return response.json({ token })
  }
}
