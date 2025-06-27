# rflnk Chrome Extension

This extension allows you to create rflnk links without visiting rflnk.com.

## Features
- Uses the authentication token from rflnk.com automatically when available.
- Login directly from the popup if no token is found.
- Create links from the popup form or by selecting text and using the context menu.
- Copies the generated short link to your clipboard and shows a notification.

After building, load the `chrome-extension` folder as an unpacked extension in Chrome.
You must run the build step any time you make changes or update the extension files.

## Development

The popup interface is now built with React and Tailwind CSS using Vite. Run the following commands to build the extension assets:

```bash
npm install
npm run build
```

This produces a `dist` folder containing `popup.html` and related assets that Chrome will load.
