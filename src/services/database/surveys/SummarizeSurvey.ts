import { inject, singleton } from 'tsyringe'

import Joi from '@hapi/joi'

import {
  Survey,
  SurveyAnswer,
  SurveySpecification,
  SurveySpecificationType,
  SurveyStatus,
  SurveyType,
  User
} from '../../../database/entities'
import { SurveysRepository } from '../../../database/repositories'
import { AppError, PropertyError } from '../../../errors'

export interface SummarizeSurveyParams {
  surveyId: string
  userId: string
}

export interface OptionSummary {
  id?: string
  option: string
  total: number
  calculated: number
}

interface OptionSummaryMap {
  [key: string]: OptionSummary
}

export interface SurveySummary {
  id: string
  title: string
  results: OptionSummary[]
}

const validator = Joi.object<SummarizeSurveyParams>().keys({
  surveyId: Joi.string().trim().uuid().required(),
  userId: Joi.string().trim().uuid().required()
})

@singleton()
export class SummarizeSurvey {
  constructor(
    @inject('SurveysRepository')
    private repository: SurveysRepository
  ) {}

  async execute(params: SummarizeSurveyParams): Promise<SurveySummary> {
    const survey = await this.validate(params)
    const answers = await this.repository.findAnswers(params.surveyId)

    return {
      id: survey.id,
      title: survey.title,
      results: this.summarize(survey, answers)
    }
  }

  private async validate(params: SummarizeSurveyParams): Promise<Survey> {
    const { value, error } = validator.validate(params, { abortEarly: false })
    const errors = PropertyError.fromValidationError(error)
    let survey: Survey

    if (!PropertyError.includes(errors, 'surveyId')) {
      survey = await this.repository.findByIdWithRelations(value.surveyId)

      if (!survey) {
        throw new AppError('Survey not found.', { statusCode: 404 })
      } else if (!PropertyError.includes(errors, 'userId') && survey.userId !== value.userId) {
        throw new AppError("You don't have permission to manage this survey.", { statusCode: 403 })
      } else if (survey.status !== SurveyStatus.Closed) {
        errors.push(new PropertyError('surveyId', 'Survey is not closed.'))
      }
    }

    if (errors.length) {
      throw new AppError('One or more properties are invalid.', { data: errors })
    }

    return survey
  }

  private summarize(survey: Survey, answers: SurveyAnswer[]): OptionSummary[] {
    const summary: OptionSummaryMap = {}
    const [genderSpecs, ageSpecs] = this.splitSpecs(survey.specifications)
    const options = survey.options.reduce((map, option) => {
      return { ...map, [option.id]: option.option }
    }, {})

    for (const { value, user } of answers) {
      if (!summary[value]) {
        summary[value] = {
          id: survey.type === SurveyType.List ? value : undefined,
          option: options[value] || Boolean(value),
          total: 0,
          calculated: 0
        }
      }

      const weight = this.applyGenderSpecs(user, genderSpecs) * this.applyAgeSpecs(user, ageSpecs)
      summary[value].total++
      summary[value].calculated += 1 * weight
    }

    return Object.values(summary)
  }

  private splitSpecs(specs: SurveySpecification[]): [SurveySpecification[], SurveySpecification[]] {
    const genderSpecs = specs.filter(spec => {
      return spec.type === SurveySpecificationType.Gender
    })

    const ageSpecs = specs
      .filter(spec => spec.type === SurveySpecificationType.Age)
      .sort((a, b) => {
        return parseInt(a.value) > parseInt(b.value) ? 1 : -1
      })

    if (ageSpecs.length) {
      if (ageSpecs[0].value !== '0') {
        const spec: Partial<SurveySpecification> = { value: '0', weight: 0 }
        ageSpecs.unshift(spec as SurveySpecification)
      }

      if (ageSpecs[ageSpecs.length - 1].value !== '150') {
        const spec: Partial<SurveySpecification> = { value: '150', weight: 0 }
        ageSpecs.push(spec as SurveySpecification)
      }
    }

    return [genderSpecs, ageSpecs]
  }

  private applyGenderSpecs(user: User, specs: SurveySpecification[]): number {
    return specs.reduce((weight, spec) => {
      return spec.value === user.gender ? weight * spec.weight : weight
    }, 1)
  }

  private applyAgeSpecs(user: User, specs: SurveySpecification[]): number {
    if (!specs.length) {
      return 1
    }

    let specStart: SurveySpecification, specEnd: SurveySpecification
    for (let idx = 1; idx < specs.length; idx++) {
      if (user.age <= parseInt(specs[idx].value)) {
        specStart = specs[idx - 1]
        specEnd = specs[idx]
        break
      }
    }

    const valueStart = parseInt(specStart.value)
    const valueEnd = parseInt(specEnd.value)
    const percentageDist = (user.age - valueStart) / (valueEnd - valueStart)
    const weightDiff = specEnd.weight - specStart.weight
    const calcWeight = Math.min(specStart.weight, specEnd.weight) + weightDiff * percentageDist

    return Math.abs(calcWeight)
  }
}
