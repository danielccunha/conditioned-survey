import { Router } from 'express'

import { SessionsController } from '../controllers/SessionsController'

const routes = Router()
const controller = new SessionsController()

routes.post('/', controller.create)

export default routes
