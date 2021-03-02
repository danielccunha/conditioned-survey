import jwt from 'jsonwebtoken'

import { Encrypter } from './Encrypter'

jest.mock('jsonwebtoken', () => ({
  sign: () => 'any_token',
  verify: () => 'any_value'
}))

const makeSut = () => {
  const secret = process.env.ENCRYPTER_SECRET
  const sut = new Encrypter()
  return { sut, secret }
}

describe('Encrypter', () => {
  test('should call sign with correct values', async () => {
    const { sut, secret } = makeSut()
    const signSpy = jest.spyOn(jwt, 'sign')
    await sut.encrypt('any_value')
    expect(signSpy).toHaveBeenCalledWith('any_value', secret, { expiresIn: '1d' })
  })

  test('should return a token on sign success', async () => {
    const { sut } = makeSut()
    const token = await sut.encrypt('any_value')
    expect(token).toBe('any_token')
  })

  test('should call verify with correct values', async () => {
    const { sut, secret } = makeSut()
    const verifySpy = jest.spyOn(jwt, 'verify')
    await sut.decrypt('any_token')
    expect(verifySpy).toHaveBeenCalledWith('any_token', secret)
  })

  test('should return a value on decrypt success', async () => {
    const { sut } = makeSut()
    const value = await sut.decrypt('any_token')
    expect(value).toBe('any_value')
  })
})
