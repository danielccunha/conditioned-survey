import { inject, singleton } from 'tsyringe'

import Joi from '@hapi/joi'

import { Survey, SurveyStatus } from '../../../database/entities'
import { SurveysRepository } from './../../../database/repositories/SurveysRepository'
import { AppError } from './../../../errors/AppError'
import { PropertyError } from './../../../errors/PropertyError'

export interface PublishSurveyParams {
  surveyId: string
  userId: string
}

const validator = Joi.object<PublishSurveyParams>().keys({
  surveyId: Joi.string().trim().uuid().required(),
  userId: Joi.string().trim().uuid().required()
})

@singleton()
export class PublishSurvey {
  constructor(
    @inject('SurveysRepository')
    private repository: SurveysRepository
  ) {}

  async execute(params: PublishSurveyParams) {
    const survey = await this.validate(params)
    return await this.repository.publish(survey)
  }

  private async validate(params: PublishSurveyParams): Promise<Survey> {
    const { value, error } = validator.validate(params, { abortEarly: false })
    const errors = PropertyError.fromValidationError(error)
    let survey: Survey

    if (!PropertyError.includes(errors, 'surveyId')) {
      survey = await this.repository.findById(value.surveyId)

      if (!survey) {
        throw new AppError('Survey not found.', { statusCode: 404 })
      } else if (survey.userId !== value.userId) {
        throw new AppError("You don't have permission to manage this survey.", { statusCode: 403 })
      } else if (survey.status !== SurveyStatus.Draft) {
        errors.push(new PropertyError('surveyId', 'Survey was already published.'))
      }
    }

    if (errors.length) {
      throw new AppError('One or more properties are invalid.', { data: errors })
    }

    return survey
  }
}
