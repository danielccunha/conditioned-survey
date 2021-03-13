import { Survey, SurveyStatus } from '../../../database/entities'
import { SurveysRepository } from '../../../database/repositories'
import { CloseSurvey, CloseSurveyParams } from './CloseSurvey'

const USER_ID = '5273fd64-dbe0-4090-b651-0ef02be28be2'
const SURVEY_ID = 'a974e16a-d34f-4d24-bad9-46ce14571e26'

const makeRepository = (): Partial<SurveysRepository> => {
  class SurveysRepositoryStub implements Partial<SurveysRepository> {
    async findById(): Promise<Survey> {
      const survey = new Survey()
      survey.id = SURVEY_ID
      survey.userId = USER_ID
      survey.status = SurveyStatus.Draft
      return survey
    }

    async close(survey: Survey): Promise<Survey> {
      return survey
    }
  }
  return new SurveysRepositoryStub()
}

const makeSut = () => {
  const repositoryStub = makeRepository()
  const sut = new CloseSurvey(repositoryStub as SurveysRepository)

  return { sut, repositoryStub }
}

const makeValidParams = (): CloseSurveyParams => ({
  surveyId: SURVEY_ID,
  userId: USER_ID
})

describe('CloseSurvey', () => {
  test.each([
    [{ surveyId: undefined }],
    [{ surveyId: '' }],
    [{ surveyId: 'invalid_id' }],
    [{ userId: undefined }],
    [{ userId: '' }],
    [{ userId: 'invalid_id' }]
  ])('should throw when params are invalid', async properties => {
    const { sut } = makeSut()
    const dto: any = { ...makeValidParams(), ...properties }
    const promise = sut.execute(dto)
    await expect(promise).rejects.toThrow()
  })

  test('should throw when survey is not found', async () => {
    const { sut, repositoryStub } = makeSut()
    jest.spyOn(repositoryStub, 'findById').mockResolvedValueOnce(null)
    const promise = sut.execute(makeValidParams())
    await expect(promise).rejects.toThrow()
  })

  test('should throw when user is not the owner of the survey', async () => {
    const { sut, repositoryStub } = makeSut()
    jest.spyOn(repositoryStub, 'findById').mockImplementationOnce(async () => {
      const survey = new Survey()
      survey.userId = 'any_id'
      return survey
    })
    const promise = sut.execute(makeValidParams())
    await expect(promise).rejects.toThrow()
  })

  test('should throw when survey was already closed', async () => {
    const { sut, repositoryStub } = makeSut()
    jest.spyOn(repositoryStub, 'findById').mockImplementationOnce(async () => {
      const survey = new Survey()
      survey.userId = USER_ID
      survey.status = SurveyStatus.Closed
      return survey
    })
    const promise = sut.execute(makeValidParams())
    await expect(promise).rejects.toThrow()
  })

  test('should close survey when params are valid', async () => {
    const { sut, repositoryStub } = makeSut()
    const closeSpy = jest.spyOn(repositoryStub, 'close')
    const survey = await sut.execute(makeValidParams())
    expect(closeSpy).toHaveBeenCalledWith(survey)
  })
})
