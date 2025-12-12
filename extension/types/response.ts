export type TResponse = {
  success: boolean;
  error?: TResponseError;
};

export type TResponseError = {
  code: string | number;
  message: string | null;
};
