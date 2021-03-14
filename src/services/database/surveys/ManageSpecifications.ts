import { inject, singleton } from 'tsyringe'

import Joi from '@hapi/joi'

import {
  SurveySpecification,
  SurveySpecificationType,
  SurveyStatus
} from '../../../database/entities'
import { SurveysRepository } from '../../../database/repositories'
import { AppError, PropertyError } from '../../../errors'

export interface SpecificationDto {
  type: SurveySpecificationType
  value: string
  weight: number
}

export interface ManageSpecificationDto {
  surveyId: string
  userId: string
  specifications: SpecificationDto[]
}

const validator = Joi.object<ManageSpecificationDto>().keys({
  surveyId: Joi.string().trim().uuid().required(),
  userId: Joi.string().trim().uuid().required(),
  specifications: Joi.array()
    .items(
      Joi.object<SpecificationDto>().keys({
        type: Joi.string().trim().uppercase().valid('A', 'G').required(),
        value: Joi.string().trim().required(),
        weight: Joi.number().min(0).required()
      })
    )
    .default([])
})

@singleton()
export class ManageSpecification {
  constructor(
    @inject('SurveysRepository')
    private repository: SurveysRepository
  ) {}

  async execute(dto: ManageSpecificationDto): Promise<SurveySpecification[]> {
    const sanitizedDto = await this.validate(dto)
    const specs = this.transform(sanitizedDto)
    return await this.repository.storeSpecifications(sanitizedDto.surveyId, specs)
  }

  private async validate(dto: ManageSpecificationDto): Promise<ManageSpecificationDto> {
    const { value, error } = validator.validate(dto, { abortEarly: false })
    const errors = PropertyError.fromValidationError(error)

    if (!PropertyError.includes(errors, 'surveyId')) {
      const survey = await this.repository.findById(value.surveyId)

      if (!survey) {
        throw new AppError('Survey not found.', { statusCode: 404 })
      } else if (survey.userId !== value.userId) {
        throw new AppError("You don't have permission to manage this survey.", { statusCode: 403 })
      } else if (survey.status !== SurveyStatus.Draft) {
        errors.push(new PropertyError('surveyId', 'Survey was already published.'))
      } else if (!PropertyError.includes(errors, 'specifications')) {
        for (let idx = 0; idx < value.specifications.length; idx++) {
          const property = `specifications[${idx}]`
          const combined = 'value,type,weight'.split(',').map(attr => `${property}.${attr}`)

          if (!PropertyError.includes(errors, property, ...combined)) {
            const { type, value: rawValue }: SpecificationDto = value.specifications[idx]
            let valueError: string

            if (type === SurveySpecificationType.Gender) {
              const sanitizedValue = rawValue.trim().toUpperCase()
              if (sanitizedValue !== 'M' && sanitizedValue !== 'F') {
                valueError = 'Value must be M or F when type is gender.'
              }
            } else {
              const parsedValue = parseInt(rawValue)
              if (isNaN(parsedValue) || parsedValue < 0 || parsedValue > 150) {
                valueError = 'Value must be between 0 and 150 when type is age.'
              }
            }

            if (valueError) {
              errors.push(new PropertyError(`${property}.value`, valueError))
            }
          }
        }
      }
    }

    if (errors.length) {
      throw new AppError('One or more properties are invalid.', { data: errors })
    }

    return value
  }

  private transform(dto: ManageSpecificationDto): SurveySpecification[] {
    return dto.specifications.map(rawSpec => {
      const spec = new SurveySpecification()
      spec.surveyId = dto.surveyId
      spec.type = rawSpec.type
      spec.value = rawSpec.value
      spec.weight = rawSpec.weight
      return spec
    })
  }
}
