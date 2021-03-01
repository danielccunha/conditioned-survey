import { getRepository, Repository } from 'typeorm'

import { User } from '../entities/User'

export interface UsersRepository {
  findByEmail(email: string): Promise<User>
  store(user: User): Promise<User>
}

export class UsersRepositoryImpl implements UsersRepository {
  private repository: Repository<User>

  constructor() {
    this.repository = getRepository(User)
  }

  findByEmail(email: string): Promise<User> {
    return this.repository.findOne({ where: { email } })
  }

  store(user: User): Promise<User> {
    return this.repository.save(user)
  }
}
