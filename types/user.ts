export type TUser = {
  id: number;
  role_id?: number | null;
  username: string;
  accessToken: string;
  expiresAt?: number | null;
};
