export interface UserBase {
  email: string;
}

export interface UserCreate extends UserBase {
  password: string;
}

export interface UserResponse extends UserBase {
  id: number;
  created_at: string;
}

export interface Token {
  access_token: string;
  token_type: string;
}
