import { customAlphabet } from "nanoid";

export class DomainStore {
    randomIdGenFunc = customAlphabet("0123456789abcdefghijklmnopqrstuvwxyz", 16);

    genRandomId() {
        return this.randomIdGenFunc();
    }
}
