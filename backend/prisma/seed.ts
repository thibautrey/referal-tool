import { PrismaClient, Prisma } from "@prisma/client";
import * as bcrypt from "bcrypt";

const prisma = new PrismaClient();

async function main() {
  // Clear existing data if needed
  await prisma.linkVisit.deleteMany();
  await prisma.ipCountryCache.deleteMany();
  await prisma.linkRule.deleteMany();
  await prisma.apiKey.deleteMany();
  await prisma.link.deleteMany();
  await prisma.project.deleteMany();
  await prisma.aiModel.deleteMany();
  await prisma.aiProvider.deleteMany();
  await prisma.user.deleteMany();

  // Seed AI providers and models
  const openAiProvider = await prisma.aiProvider.create({
    data: {
      name: "OpenAI",
      baseUrl: "https://api.openai.com/v1",
      inputTokenPrice: new Prisma.Decimal("0.0005"),
      outputTokenPrice: new Prisma.Decimal("0.0015"),
      models: {
        create: [
          {
            name: "GPT-4o",
            modelIdentifier: "gpt-4o",
            inputTokenPrice: new Prisma.Decimal("0.0005"),
            outputTokenPrice: new Prisma.Decimal("0.0015"),
          },
          {
            name: "GPT-4o-mini",
            modelIdentifier: "gpt-4o-mini",
            inputTokenPrice: new Prisma.Decimal("0.00025"),
            outputTokenPrice: new Prisma.Decimal("0.0006"),
          },
        ],
      },
    },
  });

  const anthropicProvider = await prisma.aiProvider.create({
    data: {
      name: "Anthropic",
      baseUrl: "https://api.anthropic.com",
      inputTokenPrice: new Prisma.Decimal("0.0008"),
      outputTokenPrice: new Prisma.Decimal("0.0024"),
      fallbackProviderId: openAiProvider.id,
      models: {
        create: [
          {
            name: "Claude 3.5 Sonnet",
            modelIdentifier: "claude-3-5-sonnet-20240620",
            inputTokenPrice: new Prisma.Decimal("0.0008"),
            outputTokenPrice: new Prisma.Decimal("0.0024"),
          },
          {
            name: "Claude 3 Haiku",
            modelIdentifier: "claude-3-haiku-20240307",
            inputTokenPrice: new Prisma.Decimal("0.00025"),
            outputTokenPrice: new Prisma.Decimal("0.00125"),
          },
        ],
      },
    },
  });

  // Configure model fallbacks
  const gpt4oMini = await prisma.aiModel.findFirst({
    where: { modelIdentifier: "gpt-4o-mini" },
  });

  if (gpt4oMini) {
    await prisma.aiModel.updateMany({
      where: { providerId: anthropicProvider.id },
      data: { fallbackModelId: gpt4oMini.id },
    });
  }

  // Create demo user
  const demoUser = await prisma.user.create({
    data: {
      email: "demo@example.com",
      firstName: "Demo",
      lastName: "User",
      password: await bcrypt.hash("demo123", 10),
      role: "USER",
      active: true,
      otpEnabled: false,
    },
  });

  // Create projects
  const marketingProject = await prisma.project.create({
    data: {
      name: "Marketing Campaign 2025",
      description: "Global marketing campaign for our new product",
      userId: demoUser.id,
    },
  });

  const affiliateProject = await prisma.project.create({
    data: {
      name: "Affiliate Program",
      description: "Tracking links for our affiliate partners",
      userId: demoUser.id,
    },
  });

  const socialProject = await prisma.project.create({
    data: {
      name: "Social Media Campaign",
      description: "Links for social media marketing",
      userId: demoUser.id,
    },
  });

  // Create links with rules for marketing project
  const productLink = await prisma.link.create({
    data: {
      name: "Product Landing Page",
      baseUrl: "https://example.com/products",
      shortCode: "product25",
      projectId: marketingProject.id,
      active: true,
    },
  });

  await prisma.linkRule.createMany({
    data: [
      {
        redirectUrl: "https://example.com/products/us",
        countries: JSON.stringify(["US", "CA"]),
        linkId: productLink.id,
      },
      {
        redirectUrl: "https://example.com/products/eu",
        countries: JSON.stringify(["FR", "DE", "IT", "ES"]),
        linkId: productLink.id,
      },
      {
        redirectUrl: "https://example.com/products/asia",
        countries: JSON.stringify(["JP", "CN", "KR"]),
        linkId: productLink.id,
      },
    ],
  });

  const promoLink = await prisma.link.create({
    data: {
      name: "Summer Promotion",
      baseUrl: "https://example.com/summer-promo",
      shortCode: "summer25",
      projectId: marketingProject.id,
      active: true,
    },
  });

  await prisma.linkRule.createMany({
    data: [
      {
        redirectUrl: "https://example.com/summer-promo/us?coupon=US25",
        countries: JSON.stringify(["US"]),
        linkId: promoLink.id,
      },
      {
        redirectUrl: "https://example.com/summer-promo/eu?coupon=EU25",
        countries: JSON.stringify(["FR", "DE", "UK"]),
        linkId: promoLink.id,
      },
    ],
  });

  // Create links for affiliate project
  const influencerLink = await prisma.link.create({
    data: {
      name: "Influencer Campaign",
      baseUrl: "https://example.com/ref",
      shortCode: "influ25",
      projectId: affiliateProject.id,
      active: true,
    },
  });

  await prisma.linkRule.createMany({
    data: [
      {
        redirectUrl: "https://example.com/ref/influencer1",
        countries: JSON.stringify(["US", "CA"]),
        linkId: influencerLink.id,
      },
      {
        redirectUrl: "https://example.com/ref/influencer2",
        countries: JSON.stringify(["UK", "FR", "DE"]),
        linkId: influencerLink.id,
      },
    ],
  });

  const partnerLink = await prisma.link.create({
    data: {
      name: "Partner Program",
      baseUrl: "https://example.com/partner",
      shortCode: "partner25",
      projectId: affiliateProject.id,
      active: true,
    },
  });

  await prisma.linkRule.createMany({
    data: [
      {
        redirectUrl: "https://example.com/partner/tier1",
        countries: JSON.stringify(["US", "CA", "UK"]),
        linkId: partnerLink.id,
      },
      {
        redirectUrl: "https://example.com/partner/tier2",
        countries: JSON.stringify(["FR", "DE", "IT", "ES"]),
        linkId: partnerLink.id,
      },
    ],
  });

  // Create links for social media project
  const instagramLink = await prisma.link.create({
    data: {
      name: "Instagram Campaign",
      baseUrl: "https://example.com/social/ig",
      shortCode: "ig25",
      projectId: socialProject.id,
      active: true,
    },
  });

  await prisma.linkRule.createMany({
    data: [
      {
        redirectUrl: "https://example.com/social/ig/story",
        countries: JSON.stringify(["US", "CA", "UK", "AU"]),
        linkId: instagramLink.id,
      },
      {
        redirectUrl: "https://example.com/social/ig/feed",
        countries: JSON.stringify(["FR", "DE", "IT", "ES"]),
        linkId: instagramLink.id,
      },
    ],
  });

  const facebookLink = await prisma.link.create({
    data: {
      name: "Facebook Ads",
      baseUrl: "https://example.com/social/fb",
      shortCode: "fb25",
      projectId: socialProject.id,
      active: true,
      expiresAt: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000),
    },
  });

  await prisma.linkRule.createMany({
    data: [
      {
        redirectUrl: "https://example.com/social/fb/campaign1",
        countries: JSON.stringify(["US", "CA"]),
        linkId: facebookLink.id,
      },
      {
        redirectUrl: "https://example.com/social/fb/campaign2",
        countries: JSON.stringify(["UK", "AU"]),
        linkId: facebookLink.id,
      },
      {
        redirectUrl: "https://example.com/social/fb/campaign3",
        countries: JSON.stringify(["FR", "DE", "IT"]),
        linkId: facebookLink.id,
      },
    ],
  });

  // Add an inactive link for demonstration
  await prisma.link.create({
    data: {
      name: "Expired Campaign",
      baseUrl: "https://example.com/expired",
      shortCode: "expired",
      projectId: marketingProject.id,
      active: false,
      expiresAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      rules: {
        create: {
          redirectUrl: "https://example.com/expired/campaign",
          countries: JSON.stringify(["US", "CA", "UK"]),
        },
      },
    },
  });

  // Create IP country cache data
  await prisma.ipCountryCache.createMany({
    data: [
      {
        ip: "192.168.1.1",
        countryCode: "US",
        city: "New York",
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
      },
      {
        ip: "192.168.1.2",
        countryCode: "FR",
        city: "Paris",
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      },
      {
        ip: "192.168.1.3",
        countryCode: "DE",
        city: "Berlin",
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      },
      {
        ip: "192.168.1.4",
        countryCode: "UK",
        city: "London",
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      },
    ],
  });

  // Generate link visit data
  // This will simulate visits from various countries over the past month
  const linkRules = await prisma.linkRule.findMany();
  const countries = [
    "US",
    "CA",
    "UK",
    "FR",
    "DE",
    "IT",
    "ES",
    "JP",
    "CN",
    "AU",
  ];
  const cities: { [key: string]: string[] } = {
    US: ["New York", "Los Angeles", "Chicago", "Houston"],
    CA: ["Toronto", "Vancouver", "Montreal", "Calgary"],
    UK: ["London", "Manchester", "Birmingham", "Edinburgh"],
    FR: ["Paris", "Lyon", "Marseille", "Toulouse"],
    DE: ["Berlin", "Munich", "Hamburg", "Cologne"],
    IT: ["Rome", "Milan", "Naples", "Turin"],
    ES: ["Madrid", "Barcelona", "Valencia", "Seville"],
    JP: ["Tokyo", "Osaka", "Kyoto", "Yokohama"],
    CN: ["Beijing", "Shanghai", "Guangzhou", "Shenzhen"],
    AU: ["Sydney", "Melbourne", "Brisbane", "Perth"],
  };

  // Create visit data for the last 30 days
  const now = new Date();
  const visits: {
    linkId: number;
    country: string;
    city: string | null;
    ip: string;
    ruleId: number | null;
    createdAt: Date;
  }[] = [];

  // For each link rule, generate visits from each country
  for (const rule of linkRules) {
    const linkId = rule.linkId;
    const ruleCountries = JSON.parse(rule.countries);

    // Generate more visits for the rule's specified countries, and fewer for other countries
    for (const country of countries) {
      const isTargetCountry = ruleCountries.includes(country);
      const visitsCount = isTargetCountry
        ? Math.floor(Math.random() * 50) + 50
        : Math.floor(Math.random() * 20) + 5;

      for (let i = 0; i < visitsCount; i++) {
        const daysAgo = Math.floor(Math.random() * 30);
        const visitDate = new Date(now);
        visitDate.setDate(visitDate.getDate() - daysAgo);

        const citiesForCountry = cities[country] || ["Unknown"];
        const city =
          citiesForCountry[Math.floor(Math.random() * citiesForCountry.length)];

        visits.push({
          linkId,
          country,
          city,
          ip: `192.168.${Math.floor(Math.random() * 255)}.${Math.floor(
            Math.random() * 255
          )}`,
          ruleId: isTargetCountry ? rule.id : null,
          createdAt: visitDate,
        });
      }
    }
  }

  // Insert all visit data in batches
  for (let i = 0; i < visits.length; i += 100) {
    const batch = visits.slice(i, i + 100);
    await prisma.linkVisit.createMany({
      data: batch,
    });
  }

  console.log("Database has been seeded successfully");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
