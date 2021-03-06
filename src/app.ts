import 'reflect-metadata'
import 'dotenv/config'

import cors from 'cors'
import express from 'express'
import helmet from 'helmet'
import 'express-async-errors'

import './config/container'
import './database/connection'
import { logger, errorHandler } from './middleware'
import { routes } from './routes'

const app = express()
app.use(helmet())
app.use(cors())
app.use(logger())
app.use(express.json())
app.use('/', routes)
app.use(errorHandler)

export default app
