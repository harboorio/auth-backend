import * as jose from "jose";
import { type JWTClaimValidationFailed, JWTExpired, JWTInvalid } from "jose/errors";

export interface UserClaims extends Record<string, string | number | undefined> {
    iat: number;
    iss: string;
    aud: string;
    deviceId: string;
    platformType: string; //'tablet' | 'mobile' | 'desktop' | 'tv' | 'bot'
    browserName: string;
    browserVersion: string;
    userId?: string;
}

const alg = "HS512";

export async function verifyToken<T>(
    jwt: string,
    secret: string,
    options: jose.JWTVerifyOptions,
): Promise<T | JWTClaimValidationFailed | JWTExpired | JWTInvalid | Error> {
    const _secret = new TextEncoder().encode(secret);

    try {
        const { payload } = await jose.jwtVerify(jwt, _secret, options ?? {});

        return payload as T;
    } catch (e) {
        return e as JWTClaimValidationFailed | JWTExpired | JWTInvalid | Error;
    }
}

export async function generateToken(
    claims: Omit<UserClaims, "iat" | "iss" | "aud">,
    secret: string,
    options: { issuer?: string; audience?: string; subject?: string },
) {
    const _secret = new TextEncoder().encode(secret);
    const signature = new jose.SignJWT(claims).setProtectedHeader({ alg }).setIssuedAt();

    if (options.audience) signature.setAudience(options.audience);
    if (options.issuer) signature.setAudience(options.issuer);
    if (options.subject) signature.setSubject(options.subject);

    return await signature.sign(_secret);
}
