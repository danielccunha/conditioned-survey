declare namespace Express {
  export interface Request {
    user: import('../middleware/auth').UserInformation
  }
}
