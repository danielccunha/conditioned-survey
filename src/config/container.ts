import { container } from 'tsyringe'

import { UsersRepository, UsersRepositoryImpl } from '../database/repositories/UsersRepository'

container.registerSingleton<UsersRepository>('UsersRepository', UsersRepositoryImpl)
