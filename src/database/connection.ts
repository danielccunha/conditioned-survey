import { createConnection, getConnectionOptions } from 'typeorm'
import { SnakeNamingStrategy } from 'typeorm-naming-strategies'

async function connect() {
  const options = await getConnectionOptions()
  Object.assign(options, { namingStrategy: new SnakeNamingStrategy() })

  await createConnection(options)
}

connect()
