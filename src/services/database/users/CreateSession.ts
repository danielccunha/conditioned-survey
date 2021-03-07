import { inject, singleton } from 'tsyringe'

import Joi from '@hapi/joi'

import { User } from '../../../database/entities'
import { UsersRepository } from '../../../database/repositories'
import { AppError, PropertyError } from '../../../errors'
import { Hasher } from '../../cryptography/Hasher'
import { Encrypter } from './../../cryptography/Encrypter'

export interface CreateSessionDto {
  email: string
  password: string
}

const validator = Joi.object<CreateSessionDto>().keys({
  email: Joi.string().email().trim().lowercase().required(),
  password: Joi.string().trim().required()
})

@singleton()
export class CreateSession {
  constructor(
    private hasher: Hasher,
    private encrypter: Encrypter,

    @inject('UsersRepository')
    private repository: UsersRepository
  ) {}

  async execute(dto: CreateSessionDto): Promise<string> {
    const validatedDto = this.validate(dto)
    const foundUser = await this.compareCredentials(validatedDto)
    return await this.encrypter.encrypt({ id: foundUser.id })
  }

  private validate(dto: CreateSessionDto): CreateSessionDto {
    const { error, value } = validator.validate(dto, { abortEarly: false })
    const errors = PropertyError.fromValidationError(error)

    if (errors.length) {
      throw new AppError('One or more properties are not valid.', { data: errors })
    }

    return value
  }

  private async compareCredentials(dto: CreateSessionDto): Promise<User> {
    const foundUser = await this.repository.findByEmail(dto.email)

    if (!foundUser) {
      this.throwInvalidCredentials()
    }

    const samePassword = await this.hasher.compare(dto.password, foundUser.password)
    if (!samePassword) {
      this.throwInvalidCredentials()
    }

    return foundUser
  }

  private throwInvalidCredentials() {
    throw new AppError('Invalid credentials.', { statusCode: 401 })
  }
}
