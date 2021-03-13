import { Request, Response } from 'express'
import { container } from 'tsyringe'

import { SurveyStatus } from '../database/entities/Survey'
import { CloseSurvey } from '../services/database/surveys/CloseSurvey'
import { CreateSurvey } from '../services/database/surveys/CreateSurvey'
import { FindSurveys } from '../services/database/surveys/FindSurveys'
import { FindSurveyWithRelations } from '../services/database/surveys/FindSurveyWithRelations'
import { ManageSpecification } from '../services/database/surveys/ManageSpecifications'
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

  async show({ params }: Request, response: Response): Promise<Response> {
    const service = container.resolve(FindSurveyWithRelations)
    const survey = await service.execute(params.id)

    return response.json(views.single(survey))
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

  async open({ pagination, query }: Request, response: Response): Promise<Response> {
    const params: any = { query: query?.query || '', status: [SurveyStatus.Published], pagination }
    const service = container.resolve(FindSurveys)
    const [surveys, total] = await service.execute(params)

    response.header('X-Total-Count', total.toString())
    return response.json(views.many(surveys))
  }

  async specifications({ params, user, body }: Request, response: Response): Promise<Response> {
    const service = container.resolve(ManageSpecification)
    const specs = await service.execute({
      surveyId: params.id,
      userId: user.id,
      specifications: body
    })

    return response.status(201).json(specs)
  }
}
