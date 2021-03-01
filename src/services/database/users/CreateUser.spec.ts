import { Gender, User } from '../../../database/entities'
import { UsersRepository } from '../../../database/repositories/UsersRepository'
import { Hasher } from '../../cryptography/Hasher'
import { CreateUser, CreateUserDto } from './CreateUser'

const makeHasher = (): Partial<Hasher> => {
  class HasherStub implements Partial<Hasher> {
    async hash(): Promise<string> {
      return 'hashed_value'
    }
  }

  return new HasherStub()
}

const makeRepository = (): Partial<UsersRepository> => {
  class UsersRepositoryStub implements Partial<UsersRepository> {
    async findByEmail(): Promise<User> {
      return null
    }

    async store(user: User): Promise<User> {
      return user
    }
  }

  return new UsersRepositoryStub()
}

const makeSut = () => {
  const hasherStub = makeHasher()
  const repositoryStub = makeRepository()
  const sut = new CreateUser(hasherStub as Hasher, repositoryStub as UsersRepository)
  return { sut, hasherStub, repositoryStub }
}

const makeValidDto = (): CreateUserDto => {
  return {
    email: 'valid@mail.com',
    password: '12345678',
    gender: Gender.Male,
    birthday: new Date(2000, 1)
  }
}

describe('CreateUser', () => {
  test.each([
    [{ email: '' }],
    [{ email: 'invalid_email' }],
    [{ password: '' }],
    [{ password: 'small' }],
    [{ password: new Array(80).fill('a', 0, 80).join('') }],
    [{ gender: '' }],
    [{ gender: 'A' }],
    [{ birthday: null }],
    [{ birthday: new Date(2100, 1) }]
  ])('should throw an error when dto is invalid', async properties => {
    const { sut } = makeSut()
    const dto: any = { ...makeValidDto(), ...properties }
    const promise = sut.execute(dto)
    await expect(promise).rejects.toThrow()
  })

  test('should throw an error when email is already taken', async () => {
    const { sut, repositoryStub } = makeSut()
    jest.spyOn(repositoryStub, 'findByEmail').mockResolvedValueOnce(new User())
    const promise = sut.execute(makeValidDto())
    await expect(promise).rejects.toThrow()
  })

  test('should hash password using Hasher', async () => {
    const { sut, hasherStub } = makeSut()
    const hashSpy = jest.spyOn(hasherStub, 'hash')
    const dto = makeValidDto()
    await sut.execute(dto)
    expect(hashSpy).toHaveBeenCalledWith(dto.password)
  })

  test('should store user when properties are valid', async () => {
    const { sut, repositoryStub } = makeSut()
    const storeSpy = jest.spyOn(repositoryStub, 'store')
    const user = await sut.execute(makeValidDto())
    expect(storeSpy).toHaveBeenCalledWith(user)
  })
})
