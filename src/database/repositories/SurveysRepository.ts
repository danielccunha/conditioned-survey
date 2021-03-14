import omit from 'lodash/omit'
import { getRepository, Repository } from 'typeorm'

import { Pagination } from '../../middleware/pagination'
import { Survey, SurveyOption, SurveyType, SurveyStatus, SurveyAnswer } from '../entities'
import { SurveySpecification } from './../entities/SurveySpecification'

interface FindParams {
  query: string
  userId?: string
  status: SurveyStatus[]
  pagination: Pagination
}

export interface SurveysRepository {
  close(survey: Survey): Promise<Survey>
  find(params: FindParams): Promise<[Survey[], number]>
  findById(id: string): Promise<Survey>
  findByIdWithRelations(id: string): Promise<Survey>
  findOpenByUserAndTitle(userId: string, title: string): Promise<Survey>
  findAnswerByUserANdSurvey(userId: string, surveyId: string): Promise<SurveyAnswer>
  findAnswers(surveyId: string): Promise<SurveyAnswer[]>
  create(survey: Survey): Promise<Survey>
  update(survey: Survey): Promise<Survey>
  publish(survey: Survey): Promise<Survey>
  storeAnswer(answer: SurveyAnswer): Promise<SurveyAnswer>
  storeSpecifications(
    surveyId: string,
    specs: SurveySpecification[]
  ): Promise<SurveySpecification[]>
}

export class SurveysRepositoryImpl implements SurveysRepository {
  private surveysRepo: Repository<Survey>
  private optionsRepo: Repository<SurveyOption>
  private specsRepo: Repository<SurveySpecification>
  private answersRepo: Repository<SurveyAnswer>

  constructor() {
    this.surveysRepo = getRepository(Survey)
    this.optionsRepo = getRepository(SurveyOption)
    this.specsRepo = getRepository(SurveySpecification)
    this.answersRepo = getRepository(SurveyAnswer)
  }

  async close(survey: Survey): Promise<Survey> {
    survey.status = SurveyStatus.Closed
    const updatedSurvey = await this.surveysRepo.save(survey)

    return updatedSurvey
  }

  async publish(survey: Survey): Promise<Survey> {
    survey.status = SurveyStatus.Published
    const updatedSurvey = await this.surveysRepo.save(survey)

    return updatedSurvey
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

  findByIdWithRelations(id: string): Promise<Survey> {
    return this.surveysRepo.findOne(id, {
      relations: ['options', 'specifications']
    })
  }

  findOpenByUserAndTitle(userId: string, title: string): Promise<Survey> {
    return this.surveysRepo
      .createQueryBuilder()
      .where("user_id = :userId AND title = :title AND status != 'C'", { userId, title })
      .getOne()
  }

  findAnswerByUserANdSurvey(userId: string, surveyId: string): Promise<SurveyAnswer> {
    return this.answersRepo.findOne({ where: { userId, surveyId } })
  }

  findAnswers(surveyId: string): Promise<SurveyAnswer[]> {
    return this.answersRepo.find({ where: { surveyId }, relations: ['user'] })
  }

  async create(survey: Survey): Promise<Survey> {
    this.normalize(survey)
    const createdSurvey = await this.surveysRepo.save(survey)
    survey.options.forEach(option => (option.surveyId = createdSurvey.id))
    createdSurvey.options = await this.optionsRepo.save(survey.options)
    return createdSurvey
  }

  async update(survey: Survey): Promise<Survey> {
    this.normalize(survey)
    const { type: typeBefore } = await this.findById(survey.id)
    const updatedSurvey = await this.surveysRepo.save(omit(survey, 'options'))
    updatedSurvey.options = await this.optionsRepo.find({ surveyId: survey.id })

    // Remove survey options if changed type to boolean
    if (survey.type === SurveyType.Boolean && typeBefore === SurveyType.List) {
      await this.optionsRepo.delete({ surveyId: survey.id })
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
        await this.optionsRepo.delete({ surveyId: survey.id })
        survey.options.forEach(option => (option.surveyId = updatedSurvey.id))
        updatedSurvey.options = await this.optionsRepo.save(survey.options)
      }
    }

    return updatedSurvey
  }

  private normalize(survey: Survey) {
    survey.normalizedTitle = survey.title.trim().toLowerCase()
    survey.normalizedDescription = survey.description.trim().toLowerCase()
  }

  storeAnswer(answer: SurveyAnswer): Promise<SurveyAnswer> {
    return this.answersRepo.save(answer)
  }

  async storeSpecifications(
    surveyId: string,
    specs: SurveySpecification[]
  ): Promise<SurveySpecification[]> {
    await this.specsRepo.delete({ surveyId })
    return await this.specsRepo.save(specs)
  }
}
