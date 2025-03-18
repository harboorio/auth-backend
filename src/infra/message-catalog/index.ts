import { msgs, type MessageCatalog } from "@infra/message-catalog/message-catalog";

export { msgs, type MessageCatalog };

export function getTranslationFunction(locale: string) {
    return function _(key: string, formattingOpts: FormattingOpts = { values: {} }) {
        const message = msgs.getMessage(key, formattingOpts.locale ?? locale);

        if (typeof message === "string") {
            return message;
        }

        return message.format({
            values: formattingOpts.values,
        }) as string;
    };
}

export type FormattingOpts = {
    values?: Record<string, string>;
    locale?: string;
};
