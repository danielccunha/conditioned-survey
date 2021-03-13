import { inject, singleton } from 'tsyringe'

import Joi from '@hapi/joi'

import { Survey, SurveyStatus } from '../../../database/entities/Survey'
import { SurveysRepository } from '../../../database/repositories'
import { AppError, PropertyError } from '../../../errors'

export interface CloseSurveyParams {
  surveyId: string
  userId: string
}

const validator = Joi.object<CloseSurveyParams>().keys({
  surveyId: Joi.string().trim().uuid().required(),
  userId: Joi.string().trim().uuid().required()
})

@singleton()
export class CloseSurvey {
  constructor(
    @inject('SurveysRepository')
    private repository: SurveysRepository
  ) {}

  async execute(params: CloseSurveyParams): Promise<Survey> {
    const survey = await this.validate(params)
    return await this.repository.close(survey)
  }

  private async validate(params: CloseSurveyParams): Promise<Survey> {
    const { value, error } = validator.validate(params, { abortEarly: false })
    const errors = PropertyError.fromValidationError(error)
    let survey: Survey

    if (!PropertyError.includes(errors, 'surveyId')) {
      survey = await this.repository.findById(value.surveyId)

      if (!survey) {
        throw new AppError('Survey not found.', { statusCode: 404 })
      } else if (survey.userId !== value.userId) {
        throw new AppError("You don't have permission to manage this survey.", { statusCode: 403 })
      } else if (survey.status === SurveyStatus.Closed) {
        errors.push(new PropertyError('surveyId', 'Survey was already closed.'))
      }
    }

    if (errors.length) {
      throw new AppError('One or more properties are invalid.', { data: errors })
    }

    return survey
  }
}
