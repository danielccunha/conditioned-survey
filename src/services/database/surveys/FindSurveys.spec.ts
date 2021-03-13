import { Survey } from '../../../database/entities'
import { SurveysRepository } from '../../../database/repositories'
import { FindSurveys, FindSurveysParams } from './FindSurveys'

const makeSurveysRepository = (): Partial<SurveysRepository> => {
  class SurveysRepositoryStub implements Partial<SurveysRepository> {
    async find(): Promise<[Survey[], number]> {
      return [[], 0]
    }
  }
  return new SurveysRepositoryStub()
}

const makeSut = () => {
  const repositoryStub = makeSurveysRepository()
  const sut = new FindSurveys(repositoryStub as SurveysRepository)

  return { sut, repositoryStub }
}

const makeValidDto = (): FindSurveysParams => ({
  query: 'any_query',
  status: [],
  pagination: {
    page: 0,
    size: 10,
    skip: 0
  }
})

describe('FindSurveys', () => {
  test.each([
    [{ userId: 'invalid_id' }],
    [{ status: ['A'] }],
    [{ status: [undefined] }],
    [{ pagination: null }],
    [{ pagination: {} }],
    [{ pagination: { page: 0, size: -1 } }],
    [{ pagination: { page: -1, size: 0 } }]
  ])('should throw when dto is invalid', async properties => {
    const { sut } = makeSut()
    const dto: any = { ...makeValidDto(), ...properties }
    const promise = sut.execute(dto)
    await expect(promise).rejects.toThrow()
  })

  test('should call find when dto is valid', async () => {
    const { sut, repositoryStub } = makeSut()
    const findSpy = jest.spyOn(repositoryStub, 'find')
    await sut.execute(makeValidDto())
    expect(findSpy).toHaveBeenCalled()
  })
})
