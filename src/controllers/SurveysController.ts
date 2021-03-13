import { Request, Response } from 'express'
import { container } from 'tsyringe'

import { CloseSurvey } from '../services/database/surveys/CloseSurvey'
import { CreateSurvey } from '../services/database/surveys/CreateSurvey'
import { FindSurveys } from '../services/database/surveys/FindSurveys'
import { PublishSurvey } from '../services/database/surveys/PublishSurvey'
import { UpdateSurvey } from '../services/database/surveys/UpdateSurvey'
import * as views from '../views/surveys.views'

export class SurveysController {
  async index({ user, pagination, query }: Request, response: Response): Promise<Response> {
    const params: any = {
      ...query,
      userId: user.id,
      status: typeof query.status === 'string' ? [query.status] : query.status,
      pagination
    }
    const service = container.resolve(FindSurveys)
    const [surveys, total] = await service.execute(params)

    response.header('X-Total-Count', total.toString())
    return response.json(views.many(surveys))
  }

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

  async publish({ user, params }: Request, response: Response): Promise<Response> {
    const service = container.resolve(PublishSurvey)
    await service.execute({ userId: user.id, surveyId: params.id })

    return response.status(204).send()
  }

  async close({ user, params }: Request, response: Response): Promise<Response> {
    const service = container.resolve(CloseSurvey)
    await service.execute({ userId: user.id, surveyId: params.id })

    return response.status(204).send()
  }
}
