import { Request, Response, NextFunction } from 'express'
import isInt from 'validator/lib/isInt'

export interface Pagination {
  page: number
  size: number
  skip: number
}

function normalize(value: string, defaultValue: number): number {
  if (isInt(value)) {
    const parsedValue = parseInt(value)
    return parsedValue >= 0 ? parsedValue : 0
  }

  return defaultValue
}

export const pagination = (request: Request, _response: Response, next: NextFunction) => {
  const { page, size } = request.query
  const pagination: Partial<Pagination> = {
    page: normalize((page || '').toString(), 0),
    size: normalize((size || '').toString(), 10)
  }

  pagination.skip = pagination.page * pagination.size
  request.pagination = pagination as Pagination

  next()
}
