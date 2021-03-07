import { container } from 'tsyringe'

import {
  SurveysRepository,
  SurveysRepositoryImpl
} from '../database/repositories/SurveysRepository'
import { UsersRepository, UsersRepositoryImpl } from '../database/repositories/UsersRepository'

container.registerSingleton<SurveysRepository>('SurveysRepository', SurveysRepositoryImpl)
container.registerSingleton<UsersRepository>('UsersRepository', UsersRepositoryImpl)
