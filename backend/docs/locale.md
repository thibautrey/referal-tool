# Backend localization overview

The backend uses a lightweight translation system located at `src/lib/i18n.ts` to render
user-facing messages, HTML templates, and transactional emails. Locales are resolved in
the following order:

1. **Explicit project locale** – if a project specifies a locale, responses associated with
   that project adopt it.
2. **User profile locale** – when available, a user's preferred locale informs the
   translator.
3. **`Accept-Language` header** – the first supported language (English or French) found
   in the header is used.
4. **Fallback** – English (`en`) is used when no other hint is provided.

Controllers rely on the `createTranslator` helper to build localized payloads via the
`buildLocalizedResponse` function. Templates and transactional emails receive the resolved
translator so HTML content matches the locale used for API responses.
