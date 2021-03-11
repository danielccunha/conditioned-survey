import { Survey, SurveyType, User } from '../../../database/entities'
import { SurveysRepository, UsersRepository } from '../../../database/repositories'
import { SurveyStatus } from './../../../database/entities/Survey'
import { UpdateSurvey, UpdateSurveyDto } from './UpdateSurvey'

const USER_ID = '5273fd64-dbe0-4090-b651-0ef02be28be2'
const SURVEY_ID = 'a974e16a-d34f-4d24-bad9-46ce14571e26'

const makeSurveysRepository = (): Partial<SurveysRepository> => {
  class SurveysRepositoryStub implements Partial<SurveysRepository> {
    async findOpenByUserAndTitle(): Promise<Survey> {
      return null
    }

    async findById(): Promise<Survey> {
      const survey = new Survey()
      survey.id = SURVEY_ID
      survey.status = SurveyStatus.Draft
      survey.userId = USER_ID
      return survey
    }

    async update(survey: Survey): Promise<Survey> {
      return survey
    }
  }
  return new SurveysRepositoryStub()
}

const makeUsersRepository = (): Partial<UsersRepository> => {
  class UsersRepositoryStub implements Partial<UsersRepository> {
    async findById(): Promise<User> {
      const user = new User()
      user.id = USER_ID
      return user
    }
  }
  return new UsersRepositoryStub()
}

const makeSut = () => {
  const surveysRepositoryStub = makeSurveysRepository()
  const usersRepositoryStub = makeUsersRepository()
  const sut = new UpdateSurvey(
    surveysRepositoryStub as SurveysRepository,
    usersRepositoryStub as UsersRepository
  )

  return { sut, surveysRepositoryStub, usersRepositoryStub }
}

const makeValidDto = (): UpdateSurveyDto => ({
  surveyId: SURVEY_ID,
  userId: USER_ID,
  title: 'any_title',
  description: 'any_description',
  options: [],
  type: SurveyType.Boolean
})

describe('UpdateSurvey', () => {
  test.each([
    [{ title: '' }],
    [{ title: undefined }],
    [{ description: '' }],
    [{ description: undefined }],
    [{ surveyId: '' }],
    [{ surveyId: 'invalid_uuid' }],
    [{ surveyId: undefined }],
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

  test('should throw when survey is not found', async () => {
    const { sut, surveysRepositoryStub } = makeSut()
    jest.spyOn(surveysRepositoryStub, 'findById').mockResolvedValueOnce(null)
    const promise = sut.execute(makeValidDto())
    await expect(promise).rejects.toThrow()
  })

  test.each([[SurveyStatus.Closed], [SurveyStatus.Published]])(
    "should throw when survey isn't draft",
    async status => {
      const { sut, surveysRepositoryStub } = makeSut()
      jest.spyOn(surveysRepositoryStub, 'findById').mockImplementationOnce(async () => {
        const survey = new Survey()
        survey.status = status
        return survey
      })
      const promise = sut.execute(makeValidDto())
      await expect(promise).rejects.toThrow()
    }
  )

  test('should throw when user is not found', async () => {
    const { sut, usersRepositoryStub } = makeSut()
    jest.spyOn(usersRepositoryStub, 'findById').mockResolvedValueOnce(null)
    const promise = sut.execute(makeValidDto())
    await expect(promise).rejects.toThrow()
  })

  test('should throw when user is different from the owner', async () => {
    const { sut, usersRepositoryStub } = makeSut()
    jest.spyOn(usersRepositoryStub, 'findById').mockImplementationOnce(async () => {
      const user = new User()
      user.id = 'any_id'
      return user
    })
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

  test('should update survey when properties are valid', async () => {
    const { sut, surveysRepositoryStub } = makeSut()
    const updateSpy = jest.spyOn(surveysRepositoryStub, 'update')
    const updatedSurvey = await sut.execute(makeValidDto())
    expect(updateSpy).toHaveBeenCalledWith(updatedSurvey)
  })
})
