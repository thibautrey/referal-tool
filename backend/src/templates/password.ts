import { Translator } from "../lib/i18n";

export const getPasswordTemplate = (
  shortCode: string,
  translator: Translator
) => {
  const content = {
    title: translator.t("template.password.title"),
    description: translator.t("template.password.description"),
    placeholder: translator.t("template.password.placeholder"),
    submit: translator.t("template.password.submit"),
    validating: translator.t("template.password.validating"),
    genericError: translator.t("template.password.generic_error"),
    invalidFallback: translator.t("template.password.invalid_fallback"),
  };

  const scriptStrings = JSON.stringify({
    validating: content.validating,
    submit: content.submit,
    genericError: content.genericError,
    invalidFallback: content.invalidFallback,
  });

  return `
<!DOCTYPE html>
<html lang="${translator.locale}">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${content.title}</title>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&display=swap" rel="stylesheet">
    <style>
        :root {
            --background: #ffffff;
            --foreground: #171717;
            --primary: #0070f3;
            --primary-hover: #0051cc;
            --muted: #737373;
            --border: #e5e5e5;
            --error: #dc2626;
        }

        @media (prefers-color-scheme: dark) {
            :root {
                --background: #171717;
                --foreground: #ffffff;
                --primary: #3b82f6;
                --primary-hover: #2563eb;
                --muted: #a3a3a3;
                --border: #404040;
                --error: #ef4444;
            }
        }

        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: 'Inter', -apple-system, sans-serif;
            background: var(--background);
            color: var(--foreground);
            line-height: 1.5;
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 1rem;
        }

        .container {
            background: var(--background);
            border: 1px solid var(--border);
            border-radius: 0.5rem;
            padding: 2rem;
            width: 100%;
            max-width: 400px;
            box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1);
        }

        .header {
            text-align: center;
            margin-bottom: 2rem;
        }

        .title {
            font-size: 1.5rem;
            font-weight: 600;
            margin-bottom: 0.5rem;
        }

        .description {
            color: var(--muted);
            font-size: 0.875rem;
        }

        .input {
            width: 100%;
            padding: 0.75rem 1rem;
            border: 1px solid var(--border);
            border-radius: 0.375rem;
            font-size: 0.875rem;
            background: var(--background);
            color: var(--foreground);
            margin-bottom: 1rem;
        }

        .input:focus {
            outline: none;
            border-color: var(--primary);
            box-shadow: 0 0 0 2px var(--primary-hover);
        }

        .button {
            width: 100%;
            padding: 0.75rem 1rem;
            background: var(--primary);
            color: white;
            border: none;
            border-radius: 0.375rem;
            font-size: 0.875rem;
            font-weight: 500;
            cursor: pointer;
            transition: background-color 0.2s;
        }

        .button:hover {
            background: var(--primary-hover);
        }

        .button:disabled {
            opacity: 0.5;
            cursor: not-allowed;
        }

        .error {
            color: var(--error);
            font-size: 0.875rem;
            margin-top: 0.5rem;
            display: none;
        }

        .error.visible {
            display: block;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1 class="title">${content.title}</h1>
            <p class="description">${content.description}</p>
        </div>
        <form id="passwordForm">
            <input type="password" id="password" class="input" placeholder="${content.placeholder}" required>
            <p id="errorMessage" class="error"></p>
            <button type="submit" class="button" id="submitButton">${content.submit}</button>
        </form>
    </div>

    <script>
        const i18n = ${scriptStrings};
        const form = document.getElementById('passwordForm');
        const error = document.getElementById('errorMessage');
        const button = document.getElementById('submitButton');
        let isSubmitting = false;

        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            if (isSubmitting) return;

            const password = document.getElementById('password').value;
            button.textContent = i18n.validating;
            button.disabled = true;
            isSubmitting = true;
            error.classList.remove('visible');

            try {
                const response = await fetch('/api/l/${shortCode}/validate', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ password })
                });

                if (response.ok) {
                    window.location.reload();
                } else {
                    const data = await response.json();
                    error.textContent = data.message || i18n.invalidFallback;
                    error.classList.add('visible');
                }
            } catch (err) {
                error.textContent = i18n.genericError;
                error.classList.add('visible');
            } finally {
                button.textContent = i18n.submit;
                button.disabled = false;
                isSubmitting = false;
            }
        });
    </script>
</body>
</html>
`;
};
