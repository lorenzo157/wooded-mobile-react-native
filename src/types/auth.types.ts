export interface LoginResponse {
  user: User;
  access_token: string;
}

export interface User {
  idUser: number;
  email: string;
  [key: string]: any;
}

export interface DecodedToken {
  idUser: number;
  iat: number;
  exp: number;
}
