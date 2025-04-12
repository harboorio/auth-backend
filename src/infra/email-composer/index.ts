import path from "node:path";
import { readFileSync } from "node:fs";

export type EmailComposerTemplateParams = {
    title: string;
    header:
        | string
        | {
              src: string;
              width: number | string;
              height?: number | string;
              alt: string;
              url?: string;
          };
    bgcolor?: string;
    bodybgcolor?: string;
    textcolor?: string;
    headertextcolor?: string;
    footerbgcolor?: string;
    footertextcolor?: string;
};

export type EmailComposerSection = EmailComposerSectionParagraph | EmailComposerSectionTable;

export type EmailComposerSectionParagraph = {
    type: "paragraph";
    text: string;
    title?: string;
};

export type EmailComposerSectionTable = {
    type: "table";
    rows: [string, string | number][];
    title?: string;
};

export class EmailComposer {
    private templates = {
        base: readFileSync(path.resolve(import.meta.dirname, "templates", "base.html"), "utf-8"),
    };
    private params: EmailComposerTemplateParams = {
        title: "",
        header: "",
        bgcolor: "#ffffff",
        bodybgcolor: "#ffffff",
        textcolor: "#000000",
        headertextcolor: "#000000",
        footerbgcolor: "#ffffff",
        footertextcolor: "#aaaaaa",
    };

    private copyright = {
        text: "",
        name: "",
    };
    private unsubscribe = {
        text: "",
        link: "",
    };
    private businessTokens: string[] = [];
    private sections: EmailComposerSection[] = [];

    constructor({
        title,
        header,
        bgcolor = "#ffffff",
        bodybgcolor = "#ffffff",
        textcolor = "#000000",
        headertextcolor = "#000000",
        footerbgcolor = "#ffffff",
        footertextcolor = "#aaaaaa",
    }: EmailComposerTemplateParams) {
        this.params.title = title;
        this.params.header = header;
        this.params.bgcolor = bgcolor;
        this.params.bodybgcolor = bodybgcolor;
        this.params.textcolor = textcolor;
        this.params.headertextcolor = headertextcolor;
        this.params.footerbgcolor = footerbgcolor;
        this.params.footertextcolor = footertextcolor;
    }

    clearContent() {
        this.sections = [];
    }

    generateHtml() {
        const footer = this.generateFooterHtml();
        const header = this.generateHeaderHtml();
        const sections = this.generateSectionsHtml();
        const firstParsed = this.parse(this.templates.base, { header, footer, sections });

        return this.parse(firstParsed, this.params);
    }

    generatePlainText() {
        const footer = this.generateFooterPlainText();
        const header = this.generateHeaderPlainText();
        const sections = this.generateSectionsPlainText();

        return [header, sections, footer].join("\r\n");
    }

    addParagraph(text: string, title?: string): this {
        const section: EmailComposerSectionParagraph = {
            type: "paragraph",
            text,
        };
        if (title) section.title = title;

        this.sections.push(section);

        return this;
    }

    addTable(rows: [string, string | number][], title?: string): this {
        const section: EmailComposerSectionTable = {
            type: "table",
            rows,
        };

        if (title) section.title = title;

        this.sections.push(section);

        return this;
    }

    setCopyrightInfo({ text = "All rights reserved.", name }: { text: string; name: string }) {
        this.copyright.name = name;
        this.copyright.text = text;
    }

    setUnsubscribeOption(text: string, link: string) {
        this.unsubscribe.text = text;
        this.unsubscribe.link = link;
    }

    setBusinessTokens(texts: string[]) {
        this.businessTokens = texts;
    }

    private generateSectionsPlainText() {
        if (this.sections.length === 0) {
            return "";
        }

        return this.sections.reduce((memo, section) => {
            if (section.type === "paragraph") {
                memo += (section.title ? section.title + "\r\n" : "") + section.text + "\r\n\r\n";
            } else if (section.type === "table") {
                memo += section.title ? section.title + "\r\n" : "";
                memo += section.rows.map((s) => "  " + s[0] + ": " + s[1]).join("\r\n") + "\r\n\r\n";
            }

            return memo;
        }, "");
    }

