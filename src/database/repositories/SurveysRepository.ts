import { Survey } from '../entities'

export interface SurveysRepository {
  findOpenByUserAndTitle(userId: string, title: string): Promise<Survey>
  create(survey: Survey): Promise<Survey>
}
