/* eslint-disable @typescript-eslint/no-unused-vars */
import { Request, Response, NextFunction } from 'express'

import { AppError } from './../../errors/AppError'

export const errorHandler = (
  error: Error,
  _request: Request,
  response: Response,
  _next: NextFunction
) => {
  if (error instanceof AppError) {
    return response.status(error.statusCode).json({
      message: error.message,
      data: error.data ?? undefined
    })
  }

  response.status(500).json({
    name: error.name,
    message: error.message,
    stackTrace: error.stack
  })
}
