export interface UserTypes {
  id: string;
  username: string;
  email: string;
  password: string;
  bio: string;
  avatar: string;
  interests: string[];
  permissions: string[];
  roles: string[];
  credit: number;
  refreshToken: string;
  verified: boolean;
}
