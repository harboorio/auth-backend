import Ajv2020 from "ajv/dist/2020.js";
import addFormats from "ajv-formats";
import { isCountryCode } from "locale-util";

const ajv = new Ajv2020();

addFormats(ajv);

ajv.addFormat("rid", (v) => v.length === 16 && !/[^0-9a-z]/.test(v));
ajv.addFormat("otp", (v) => v.toString().length === 6);
ajv.addFormat("country_code", (v) => isCountryCode(v));

export { ajv };
