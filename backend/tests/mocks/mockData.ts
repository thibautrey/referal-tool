export const mockLinkData = {
  id: 1,
  shortCode: "testlink",
  baseUrl: "example.com",
  active: true,
  isPasswordProtected: false,
  rules: [
    {
      id: "1",
      linkId: 1,
      countries: JSON.stringify(["US", "CA"]),
      redirectUrl: "example-us.com",
    },
    {
      id: "2",
      linkId: 1,
      countries: JSON.stringify(["FR", "DE"]),
      redirectUrl: "example-eu.com",
    },
  ],
  deviceRules: [
    {
      id: "1",
      linkId: 1,
      deviceType: "mobile",
      redirectUrl: "example-mobile.com",
    },
    {
      id: "2",
      linkId: 1,
      deviceType: "all",
      redirectUrl: "example-all-devices.com",
    },
  ],
};

export const mockUserAgents = {
  desktop:
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
  mobile:
    "Mozilla/5.0 (iPhone; CPU iPhone OS 14_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.1.1 Mobile/15E148 Safari/604.1",
  tablet:
    "Mozilla/5.0 (iPad; CPU OS 14_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.1.1 Mobile/15E148 Safari/604.1",
};

export const mockGeoData = {
  US: ["US", "New York"],
  FR: ["FR", "Paris"],
  DE: ["DE", "Berlin"],
  JP: ["JP", "Tokyo"],
};
