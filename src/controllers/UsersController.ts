import { Request, Response } from 'express'
import { container } from 'tsyringe'

import { CreateUser } from '../services/database/users/CreateUser'

export class UsersController {
  async create(request: Request, response: Response): Promise<Response> {
    const service = container.resolve(CreateUser)
    await service.execute(request.body)

    return response.status(201).send()
  }
}
