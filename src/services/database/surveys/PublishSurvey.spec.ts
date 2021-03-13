import { Survey, SurveyStatus } from '../../../database/entities'
import { SurveysRepository } from '../../../database/repositories'
import { PublishSurvey, PublishSurveyParams } from './PublishSurvey'

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

    async publish(survey: Survey): Promise<Survey> {
      return survey
    }
  }
  return new SurveysRepositoryStub()
}

const makeSut = () => {
  const repositoryStub = makeRepository()
  const sut = new PublishSurvey(repositoryStub as SurveysRepository)

  return { sut, repositoryStub }
}

const makeValidParams = (): PublishSurveyParams => ({
  surveyId: SURVEY_ID,
  userId: USER_ID
})

describe('PublishSurvey', () => {
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

  test.each([[SurveyStatus.Published], [SurveyStatus.Closed]])(
    'should throw when survey was already published',
    async status => {
      const { sut, repositoryStub } = makeSut()
      jest.spyOn(repositoryStub, 'findById').mockImplementationOnce(async () => {
        const survey = new Survey()
        survey.userId = USER_ID
        survey.status = status
        return survey
      })
      const promise = sut.execute(makeValidParams())
      await expect(promise).rejects.toThrow()
    }
  )

  test('should publish survey when params are valid', async () => {
    const { sut, repositoryStub } = makeSut()
    const publishSpy = jest.spyOn(repositoryStub, 'publish')
    const survey = await sut.execute(makeValidParams())
    expect(publishSpy).toHaveBeenCalledWith(survey)
  })
})
