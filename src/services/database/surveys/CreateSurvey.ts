import Joi from '@hapi/joi'

import { SurveyType, Survey, SurveyStatus } from '../../../database/entities'
import { SurveysRepository } from '../../../database/repositories/SurveysRepository'
import { UsersRepository } from '../../../database/repositories/UsersRepository'
import { AppError, PropertyError } from '../../../errors'
import { removeDuplicates } from '../../../helpers'
import { SurveyOption } from './../../../database/entities/SurveyOption'

export interface CreateSurveyDto {
  userId: string
  title: string
  description: string
  options: string[]
  type: SurveyType
}

const validator = Joi.object<CreateSurveyDto>().keys({
  userId: Joi.string().trim().uuid().required(),
  title: Joi.string().trim().required(),
  description: Joi.string().trim().required(),
  options: Joi.array().items(Joi.string().trim()).default([]),
  type: Joi.string().trim().uppercase().valid('B', 'L').required()
})

export class CreateSurvey {
  constructor(
    private surveysRepository: SurveysRepository,
    private usersRepository: UsersRepository
  ) {}

  async execute(dto: CreateSurveyDto): Promise<Survey> {
    const validatedDto = await this.validate(dto)
    const transformedSurvey = this.transform(validatedDto)
    return await this.surveysRepository.create(transformedSurvey)
  }

  private async validate(dto: CreateSurveyDto): Promise<CreateSurveyDto> {
    const { value, error } = validator.validate(dto, { abortEarly: false })
    const errors = PropertyError.fromValidationError(error)

    if (!PropertyError.includes(errors, 'userId')) {
      const user = await this.usersRepository.findById(value.userId)
      if (!user) {
        errors.push(new PropertyError('user', '"user" not found.'))
      }
    }

    if (!PropertyError.includes(errors, 'title', 'userId')) {
      const survey = await this.surveysRepository.findOpenByUserAndTitle(value.userId, value.title)
      if (survey) {
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
      throw new AppError('One or more properties are not valid.', { data: errors })
    }

    return value
  }

  private transform(dto: CreateSurveyDto): Survey {
    const survey = new Survey()
    survey.userId = dto.userId
    survey.title = dto.title
    survey.description = dto.description
    survey.type = dto.type
    survey.status = SurveyStatus.Draft
    survey.options = dto.options.map(option => new SurveyOption(option))
    return survey
  }
}
