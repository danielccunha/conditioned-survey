import { Router } from 'express'

import sessionsRouter from './sessions.routes'
import surveysRouter from './surveys.routes'
import usersRouter from './users.routes'

const routes = Router()
routes.use('/sessions', sessionsRouter)
routes.use('/surveys', surveysRouter)
routes.use('/users', usersRouter)

export { routes }
