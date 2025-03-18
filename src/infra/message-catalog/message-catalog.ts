import { IntlMessageFormat } from "intl-messageformat";

type MessageCatalogStore = {
    [locale: string]: {
        [key: string]: IntlMessageFormat;
    };
};

export class MessageCatalog {
    private store: MessageCatalogStore = {};

    setup(catalogs: Record<string, Record<string, string>>) {
        Object.keys(catalogs).map((_locale) => {
            this.store[_locale] = {};
            Object.keys(catalogs[_locale]!).map((_key) => {
                this.setMessage(_key, _locale);
            });
        });

        return this;
    }

    setMessage(key: string, locale: string) {
        this.store[locale]![key] = new IntlMessageFormat(key, locale);
    }

    getMessage(key: string, locale: string) {
        if (!(locale in this.store)) {
            return key;
        }

        if (!(key in this.store[locale]!)) {
            return key;
        }

        return this.store[locale]![key];
    }
}

export const msgs = new MessageCatalog();
