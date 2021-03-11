import { Router } from 'express'

import { SurveysController } from '../controllers/SurveysController'
import { auth } from '../middleware'

const routes = Router()
const controller = new SurveysController()

routes.post('/', auth, controller.create)
routes.put('/:id', auth, controller.update)

export default routes
