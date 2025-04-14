export interface HarboorAuthGetResponse200 {
  name: string;
  version: string;
  [k: string]: unknown;
}

export type HarboorAuthGetResponse = HarboorAuthGetResponse200
export interface HarboorAuthOtpPostBody {
  credentialType: "email" | "phone";
  credential:
    | string
    | {
        country: string;
        num: string;
      };
}

export interface HarboorAuthOtpPostResponse200 {
  success: boolean;
}

export interface HarboorAuthOtpPostResponse400 {
  error: {
    code: string;
    message?: string;
  };
}

export type HarboorAuthOtpPostResponse = HarboorAuthOtpPostResponse200 | HarboorAuthOtpPostResponse400
export interface HarboorAuthOtpPutBody {
  otp: string;
}

export interface HarboorAuthOtpPutResponse200 {
  success: boolean;
}

export type HarboorAuthOtpPutResponse = HarboorAuthOtpPutResponse200