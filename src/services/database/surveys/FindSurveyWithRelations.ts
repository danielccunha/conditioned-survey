import { inject, singleton } from 'tsyringe'

import { Survey } from '../../../database/entities'
import { SurveysRepository } from '../../../database/repositories'
import { AppError } from '../../../errors'

@singleton()
export class FindSurveyWithRelations {
  constructor(
    @inject('SurveysRepository')
    private repository: SurveysRepository
  ) {}

  async execute(surveyId: string): Promise<Survey> {
    const survey = await this.repository.findByIdWithRelations(surveyId)

    if (!survey) {
      throw new AppError('Survey not found.', { statusCode: 404 })
    }

    return survey
  }
}
