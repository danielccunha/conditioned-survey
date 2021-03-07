import { Request, Response } from 'express'
import { container } from 'tsyringe'

import { CreateSurvey } from '../services/database/surveys/CreateSurvey'

export class SurveysController {
  async create({ user, body }: Request, response: Response): Promise<Response> {
    const service = container.resolve(CreateSurvey)
    const survey = await service.execute({ userId: user.id, ...body })

    return response.status(201).json(survey)
  }
}
