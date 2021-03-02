import { inject, singleton } from 'tsyringe'

import Joi from '@hapi/joi'

import { User, Gender } from '../../../database/entities'
import { AppError, PropertyError } from '../../../errors'
import { Hasher } from '../../cryptography/Hasher'
import { UsersRepository } from './../../../database/repositories/UsersRepository'

export interface CreateUserDto {
  email: string
  password: string
  gender: Gender
  birthday: Date
}

const validator = Joi.object<CreateUserDto>().keys({
  email: Joi.string().email().trim().lowercase().required(),
  password: Joi.string().min(8).max(64).trim().required(),
  gender: Joi.string().trim().uppercase().valid('M', 'F').required(),
  birthday: Joi.date().min(1900).max('now').required()
})

@singleton()
export class CreateUser {
  constructor(
    private hasher: Hasher,

    @inject('UsersRepository')
    private repository: UsersRepository
  ) {}

  async execute(dto: CreateUserDto): Promise<User> {
    const validatedDto = await this.validate(dto)
    const transformedUser = await this.transform(validatedDto)
    return await this.repository.store(transformedUser)
  }

  private async validate(dto: CreateUserDto): Promise<CreateUserDto> {
    const { error, value } = validator.validate(dto, { abortEarly: false })
    const errors = PropertyError.fromValidationError(error)

    if (!PropertyError.includes(errors, 'email')) {
      const user = await this.repository.findByEmail(value.email)
      if (user) {
        errors.push(new PropertyError('email', '"email" is already taken.'))
      }
    }

    if (errors.length) {
      throw new AppError('One or more properties are not valid.', { data: errors })
    }

    return value
  }

  private async transform(dto: CreateUserDto): Promise<User> {
    const user = new User()
    user.email = dto.email
    user.password = await this.hasher.hash(dto.password)
    user.gender = dto.gender
    user.birthday = dto.birthday

    return user
  }
}
