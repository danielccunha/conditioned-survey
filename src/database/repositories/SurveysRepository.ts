import { getRepository, Repository } from 'typeorm'

import { Survey, SurveyOption } from '../entities'

export interface SurveysRepository {
  findOpenByUserAndTitle(userId: string, title: string): Promise<Survey>
  create(survey: Survey): Promise<Survey>
}

export class SurveysRepositoryImpl implements SurveysRepository {
  private surveysRepo: Repository<Survey>
  private surveyOptionsRepo: Repository<SurveyOption>

  constructor() {
    this.surveysRepo = getRepository(Survey)
    this.surveyOptionsRepo = getRepository(SurveyOption)
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
}
