import { User } from '../../../database/entities'
import { UsersRepository } from '../../../database/repositories'
import { Encrypter } from '../../cryptography/Encrypter'
import { Hasher } from '../../cryptography/Hasher'
import { CreateSession, CreateSessionDto } from './CreateSession'

const makeHasher = (): Partial<Hasher> => {
  class HasherStub implements Partial<Hasher> {
    async compare(): Promise<boolean> {
      return true
    }
  }

  return new HasherStub()
}

const makeEncrypter = (): Partial<Encrypter> => {
  class EncrypterStub implements Partial<Encrypter> {
    async encrypt(): Promise<string> {
      return 'any_token'
    }
  }

  return new EncrypterStub()
}

const makeRepository = (): Partial<UsersRepository> => {
  class UsersRepositoryStub implements Partial<UsersRepository> {
    async findByEmail(): Promise<User> {
      const user = new User()
      user.id = 'any_id'
      user.password = 'hashed_password'
      return user
    }
  }

  return new UsersRepositoryStub()
}

const makeSut = () => {
  const hasherStub = makeHasher()
  const encrypterStub = makeEncrypter()
  const repositoryStub = makeRepository()
  const sut = new CreateSession(
    hasherStub as Hasher,
    encrypterStub as Encrypter,
    repositoryStub as UsersRepository
  )

  return { sut, hasherStub, encrypterStub, repositoryStub }
}

const makeValidDto = (): CreateSessionDto => ({
  email: 'any@email.com',
  password: 'any_password'
})

describe('CreateSession', () => {
  test.each([[{ email: '' }], [{ email: 'invalid_email' }], [{ password: '' }]])(
    'should throw an error when dto is invalid',
    async properties => {
      const { sut } = makeSut()
      const dto: any = { ...makeValidDto(), ...properties }
      const promise = sut.execute(dto)
      await expect(promise).rejects.toThrow()
    }
  )

  test('should search user by its email using repository', async () => {
    const { sut, repositoryStub } = makeSut()
    const findByEmailSpy = jest.spyOn(repositoryStub, 'findByEmail')
    const dto = makeValidDto()
    await sut.execute(dto)
    expect(findByEmailSpy).toHaveBeenCalledWith(dto.email)
  })

  test('should throw an error when user is not found', async () => {
    const { sut, repositoryStub } = makeSut()
    jest.spyOn(repositoryStub, 'findByEmail').mockResolvedValueOnce(null)
    const promise = sut.execute(makeValidDto())
    await expect(promise).rejects.toThrow()
  })

  test('should compare password using hasher', async () => {
    const { sut, hasherStub } = makeSut()
    const compareSpy = jest.spyOn(hasherStub, 'compare')
    const dto = makeValidDto()
    await sut.execute(dto)
    expect(compareSpy).toHaveBeenCalledWith(dto.password, 'hashed_password')
  })

  test('should throw an error when password is invalid', async () => {
    const { sut, hasherStub } = makeSut()
    jest.spyOn(hasherStub, 'compare').mockResolvedValueOnce(false)
    const promise = sut.execute(makeValidDto())
    await expect(promise).rejects.toThrow()
  })

  test('should encrypt user using encrypter', async () => {
    const { sut, encrypterStub } = makeSut()
    const encryptSpy = jest.spyOn(encrypterStub, 'encrypt')
    await sut.execute(makeValidDto())
    expect(encryptSpy).toHaveBeenCalledWith({ id: 'any_id' })
  })

  test('should return token properties are valid', async () => {
    const { sut } = makeSut()
    const token = await sut.execute(makeValidDto())
    expect(token).toBe('any_token')
  })
})
