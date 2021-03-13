import { inject, singleton } from 'tsyringe'

import Joi from '@hapi/joi'

import { SurveyAnswer, SurveyStatus, SurveyType } from '../../../database/entities'
import { SurveysRepository, UsersRepository } from '../../../database/repositories'
import { AppError } from '../../../errors'
import { PropertyError } from './../../../errors/PropertyError'

export interface CreateAnswerDto {
  userId: string
  surveyId: string
  value: string
}

const validator = Joi.object<CreateAnswerDto>().keys({
  surveyId: Joi.string().trim().uuid().required(),
  userId: Joi.string().trim().uuid().required(),
  value: Joi.string().trim().required()
})

@singleton()
export class CreateAnswer {
  constructor(
    @inject('SurveysRepository')
    private surveysRepo: SurveysRepository,

    @inject('UsersRepository')
    private usersRepo: UsersRepository
  ) {}

  async execute(dto: CreateAnswerDto): Promise<SurveyAnswer> {
    const sanitizedDto = await this.validate(dto)
    const transformedAnswer = this.transform(sanitizedDto)
    return await this.surveysRepo.storeAnswer(transformedAnswer)
  }

  private async validate(dto: CreateAnswerDto): Promise<CreateAnswerDto> {
    const { value, error } = validator.validate(dto, { abortEarly: false })
    const errors = PropertyError.fromValidationError(error)

    if (!PropertyError.includes(errors, 'surveyId')) {
      const survey = await this.surveysRepo.findByIdWithRelations(value.surveyId)
      if (!survey) {
        throw new AppError('Survey not found.', { statusCode: 404 })
      } else if (survey.status !== SurveyStatus.Published) {
        errors.push(new PropertyError('surveyId', 'Survey is not published.'))
      } else if (!PropertyError.includes(errors, 'value')) {
        if (survey.type === SurveyType.Boolean) {
          const sanitizedValue = value.value.toLowerCase()
          if (sanitizedValue !== 'true' && sanitizedValue !== 'false') {
            errors.push(new PropertyError('value', 'Value must be true or false.'))
          }
        } else {
          const option = survey.options.find(option => option.id === value.value)
          if (!option) {
            errors.push(new PropertyError('value', 'Option not found.'))
          }
        }
      }
    }

    if (!PropertyError.includes(errors, 'userId')) {
      const user = await this.usersRepo.findById(value.userId)
      if (!user) {
        throw new AppError('User not found.', { statusCode: 404 })
      }

      if (!PropertyError.includes(errors, 'surveyId')) {
        const { userId, surveyId } = value
        const existingAnswer = await this.surveysRepo.findAnswerByUserANdSurvey(userId, surveyId)

        if (existingAnswer) {
          errors.push(new PropertyError('userId', 'User already answered this survey.'))
        }
      }
    }

    if (errors.length) {
      throw new AppError('One or more properties are invalid.', { data: errors })
    }

    return value
  }

  private transform(dto: CreateAnswerDto): SurveyAnswer {
    const answer = new SurveyAnswer()
    answer.surveyId = dto.surveyId
    answer.userId = dto.userId
    answer.value = dto.value
    return answer
  }
}
