import { Router } from 'express'

import { SurveysController } from '../controllers/SurveysController'
import { auth, pagination } from '../middleware'

const routes = Router()
const controller = new SurveysController()

routes.get('/', auth, pagination, controller.index)
routes.get('/open', pagination, controller.open)
routes.get('/:id', controller.show)
routes.post('/', auth, controller.create)
routes.put('/:id', auth, controller.update)
routes.put('/:id/specifications', auth, controller.specifications)
routes.patch('/:id/publish', auth, controller.publish)
routes.patch('/:id/close', auth, controller.close)

export default routes
