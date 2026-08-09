export type ApiSuccess<TData> = {
  success: true;
  data: TData;
  requestId: string;
};

export type ApiFailure = {
  success: false;
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
  requestId: string;
};

export type ApiEnvelope<TData> = ApiSuccess<TData> | ApiFailure;

export type RequestJson =
  | string
  | number
  | boolean
  | null
  | RequestJson[]
  | { [key: string]: RequestJson };
