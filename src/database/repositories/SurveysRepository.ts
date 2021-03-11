import omit from 'lodash/omit'
import { getRepository, Repository } from 'typeorm'

import { Survey, SurveyOption, SurveyType } from '../entities'

export interface SurveysRepository {
  findById(id: string): Promise<Survey>
  findOpenByUserAndTitle(userId: string, title: string): Promise<Survey>
  create(survey: Survey): Promise<Survey>
  update(survey: Survey): Promise<Survey>
}

export class SurveysRepositoryImpl implements SurveysRepository {
  private surveysRepo: Repository<Survey>
  private surveyOptionsRepo: Repository<SurveyOption>

  constructor() {
    this.surveysRepo = getRepository(Survey)
    this.surveyOptionsRepo = getRepository(SurveyOption)
  }

  findById(id: string): Promise<Survey> {
    return this.surveysRepo.findOne(id)
  }

  findOpenByUserAndTitle(userId: string, title: string): Promise<Survey> {
    return this.surveysRepo
      .createQueryBuilder()
      .where("user_id = :userId AND title = :title AND status != 'C'", { userId, title })
      .getOne()
  }

  async create(survey: Survey): Promise<Survey> {
    const createdSurvey = await this.surveysRepo.save(survey)
    survey.options.forEach(option => (option.surveyId = createdSurvey.id))
    createdSurvey.options = await this.surveyOptionsRepo.save(survey.options)
    return createdSurvey
  }

  async update(survey: Survey): Promise<Survey> {
    const { type: typeBefore } = await this.findById(survey.id)
    const updatedSurvey = await this.surveysRepo.save(omit(survey, 'options'))
    updatedSurvey.options = await this.surveyOptionsRepo.find({ surveyId: survey.id })

    // Remove survey options if changed type to boolean
    if (survey.type === SurveyType.Boolean && typeBefore === SurveyType.List) {
      await this.surveyOptionsRepo.delete({ surveyId: survey.id })
    } else if (survey.type === SurveyType.List) {
      // Verify if there was any change
      const existingOptions = updatedSurvey.options.map(option => option.option.toLowerCase())
      const didChange = survey.options.some(option => {
        return existingOptions.includes(option.option.toLowerCase())
      })

      // In case of change, for simplicity, remove everything and create again
      if (didChange) {
        await this.surveyOptionsRepo.delete({ surveyId: survey.id })
        survey.options.forEach(option => (option.surveyId = updatedSurvey.id))
        updatedSurvey.options = await this.surveyOptionsRepo.save(survey.options)
      }
    }

    return updatedSurvey
  }
}
