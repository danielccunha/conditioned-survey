import { Survey, SurveyType, User } from '../../../database/entities'
import { SurveysRepository, UsersRepository } from '../../../database/repositories'
import { CreateSurvey, CreateSurveyDto } from './CreateSurvey'

const makeSurveysRepository = (): Partial<SurveysRepository> => {
  class SurveysRepositoryStub implements Partial<SurveysRepository> {
    async findOpenByUserAndTitle(): Promise<Survey> {
      return null
    }

    async create(survey: Survey): Promise<Survey> {
      return survey
    }
  }
  return new SurveysRepositoryStub()
}

const makeUsersRepository = (): Partial<UsersRepository> => {
  class UsersRepositoryStub implements Partial<UsersRepository> {
    async findById(): Promise<User> {
      return new User()
    }
  }
  return new UsersRepositoryStub()
}

const makeSut = () => {
  const surveysRepositoryStub = makeSurveysRepository()
  const usersRepositoryStub = makeUsersRepository()
  const sut = new CreateSurvey(
    surveysRepositoryStub as SurveysRepository,
    usersRepositoryStub as UsersRepository
  )
  return { sut, surveysRepositoryStub, usersRepositoryStub }
}

const makeValidDto = (): CreateSurveyDto => ({
  userId: '5273fd64-dbe0-4090-b651-0ef02be28be2',
  title: 'any_title',
  description: 'any_description',
  options: [],
  type: SurveyType.Boolean
})

describe('CreateSurvey', () => {
  test.each([
    [{ title: '' }],
    [{ title: undefined }],
    [{ title: new Array(65).fill('a').join('') }],
    [{ description: '' }],
    [{ description: undefined }],
    [{ description: new Array(2049).fill('a').join('') }],
    [{ userId: '' }],
    [{ userId: 'invalid_uuid' }],
    [{ userId: undefined }],
    [{ options: [''] }],
    [{ options: [undefined] }],
    [{ type: '' }],
    [{ type: 'A' }],
    [{ type: undefined }]
  ])('should throw when dto is invalid', async properties => {
    const { sut } = makeSut()
    const dto: any = { ...makeValidDto(), ...properties }
    const promise = sut.execute(dto)
    await expect(promise).rejects.toThrow()
  })

  test('should throw when user is not found', async () => {
    const { sut, usersRepositoryStub } = makeSut()
    jest.spyOn(usersRepositoryStub, 'findById').mockResolvedValueOnce(null)
    const promise = sut.execute(makeValidDto())
    await expect(promise).rejects.toThrow()
  })

  test('should throw when user already have an open survey with same title', async () => {
    const { sut, surveysRepositoryStub } = makeSut()
    jest.spyOn(surveysRepositoryStub, 'findOpenByUserAndTitle').mockResolvedValueOnce(new Survey())
    const promise = sut.execute(makeValidDto())
    await expect(promise).rejects.toThrow()
  })

  test.each([[], ['A'], ['A', 'A'], ['A', 'A', 'A']])(
    'should throw when type is list and options have less than two values',
    async (...options) => {
      const { sut } = makeSut()
      const dto: any = { ...makeValidDto(), type: 'L', options }
      const promise = sut.execute(dto)
      await expect(promise).rejects.toThrow()
    }
  )

  test('should create survey when properties are valid', async () => {
    const { sut, surveysRepositoryStub } = makeSut()
    const createSpy = jest.spyOn(surveysRepositoryStub, 'create')
    const createdSurvey = await sut.execute(makeValidDto())
    expect(createSpy).toHaveBeenCalledWith(createdSurvey)
  })
})
