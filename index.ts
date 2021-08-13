import express from 'express'
import * as OpenApiValidator from 'express-openapi-validator'
import logger from 'morgan'
import cors from 'cors'
import { Sonolus } from 'sonolus-express'
import { initLevelsDatabase, initUsersDatabase } from './potato/reader'
import { installUploadEndpoints } from './potato/upload'
import { installStaticEndpoints } from './potato/static'
import { installLevelsEndpoints } from './potato/levels'
import { installTestsEndpoints } from './potato/tests'
import { installUsersEndpoints } from './potato/users'
import { config } from './config'

/*
 * Sonolus-uploader-core-2 Main class
 *
 * Startup sonolus server and listen for uploads.
 * This app uses port 3000.
*/

const app = express()

// Add logger
app.use(logger('tiny'))

// Add CORS support
app.use(cors({
  origin: ['https://potato.purplepalette.net', 'http://localhost:8080'],
  optionsSuccessStatus: 200
}))

// Add validator
app.use(
  OpenApiValidator.middleware({
    apiSpec: './api.yaml',
    validateRequests: { removeAdditional: 'all' }
  }),
)
app.use((
  err: { status?: number, errors?: string, message?: string },
  req: express.Request, res: express.Response, next: express.NextFunction
) => {
  // console.log(err)
  res.status(err.status || 500).json({
    message: err.message,
    errors: err.errors,
  })
})

// Install sonolus-express
const potato = new Sonolus(app, config.sonolusOptions)
// Load database
potato.db.levels = initLevelsDatabase()
app.locals.users = initUsersDatabase()

// Inject custom endpoints
installStaticEndpoints(potato)
installLevelsEndpoints(potato)
installTestsEndpoints(potato)
installUsersEndpoints(potato)
installUploadEndpoints(potato)

// Load sonolus-pack folder
try {
  potato.load(config.packer)
} catch (e) {
  console.log('Sonolus-packer db was not valid!')
}

// Startup the server
app.listen(config.port, () => {
  console.log('Server listening at port', config.port)
})
