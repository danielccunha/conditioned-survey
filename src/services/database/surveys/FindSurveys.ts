import { inject, singleton } from 'tsyringe'

import Joi from '@hapi/joi'

import { Survey, SurveyStatus } from '../../../database/entities'
import { Pagination } from '../../../middleware'
import { SurveysRepository } from './../../../database/repositories/SurveysRepository'
import { AppError } from './../../../errors/AppError'
import { PropertyError } from './../../../errors/PropertyError'

export interface FindSurveysParams {
  query: string
  userId?: string
  status: SurveyStatus[]
  pagination: Pagination
}

const validator = Joi.object<FindSurveysParams>()
  .keys({
    query: Joi.string().trim().allow(null, '').default(''),
    userId: Joi.string().trim().allow(null, '').uuid(),
    status: Joi.array().items(Joi.string().valid('D', 'P', 'C')).default([]),
    pagination: Joi.object<Pagination>()
      .keys({
        page: Joi.number().min(0).required(),
        size: Joi.number().min(1).required()
      })
      .unknown(true)
      .required()
  })
  .unknown(true)

@singleton()
export class FindSurveys {
  constructor(
    @inject('SurveysRepository')
    private repository: SurveysRepository
  ) {}

  async execute(params: FindSurveysParams): Promise<[Survey[], number]> {
    const validatedParams = this.validate(params)
    return await this.repository.find(validatedParams)
  }

  private validate(params: FindSurveysParams): FindSurveysParams {
    const { value, error } = validator.validate(params, { abortEarly: false })
    const errors = PropertyError.fromValidationError(error)

    if (errors.length) {
      throw new AppError('One or more properties are invalid.', { data: errors })
    }

    return value
  }
}
