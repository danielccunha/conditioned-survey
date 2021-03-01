import { config } from 'dotenv'
import { resolve } from 'path'

import 'reflect-metadata'

const path = resolve(__dirname, '.env.test')
config({ path })
