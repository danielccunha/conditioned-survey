import omit from 'lodash/omit'
import { getRepository, Repository } from 'typeorm'

import { Pagination } from '../../middleware/pagination'
import { Survey, SurveyOption, SurveyType, SurveyStatus } from '../entities'

interface FindParams {
  query: string
  userId?: string
  status: SurveyStatus[]
  pagination: Pagination
}

export interface SurveysRepository {
  find(params: FindParams): Promise<[Survey[], number]>
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

  async find(params: FindParams): Promise<[Survey[], number]> {
    const { userId, status, pagination } = params
    const query = this.surveysRepo.createQueryBuilder()

    if (userId) {
      query.where('user_id = :userId', { userId })
    }

    if (status.length) {
      query.andWhere('status IN (:...status)', { status })
    }

    let term = params.query?.trim()?.toLowerCase() || ''
    if (term) {
      term = `%${term}%`
      query.andWhere('normalized_title LIKE :term OR normalized_description LIKE :term', { term })
    }

    return await query
      .orderBy('created_at', 'DESC')
      .skip(pagination.skip)
      .take(pagination.size)
      .getManyAndCount()
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
    this.normalize(survey)
    const createdSurvey = await this.surveysRepo.save(survey)
    survey.options.forEach(option => (option.surveyId = createdSurvey.id))
    createdSurvey.options = await this.surveyOptionsRepo.save(survey.options)
    return createdSurvey
  }

  async update(survey: Survey): Promise<Survey> {
    this.normalize(survey)
    const { type: typeBefore } = await this.findById(survey.id)
    const updatedSurvey = await this.surveysRepo.save(omit(survey, 'options'))
    updatedSurvey.options = await this.surveyOptionsRepo.find({ surveyId: survey.id })

    // Remove survey options if changed type to boolean
    if (survey.type === SurveyType.Boolean && typeBefore === SurveyType.List) {
      await this.surveyOptionsRepo.delete({ surveyId: survey.id })
      updatedSurvey.options = []
    } else if (survey.type === SurveyType.List) {
      // Verify if there was any change
      const existingOptions = updatedSurvey.options.map(option => option.option.toLowerCase())
      const didChange =
        existingOptions.length !== survey.options.length ||
        survey.options.some(option => {
          return !existingOptions.includes(option.option.toLowerCase())
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

  private normalize(survey: Survey) {
    survey.normalizedTitle = survey.title.trim().toLowerCase()
    survey.normalizedDescription = survey.description.trim().toLowerCase()
  }
}
