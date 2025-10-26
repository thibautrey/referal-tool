import { createTranslator, resolveLocale } from "../../src/lib/i18n";

describe("i18n utility", () => {
  it("prefers project locale over user and headers", () => {
    const locale = resolveLocale({
      userLocale: "en",
      projectLocale: "fr",
      acceptLanguage: "en-US,en;q=0.9",
    });

    expect(locale).toBe("fr");
  });

  it("uses accept-language header when no explicit locale is provided", () => {
    const locale = resolveLocale({ acceptLanguage: "fr-FR,fr;q=0.8" });
    expect(locale).toBe("fr");
  });

  it("falls back to english when no locale information is available", () => {
    expect(resolveLocale({})).toBe("en");
  });

  it("translates keys using the resolved locale", () => {
    const translator = createTranslator({ explicitLocale: "fr" });
    expect(translator.t("auth.signup.success")).toContain("Inscription");
  });
});