    private generateSectionsHtml() {
        if (this.sections.length === 0) {
            return "";
        }

        return this.sections.reduce((memo, section) => {
            if (section.type === "paragraph") {
                memo +=
                    "<tr>" +
                    '<td class="container-padding content" align="left" ' +
                    'style="padding-left:24px;padding-right:24px;padding-top:12px;' +
                    'padding-bottom:12px;background-color:{{bodybgcolor}}">' +
                    "<br>";

                if (section.title) {
                    memo +=
                        '<div class="title" ' +
                        'style="font-family:Helvetica, Arial, sans-serif;font-size:20px;' +
                        'font-weight:600;color:{{textcolor}}">' +
                        section.title +
                        "</div><br>";
                }

                memo +=
                    '<div class="body-text" ' +
                    'style="font-family:Helvetica, Arial, sans-serif;font-size:16px;' +
                    'line-height:24px;text-align:left;color:{{textcolor}}">' +
                    section.text +
                    "<br><br>" +
                    "</div>";
                memo += "</td></tr>";
            } else if (section.type === "table") {
                memo +=
                    "<tr>" +
                    '<td class="container-padding content" align="left" ' +
                    'style="padding-left:24px;padding-right:24px;padding-top:12px;' +
                    'padding-bottom:12px;background-color:{{bodybgcolor}}">' +
                    "<br>";

                if (section.title) {
                    memo +=
                        '<div class="title" ' +
                        'style="font-family:Helvetica, Arial, sans-serif;font-size:20px;' +
                        'font-weight:600;color:{{textcolor}}">' +
                        section.title +
                        "</div><br>";
                }

                memo +=
                    '<table border="0" width="600" cellpadding="0" cellspacing="0" class="container" style="width:100% !important;max-width:100% !important;">';

                memo += section.rows
                    .map(
                        (s) =>
                            "<tr>" +
                            '<td style="font-family:Helvetica, Arial, sans-serif;font-size:16px;line-height:24px;text-align:left;color:{{textcolor}}">' +
                            s[0] +
                            "</td>" +
                            '<td style="font-family:Helvetica, Arial, sans-serif;font-size:16px;line-height:24px;text-align:left;color:{{textcolor}}">' +
                            s[1] +
                            "</td>" +
                            "</tr>",
                    )
                    .join("");

                memo += "</table><br>";
                memo += "</td></tr>";
            }

            return memo;
        }, "");
    }

    private generateHeaderPlainText() {
        return typeof this.params.header === "string" ? this.params.header + "\r\n\r\n-\r\n" : "";
    }

    private generateHeaderHtml() {
        let html =
            "<tr>" +
            '<td class="container-padding header" align="left" bgcolor="{{bodybgcolor}}" ' +
            'style="font-family:Helvetica, Arial, sans-serif;font-size:24px;' +
            "font-weight:bold;padding-top:24px;padding-bottom:24px;color:{{headertextcolor}};" +
            'padding-left:24px;padding-right:24px;background-color:{{bodybgcolor}};">';

        if (typeof this.params.header === "string") {
            if (this.params.header.length === 0) return "";
            html += this.params.header;
        } else {
            html +=
                '<img src="' +
                this.params.header.src +
                '" ' +
                'width="' +
                this.params.header.width +
                '" ' +
                'style="max-width:' +
                this.params.header.width +
                'px;" ' +
                'alt="' +
                this.params.header.alt +
                '" />';
        }

        html += "</td></tr>";

        return html;
    }

    private generateFooterPlainText() {
        let isEmpty = true;
        let text = "-\r\n\r\n";

        if (this.copyright.name.length > 0) {
            isEmpty = false;
            text += [this.copyright.text, "©", new Date().getFullYear(), this.copyright.name].join(" ") + "\r\n\r\n";
        }

        if (this.unsubscribe.link.length > 0) {
            isEmpty = false;
            text += this.unsubscribe.text + "\r\n" + this.unsubscribe.link + "\r\n\r\n";
        }

        if (this.businessTokens.length > 0) {
            isEmpty = false;
            text +=
                this.businessTokens
                    .map((token: string) => {
                        return token + "\r\n";
                    })
                    .join("\r\n") + "\r\n";
        }

        if (isEmpty) return "";

        return text;
    }

    private generateFooterHtml() {
        let isEmpty = true;
        let html =
            "<tr>" +
            '<td class="container-padding footer-text" align="left" bgcolor="{{footerbgcolor}}" ' +
            'style="font-family:Helvetica, Arial, sans-serif;font-size:12px;' +
            "line-height:16px;color:{{footertextcolor}};background-color:{{footerbgcolor}};" +
            'padding-left:24px;padding-right:24px">' +
            "<br><br>";

        if (this.copyright.name.length > 0) {
            isEmpty = false;
            html += [this.copyright.text, "©", new Date().getFullYear(), this.copyright.name].join(" ") + "<br><br>";
        }

        if (this.unsubscribe.link.length > 0) {
            isEmpty = false;
            const url = new URL(this.unsubscribe.link);
            html +=
                this.unsubscribe.text +
                '<br><a href="' +
                url.href +
                '" style="color:{{footertextcolor}}">' +
                url.hostname +
                "</a>" +
                "<br><br>";
        }

        if (this.businessTokens.length > 0) {
            isEmpty = false;
            html +=
                this.businessTokens
                    .map((token: string, index) => {
                        let text = "",
                            html = "";
                        let u: URL | null = null;
                        try {
                            u = new URL(token);
                            text = u.hostname;
                            html = '<a href="' + u.href + '" style="color:{{footertextcolor}}">' + text + "</a><br>";
                        } catch (e) {
                            text = token;
                            html = index === 0 ? "<strong>" + text + "</strong>" : "<span>" + text + "</span>";
                        }
                        return html;
                    })
                    .join("<br>") + "<br>";
        }

        if (isEmpty) return "";

        html += "<br><br></td></tr>";

        return html;
    }

    private parse(template: string, params: Record<string, string | unknown>) {
        return Object.keys(params).reduce((memo, param) => {
            const literal = "{{" + param + "}}";
            const value = params[param as keyof typeof params];
            return typeof value == "string" ? memo.replace(literal, value) : memo;
        }, template);
    }
}
