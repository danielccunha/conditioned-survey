import { inject, singleton } from 'tsyringe'

import Joi from '@hapi/joi'

import { Survey, SurveyType, SurveyOption, SurveyStatus } from '../../../database/entities'
import { SurveysRepository, UsersRepository } from '../../../database/repositories'
import { AppError, PropertyError } from '../../../errors'
import { removeDuplicates } from '../../../helpers'

export interface UpdateSurveyDto {
  surveyId: string
  userId: string
  title: string
  description: string
  options: string[]
  type: SurveyType
}

const validator = Joi.object<UpdateSurveyDto>().keys({
  surveyId: Joi.string().trim().uuid().required(),
  userId: Joi.string().trim().uuid().required(),
  title: Joi.string().trim().required(),
  description: Joi.string().trim().required(),
  options: Joi.array().items(Joi.string().trim()).default([]),
  type: Joi.string().trim().uppercase().valid('B', 'L').required()
})

@singleton()
export class UpdateSurvey {
  constructor(
    @inject('SurveysRepository')
    private surveysRepo: SurveysRepository,

    @inject('UsersRepository')
    private usersRepo: UsersRepository
  ) {}

  async execute(dto: UpdateSurveyDto): Promise<Survey> {
    const [validatedDto, survey] = await this.validate(dto)
    this.transform(validatedDto, survey)
    return await this.surveysRepo.update(survey)
  }

  private async validate(dto: UpdateSurveyDto): Promise<[UpdateSurveyDto, Survey]> {
    const { value, error } = validator.validate(dto, { abortEarly: false })
    const errors = PropertyError.fromValidationError(error)
    let survey: Survey

    if (!PropertyError.includes(errors, 'surveyId')) {
      survey = await this.surveysRepo.findById(value.surveyId)
      if (!survey) {
        throw new AppError('Survey not found.', { statusCode: 404 })
      } else if (survey.status !== SurveyStatus.Draft) {
        throw new AppError("You can't update a published or closed survey.", { statusCode: 403 })
      }
    }

    if (!PropertyError.includes(errors, 'userId')) {
      const user = await this.usersRepo.findById(value.userId)
      if (!user) {
        throw new AppError('User not found.', { statusCode: 404 })
      } else if (user.id !== survey.userId) {
        throw new AppError("You don't have permission to edit this survey.", { statusCode: 403 })
      }
    }

    if (!PropertyError.includes(errors, 'userId', 'title')) {
      const openSurvey = await this.surveysRepo.findOpenByUserAndTitle(value.userId, value.title)
      if (openSurvey && openSurvey.id !== survey.id) {
        errors.push(new PropertyError('title', '"title" is already used by another open survey.'))
      }
    }

    if (!PropertyError.includes(errors, 'type', 'options') && value.type === 'L') {
      value.options = removeDuplicates(value.options || [])
      if (value.options.length < 2) {
        errors.push(new PropertyError('options', '"options" must have at least two values.'))
      }
    }

    if (errors.length) {
      throw new AppError('One or more properties are invalid.', { data: errors })
    }

    return [value, survey]
  }

  private transform(dto: UpdateSurveyDto, survey: Survey) {
    survey.title = dto.title
    survey.description = dto.description
    survey.type = dto.type
    survey.options =
      dto.type === SurveyType.Boolean ? [] : dto.options.map(option => new SurveyOption(option))
  }
}
