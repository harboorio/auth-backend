export interface HarboorAuthHomeResponse200 {
  name: string;
  version: string;
  [k: string]: unknown;
}


export type HarboorAuthHomeResponse = HarboorAuthHomeResponse200

export interface HarboorAuthOtpRequestBody {
  credentialType: "email" | "phone";
  credential:
    | string
    | {
        country: string;
        num: string;
      };
}


export interface HarboorAuthOtpRequestResponse200 {
  success: boolean;
}


export interface HarboorAuthOtpRequestResponse400 {
  error: {
    code: string;
    message?: string;
  };
}


export type HarboorAuthOtpRequestResponse = HarboorAuthOtpRequestResponse200 | HarboorAuthOtpRequestResponse400

export interface HarboorAuthOtpVerifyBody {
  otp: string;
}


export interface HarboorAuthOtpVerifyResponse200 {
  success: boolean;
}


export type HarboorAuthOtpVerifyResponse = HarboorAuthOtpVerifyResponse200