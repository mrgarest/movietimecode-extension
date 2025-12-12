export type TUser = {
  id: number;
  roleId: number;
  username: string;
  picture?: string | null;
  accessToken: string;
  expiresAt?: number | null;
  twitch?: TUserTwitch | null;
};
export type TUserTwitch = {
  accessToken?: string | null;
  refreshToken?: string | null;
  expiresAt?: number | null;
};
