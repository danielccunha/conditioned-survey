import {
  Survey,
  SurveyStatus,
  SurveySpecification,
  SurveySpecificationType
} from '../../../database/entities'
import { SurveysRepository } from '../../../database/repositories'
import {
  ManageSpecification,
  ManageSpecificationDto,
  SpecificationDto
} from './ManageSpecifications'

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

    async storeSpecifications(_surveyId: string, specs: SurveySpecification[]) {
      return specs
    }
  }
  return new SurveysRepositoryStub()
}

const makeSut = () => {
  const repositoryStub = makeRepository()
  const sut = new ManageSpecification(repositoryStub as SurveysRepository)

  return { sut, repositoryStub }
}

const makeSpec = (): SpecificationDto => ({
  type: SurveySpecificationType.Age,
  value: '40',
  weight: 2
})

const makeDto = (): ManageSpecificationDto => ({
  userId: USER_ID,
  surveyId: SURVEY_ID,
  specifications: [makeSpec()]
})

describe('ManageSpecification', () => {
  test.each([
    [{ surveyId: undefined }],
    [{ surveyId: '' }],
    [{ surveyId: 'invalid_id' }],
    [{ userId: undefined }],
    [{ userId: '' }],
    [{ userId: 'invalid_id' }],
    [{ specifications: [{ ...makeSpec(), type: 'C' }] }],
    [{ specifications: [{ ...makeSpec(), type: undefined }] }],
    [{ specifications: [{ ...makeSpec(), type: null }] }],
    [{ specifications: [{ ...makeSpec(), value: undefined }] }],
    [{ specifications: [{ ...makeSpec(), value: null }] }],
    [{ specifications: [{ ...makeSpec(), weight: 'C' }] }],
    [{ specifications: [{ ...makeSpec(), weight: -1 }] }],
    [{ specifications: [{ ...makeSpec(), weight: undefined }] }],
    [{ specifications: [{ ...makeSpec(), weight: null }] }]
  ])('should throw when dto is invalid', async properties => {
    const { sut } = makeSut()
    const dto: any = { ...makeDto(), ...properties }
    const promise = sut.execute(dto)
    await expect(promise).rejects.toThrow()
  })

  test('should throw when survey is not found', async () => {
    const { sut, repositoryStub } = makeSut()
    jest.spyOn(repositoryStub, 'findById').mockResolvedValueOnce(null)
    const promise = sut.execute(makeDto())
    await expect(promise).rejects.toThrow()
  })

  test('should throw when user is not the owner of the survey', async () => {
    const { sut, repositoryStub } = makeSut()
    jest.spyOn(repositoryStub, 'findById').mockImplementationOnce(async () => {
      const survey = new Survey()
      survey.userId = 'any_id'
      return survey
    })
    const promise = sut.execute(makeDto())
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
      const promise = sut.execute(makeDto())
      await expect(promise).rejects.toThrow()
    }
  )

  test('should throw when gender is not valid', async () => {
    const { sut } = makeSut()
    const spec = { type: SurveySpecificationType.Gender, value: 'A', weight: 1 }
    const promise = sut.execute({ ...makeDto(), specifications: [spec] })
    await expect(promise).rejects.toThrow()
  })

  test.each([['-1'], ['151']])("should throw when age isn't between 0 and 150", async value => {
    const { sut } = makeSut()
    const spec = { type: SurveySpecificationType.Age, value, weight: 1 }
    const promise = sut.execute({ ...makeDto(), specifications: [spec] })
    await expect(promise).rejects.toThrow()
  })

  test('should store specifications when dto is valid', async () => {
    const { sut, repositoryStub } = makeSut()
    const storeSpecificationsSpy = jest.spyOn(repositoryStub, 'storeSpecifications')
    const specs = await sut.execute(makeDto())
    expect(storeSpecificationsSpy).toHaveBeenCalledWith(SURVEY_ID, specs)
  })
})
