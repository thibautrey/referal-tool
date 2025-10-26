import { Translator } from "../lib/i18n";

export const get404Template = (translator: Translator) => `
<!DOCTYPE html>
<html lang="${translator.locale}">
  <head>
    <title>${translator.t("template.404.title")}</title>
    <style>
      body {
        margin: 0;
        padding: 0;
        min-height: 100vh;
        display: flex;
        justify-content: center;
        align-items: center;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        background: linear-gradient(135deg, #6e8efb, #a777e3);
      }
      .glass-container {
        background: rgba(255, 255, 255, 0.15);
        backdrop-filter: blur(10px);
        -webkit-backdrop-filter: blur(10px);
        border-radius: 20px;
        border: 1px solid rgba(255, 255, 255, 0.18);
        padding: 40px;
        text-align: center;
        box-shadow: 0 8px 32px 0 rgba(31, 38, 135, 0.37);
        max-width: 500px;
        margin: 20px;
      }
      h1 {
        color: white;
        font-size: 48px;
        margin: 0;
        margin-bottom: 20px;
      }
      p {
        color: rgba(255, 255, 255, 0.9);
        font-size: 18px;
        line-height: 1.6;
        margin: 0;
        margin-bottom: 25px;
      }
      .back-button {
        display: inline-block;
        padding: 12px 24px;
        background: rgba(255, 255, 255, 0.2);
        color: white;
        text-decoration: none;
        border-radius: 10px;
        transition: all 0.3s ease;
      }
      .back-button:hover {
        background: rgba(255, 255, 255, 0.3);
        transform: translateY(-2px);
      }
    </style>
  </head>
  <body>
    <div class="glass-container">
      <h1>${translator.t("template.404.heading")}</h1>
      <p>${translator.t("template.404.description_primary")}</p>
      <p>${translator.t("template.404.description_secondary")}</p>
      <a href="/" class="back-button">${translator.t("template.404.cta")}</a>
    </div>
  </body>
</html>
`;
