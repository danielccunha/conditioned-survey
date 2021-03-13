import { Survey, SurveyAnswer, SurveyStatus, SurveyType, User } from '../../../database/entities'
import { SurveysRepository, UsersRepository } from '../../../database/repositories'
import { CreateAnswer, CreateAnswerDto } from './CreateAnswer'

const USER_ID = '5273fd64-dbe0-4090-b651-0ef02be28be2'
const SURVEY_ID = 'a974e16a-d34f-4d24-bad9-46ce14571e26'

const makeSurveysRepository = (): Partial<SurveysRepository> => {
  class SurveysRepositoryStub implements Partial<SurveysRepository> {
    async findByIdWithRelations(): Promise<Survey> {
      const survey = new Survey()
      survey.type = SurveyType.Boolean
      survey.status = SurveyStatus.Published
      return survey
    }

    async findAnswerByUserANdSurvey(): Promise<SurveyAnswer> {
      return null
    }

    async storeAnswer(answer: SurveyAnswer): Promise<SurveyAnswer> {
      return answer
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
  const sut = new CreateAnswer(
    surveysRepositoryStub as SurveysRepository,
    usersRepositoryStub as UsersRepository
  )
  return { sut, surveysRepositoryStub, usersRepositoryStub }
}

const makeDto = (): CreateAnswerDto => ({
  userId: USER_ID,
  surveyId: SURVEY_ID,
  value: 'false'
})

describe('CreateAnswer', () => {
  test.each([
    [{ userId: undefined }],
    [{ userId: '' }],
    [{ userId: 'invalid_id' }],
    [{ surveyId: undefined }],
    [{ surveyId: '' }],
    [{ surveyId: 'invalid_id' }],
    [{ value: '' }],
    [{ value: undefined }]
  ])('should throw when dto is invalid', async properties => {
    const { sut } = makeSut()
    const dto: any = { ...makeDto(), ...properties }
    const promise = sut.execute(dto)
    await expect(promise).rejects.toThrow()
  })

  test('should throw when survey is not found', async () => {
    const { sut, surveysRepositoryStub } = makeSut()
    jest.spyOn(surveysRepositoryStub, 'findByIdWithRelations').mockResolvedValueOnce(null)
    const promise = sut.execute(makeDto())
    await expect(promise).rejects.toThrow()
  })

  test.each([[SurveyStatus.Draft], [SurveyStatus.Closed]])(
    'should throw when survey is not published',
    async status => {
      const { sut, surveysRepositoryStub } = makeSut()
      jest
        .spyOn(surveysRepositoryStub, 'findByIdWithRelations')
        .mockImplementationOnce(async () => {
          const survey = new Survey()
          survey.status = status
          return survey
        })
      const promise = sut.execute(makeDto())
      await expect(promise).rejects.toThrow()
    }
  )

  test.each([[false], ['any'], [1]])(
    'should throw when type is boolean and value is invalid',
    async value => {
      const { sut } = makeSut()
      const dto: any = { ...makeDto(), value }
      const promise = sut.execute(dto)
      await expect(promise).rejects.toThrow()
    }
  )

  test('should throw when option is not found', async () => {
    const { sut, surveysRepositoryStub } = makeSut()
    jest.spyOn(surveysRepositoryStub, 'findByIdWithRelations').mockImplementationOnce(async () => {
      const survey = new Survey()
      survey.type = SurveyType.List
      survey.status = SurveyStatus.Published
      survey.options = []
      return survey
    })
    const promise = sut.execute(makeDto())
    await expect(promise).rejects.toThrow()
  })

  test('should throw when user is not found', async () => {
    const { sut, usersRepositoryStub } = makeSut()
    jest.spyOn(usersRepositoryStub, 'findById').mockResolvedValueOnce(null)
    const promise = sut.execute(makeDto())
    await expect(promise).rejects.toThrow()
  })

  test('should throw when user already answered the survey', async () => {
    const { sut, surveysRepositoryStub } = makeSut()
    jest
      .spyOn(surveysRepositoryStub, 'findAnswerByUserANdSurvey')
      .mockResolvedValueOnce(new SurveyAnswer())
    const promise = sut.execute(makeDto())
    await expect(promise).rejects.toThrow()
  })

  test('should store survey answer on success', async () => {
    const { sut, surveysRepositoryStub } = makeSut()
    const storeAnswerSpy = jest.spyOn(surveysRepositoryStub, 'storeAnswer')
    const answer = await sut.execute(makeDto())
    expect(storeAnswerSpy).toHaveBeenCalledWith(answer)
  })
})
