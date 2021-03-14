import {
  Gender,
  Survey,
  SurveyAnswer,
  SurveyOption,
  SurveySpecification,
  SurveySpecificationType,
  SurveyStatus,
  SurveyType,
  User
} from '../../../database/entities'
import { SurveysRepository } from '../../../database/repositories'
import { SummarizeSurvey, SummarizeSurveyParams } from './SummarizeSurvey'

const USER_ID = '5273fd64-dbe0-4090-b651-0ef02be28be2'
const SURVEY_ID = 'a974e16a-d34f-4d24-bad9-46ce14571e26'
const SPEC_WEIGHT = 2

const makeSpecification = (
  value: string,
  type: SurveySpecificationType,
  weight: number = SPEC_WEIGHT
) => {
  const spec = new SurveySpecification()
  spec.value = value
  spec.type = type
  spec.weight = weight
  return spec
}

const makeSurvey = () => {
  const survey = new Survey()
  survey.id = SURVEY_ID
  survey.userId = USER_ID
  survey.status = SurveyStatus.Closed
  survey.type = SurveyType.Boolean
  survey.options = []
  survey.specifications = [makeSpecification('F', SurveySpecificationType.Gender)]
  return survey
}

const makeUser = (gender: Gender, age: number) => {
  const currentYear = new Date().getFullYear()
  const user = new User()
  user.gender = gender
  user.birthday = new Date(currentYear - age, 0, 1)
  if (user.age > age) user.birthday.setFullYear(currentYear - age + 1)
  return user
}

const makeAnswer = (value: string, gender = Gender.Female, age = 40) => {
  const answer = new SurveyAnswer()
  answer.value = value
  answer.user = makeUser(gender, age)
  return answer
}

const makeOption = (id: string, option: string) => {
  const surveyOption = new SurveyOption(option)
  surveyOption.id = id
  surveyOption.surveyId = SURVEY_ID
  return surveyOption
}

const makeRepository = (): Partial<SurveysRepository> => {
  class SurveysRepositoryStub implements Partial<SurveysRepository> {
    async findByIdWithRelations(): Promise<Survey> {
      return makeSurvey()
    }

    async findAnswers(): Promise<SurveyAnswer[]> {
      return [makeAnswer('true', Gender.Female, 60)]
    }
  }
  return new SurveysRepositoryStub()
}

const makeSut = () => {
  const repositoryStub = makeRepository()
  const sut = new SummarizeSurvey(repositoryStub as SurveysRepository)

  return { sut, repositoryStub }
}

const makeParams = (): SummarizeSurveyParams => ({
  surveyId: SURVEY_ID,
  userId: USER_ID
})

describe('SummarizeSurvey', () => {
  test.each([
    [{ surveyId: '' }],
    [{ surveyId: 'invalid_uuid' }],
    [{ surveyId: undefined }],
    [{ userId: '' }],
    [{ userId: 'invalid_uuid' }],
    [{ userId: undefined }]
  ])('should throw when params are invalid', async properties => {
    const { sut } = makeSut()
    const dto: any = { ...makeParams(), ...properties }
    const promise = sut.execute(dto)
    await expect(promise).rejects.toThrow()
  })

  test('should throw when survey is not found', async () => {
    const { sut, repositoryStub } = makeSut()
    jest.spyOn(repositoryStub, 'findByIdWithRelations').mockResolvedValueOnce(null)
    const promise = sut.execute(makeParams())
    await expect(promise).rejects.toThrow()
  })

  test('should throw when user is not the owner of the survey', async () => {
    const { sut, repositoryStub } = makeSut()
    jest.spyOn(repositoryStub, 'findByIdWithRelations').mockImplementationOnce(async () => {
      const survey = makeSurvey()
      survey.userId = 'any_id'
      return survey
    })
    const promise = sut.execute(makeParams())
    await expect(promise).rejects.toThrow()
  })

  test.each([[SurveyStatus.Draft], [SurveyStatus.Published]])(
    'should throw when survey is not closed',
    async status => {
      const { sut, repositoryStub } = makeSut()
      jest.spyOn(repositoryStub, 'findByIdWithRelations').mockImplementationOnce(async () => {
        const survey = makeSurvey()
        survey.status = status
        return survey
      })
      const promise = sut.execute(makeParams())
      await expect(promise).rejects.toThrow()
    }
  )

  test('should apply gender spec when match condition', async () => {
    const { sut } = makeSut()
    const summary = await sut.execute(makeParams())
    expect(summary.results[0].calculated).toBe(SPEC_WEIGHT)
  })

  test('should apply age spec when match condition', async () => {
    const { sut, repositoryStub } = makeSut()
    jest.spyOn(repositoryStub, 'findByIdWithRelations').mockImplementationOnce(async () => {
      const survey = makeSurvey()
      survey.specifications = [
        makeSpecification('100', SurveySpecificationType.Age),
        makeSpecification('80', SurveySpecificationType.Age),
        makeSpecification('90', SurveySpecificationType.Age)
      ]
      return survey
    })
    const summary = await sut.execute(makeParams())
    expect(summary.results[0].calculated).toBe(SPEC_WEIGHT * 0.75)
  })

  test('should include option id when survey type is list', async () => {
    const { sut, repositoryStub } = makeSut()
    jest.spyOn(repositoryStub, 'findByIdWithRelations').mockImplementationOnce(async () => {
      const survey = makeSurvey()
      survey.type = SurveyType.List
      survey.options = [makeOption('any_id', 'any_value')]
      return survey
    })
    jest.spyOn(repositoryStub, 'findAnswers').mockResolvedValueOnce([makeAnswer('any_id')])
    const summary = await sut.execute(makeParams())
    expect(summary.results[0].id).toBeTruthy()
  })

  test("should ignore specification when gender doesn't match", async () => {
    const { sut, repositoryStub } = makeSut()
    jest
      .spyOn(repositoryStub, 'findAnswers')
      .mockResolvedValueOnce([makeAnswer('true', Gender.Male)])
    const summary = await sut.execute(makeParams())
    expect(summary.results[0].calculated).toBe(1)
  })
})
