import { Survey } from '../../../database/entities'
import { SurveysRepository } from '../../../database/repositories'
import { FindSurveyWithRelations } from './FindSurveyWithRelations'

const makeSurveysRepository = (): Partial<SurveysRepository> => {
  class SurveysRepositoryStub implements Partial<SurveysRepository> {
    async findByIdWithRelations(): Promise<Survey> {
      return new Survey()
    }
  }
  return new SurveysRepositoryStub()
}

const makeSut = () => {
  const repositoryStub = makeSurveysRepository()
  const sut = new FindSurveyWithRelations(repositoryStub as SurveysRepository)

  return { sut, repositoryStub }
}

describe('FindSurveyWithRelations', () => {
  test('should throw when survey is not found', async () => {
    const { sut, repositoryStub } = makeSut()
    jest.spyOn(repositoryStub, 'findByIdWithRelations').mockResolvedValueOnce(null)
    const promise = sut.execute('any_id')
    await expect(promise).rejects.toThrow()
  })

  test('should return survey when found', async () => {
    const { sut, repositoryStub } = makeSut()
    const findByIdWithRelationsSpy = jest.spyOn(repositoryStub, 'findByIdWithRelations')
    const survey = await sut.execute('any_id')
    expect(findByIdWithRelationsSpy).toHaveBeenCalledWith('any_id')
    expect(survey).toBeTruthy()
  })
})
