import { Request, Response } from 'express'
import { container } from 'tsyringe'

import { CreateSurvey } from '../services/database/surveys/CreateSurvey'
import { UpdateSurvey } from '../services/database/surveys/UpdateSurvey'
import * as views from '../views/surveys.views'

export class SurveysController {
  async create({ user, body }: Request, response: Response): Promise<Response> {
    const service = container.resolve(CreateSurvey)
    const survey = await service.execute({ ...body, userId: user.id })

    return response.status(201).json(views.single(survey))
  }

  async update({ params, user, body }: Request, response: Response): Promise<Response> {
    const service = container.resolve(UpdateSurvey)
    const survey = await service.execute({ ...body, surveyId: params.id, userId: user.id })

    return response.json(views.single(survey))
  }
}
