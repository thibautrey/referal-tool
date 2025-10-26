import type { ComponentType } from "react";
import {
  AppWindow,
  ArrowRight,
  BarChart3,
  Clock,
  FilterX,
  Gauge,
  Globe,
  Info,
  Lock,
  Smartphone,
  Target,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Link as RouterLink } from "react-router-dom";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { useAppTranslation } from "@/i18n";
import { useAuth } from "@/contexts/AuthContext";

const fadeIn = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.6,
    },
  },
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.2,
    },
  },
};

const featureConfig = [
  { icon: Globe, key: "smart_geo_routing" },
  { icon: Target, key: "advanced_targeting" },
  { icon: Smartphone, key: "deep_linking" },
  { icon: Lock, key: "link_protection" },
  { icon: Clock, key: "smart_scheduling" },
  { icon: AppWindow, key: "multi_platform" },
  { icon: Gauge, key: "realtime_analytics" },
  { icon: FilterX, key: "no_limits" },
  { icon: BarChart3, key: "performance_insights" },
] as const;

const benefitSteps = [
  { key: "local_markets", index: 1 },
  { key: "real_time", index: 2 },
  { key: "campaign_management", index: 3 },
] as const;

const freePlanFeatures = [
  { key: "unlimited_links", type: "check", withTooltip: true },
  { key: "unlimited_clicks", type: "check", withTooltip: true },
  { key: "geo_customization", type: "check", withTooltip: true },
  { key: "device_tagging", type: "check", withTooltip: true },
  { key: "password_protection", type: "check", withTooltip: true },
  { key: "link_expiration", type: "check", withTooltip: true },
  { key: "deeplinks", type: "check", withTooltip: true },
  { key: "performance_analytics", type: "check", withTooltip: true },
  { key: "analytics_retention", type: "check", withTooltip: true },
  { key: "traffic_share", type: "info", withTooltip: true },
  { key: "no_support", type: "info", withTooltip: true },
] as const;

const addOnCards = [
  { key: "custom_domain", withTooltip: true },
  { key: "no_redirects", withTooltip: false },
  { key: "support", withTooltip: false },
  { key: "analytics", withTooltip: true },
] as const;

const Feature = ({
  title,
  description,
  icon: Icon,
}: {
  title: string;
  description: string;
  icon: ComponentType<{ className?: string }>;
}) => {
  return (
    <motion.div
      variants={fadeIn}
      className={cn(
        "group/feature relative p-6 transition-all",
        "bg-card/50 backdrop-blur-sm hover:shadow-md border border-primary/5 hover:border-primary/30 rounded-lg",
        "hover:bg-card/70"
      )}
    >
      <div className="absolute left-0 w-1 h-8 transition-all -translate-y-1/2 rounded-tr-full rounded-br-full top-1/2 bg-primary/30 group-hover/feature:h-16" />
      <div className="mb-4 text-primary">
        <Icon className="w-8 h-8" />
      </div>
      <h3 className="mb-2 text-lg font-semibold transition-transform group-hover/feature:translate-x-2">
        {title}
      </h3>
      <p className="text-sm text-muted-foreground">{description}</p>
    </motion.div>
  );
};

export default function LandingPage() {
  const { isAuthenticated } = useAuth();
  const { t } = useAppTranslation();

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-background/90">
      <header className="fixed top-0 left-0 right-0 z-50 border-b bg-background/80 backdrop-blur-sm">
        <div className="container flex items-center justify-between h-16 py-4">
          <div className="flex items-center gap-2 pl-6">
            <img
              src="/images/logo.avif"
              alt={t("landing.header.logo_alt")}
              className="w-auto h-8"
            />
            <span className="text-xl font-semibold">{t("app.name")}</span>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger>
                  <Badge
                    variant="secondary"
                    className="text-xs font-normal bg-secondary/30"
                  >
                    {t("app.alpha_badge")}
                  </Badge>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{t("app.alpha_tooltip")}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          <nav className="items-center hidden gap-6 md:flex">
            <a
              href="#features"
              className="transition-colors text-muted-foreground hover:text-foreground"
            >
              {t("landing.header.nav.features")}
            </a>
            <a
              href="#benefits"
              className="transition-colors text-muted-foreground hover:text-foreground"
            >
              {t("landing.header.nav.benefits")}
            </a>
            <a
              href="#pricing"
              className="transition-colors text-muted-foreground hover:text-foreground"
            >
              {t("landing.header.nav.pricing")}
            </a>
            {isAuthenticated ? (
              <Button asChild>
                <RouterLink to="/app/dashboard">
                  {t("landing.header.nav.dashboard")}
                </RouterLink>
              </Button>
            ) : (
              <>
                <RouterLink
                  to="/app/login"
                  className="transition-colors text-muted-foreground hover:text-foreground"
                >
                  {t("landing.header.nav.login")}
                </RouterLink>
                <Button asChild>
                  <RouterLink to="/app/register">
                    {t("landing.header.nav.sign_up")}
                  </RouterLink>
                </Button>
              </>
            )}
          </nav>
          <div className="md:hidden">
            <Button variant="ghost" size="icon">
              <span className="sr-only">{t("app.menu")}</span>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="lucide lucide-menu"
              >
                <line x1="4" x2="20" y1="12" y2="12" />
                <line x1="4" x2="20" y1="6" y2="6" />
                <line x1="4" x2="20" y1="18" y2="18" />
              </svg>
            </Button>
          </div>
        </div>
      </header>

      <section className="px-4 pt-24 pb-16 md:pt-32 md:pb-24">
        <motion.div
          className="container max-w-4xl mx-auto text-center"
          initial="hidden"
          animate="visible"
          variants={fadeIn}
        >
          <h1 className="mb-6 text-4xl font-bold tracking-tight text-transparent md:text-6xl bg-clip-text bg-gradient-to-r from-primary to-purple-500">
            {t("landing.hero.title")}
          </h1>
          <p className="max-w-3xl mx-auto mb-10 text-xl md:text-2xl text-foreground">
            {t("landing.hero.subtitle")}
          </p>
          <div className="flex flex-col justify-center gap-4 md:flex-row">
            {isAuthenticated ? (
              <Button size="lg" asChild>
                <RouterLink to="/app/dashboard">
                  {t("landing.hero.cta_authenticated")}
                  <ArrowRight className="w-5 h-5 ml-2" />
                </RouterLink>
              </Button>
            ) : (
              <>
                <Button size="lg" asChild>
                  <RouterLink to="/app/register">
                    {t("landing.hero.cta_primary")}
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </RouterLink>
                </Button>
                <Button size="lg" variant="outline" asChild>
                  <RouterLink to="/app/login">
                    {t("landing.hero.cta_secondary")}
                  </RouterLink>
                </Button>
              </>
            )}
          </div>
        </motion.div>
      </section>

      <motion.div
        className="container px-4 mx-auto mb-20"
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4, duration: 0.8 }}
      >
        <div className="relative max-w-5xl mx-auto">
          <div className="absolute inset-0 bg-gradient-to-r from-primary/10 via-secondary/10 to-background rounded-xl blur-3xl -z-10" />
          <div className="overflow-hidden border shadow-xl bg-card/20 rounded-xl backdrop-blur-sm">
            <img
              src="/images/dashboard.png"
              alt="Application Dashboard"
              className="w-full h-auto"
            />
          </div>
        </div>
      </motion.div>

      <section id="features" className="px-4 py-20 bg-muted/30">
        <div className="container mx-auto">
          <motion.div
            className="mb-16 text-center"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="mb-4 text-3xl font-bold md:text-4xl">
              {t("landing.features.title")}
            </h2>
            <p className="max-w-2xl mx-auto text-xl text-muted-foreground">
              {t("landing.features.subtitle")}
            </p>
          </motion.div>

          <motion.div
            className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3"
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
          >
            {featureConfig.map(({ icon, key }) => (
              <Feature
                key={key}
                icon={icon}
                title={t(`landing.features.items.${key}.title`)}
                description={t(`landing.features.items.${key}.description`)}
              />
            ))}
          </motion.div>
        </div>
      </section>

      <section id="benefits" className="px-4 py-20">
        <div className="container mx-auto">
          <motion.div
            className="mb-16 text-center"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="mb-4 text-3xl font-bold md:text-4xl">
              {t("landing.benefits.title")}
            </h2>
            <p className="max-w-2xl mx-auto text-xl text-muted-foreground">
              {t("landing.benefits.subtitle")}
            </p>
          </motion.div>

          <div className="grid items-center grid-cols-1 gap-12 md:grid-cols-2">
            <motion.div
              className="order-2 md:order-1"
              initial={{ opacity: 0, x: -40 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
            >
              <h3 className="mb-6 text-2xl font-bold">
                {t("landing.benefits.section_title")}
              </h3>
              <div className="space-y-6">
                {benefitSteps.map(({ key, index }) => (
                  <div key={key} className="flex gap-4">
                    <div className="flex items-center justify-center flex-shrink-0 w-12 h-12 rounded-full bg-primary/10">
                      <span className="text-lg font-bold text-primary">{index}</span>
                    </div>
                    <div>
                      <h4 className="mb-1 text-lg font-semibold">
                        {t(`landing.benefits.steps.${key}.title`)}
                      </h4>
                      <p className="text-muted-foreground">
                        {t(`landing.benefits.steps.${key}.description`)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>

            <motion.div
              className="order-1 overflow-hidden border shadow-lg md:order-2 bg-card/20 rounded-xl backdrop-blur-sm"
              initial={{ opacity: 0, x: 40 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
            >
              <img
                src="/images/analytics.png"
                alt="Analytics Dashboard"
                className="w-full h-auto"
              />
            </motion.div>
          </div>
        </div>
      </section>

      <section id="pricing" className="px-4 py-20 bg-muted/30">
        <div className="container mx-auto">
          <motion.div
            className="mb-16 text-center"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="mb-4 text-3xl font-bold md:text-4xl">
              {t("landing.pricing.title")}
            </h2>
            <p className="max-w-2xl mx-auto text-xl text-muted-foreground">
              {t("landing.pricing.subtitle")}
            </p>
          </motion.div>

          <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="lg:col-span-1"
            >
              <Card className="h-full transition-all bg-card/50 backdrop-blur-sm hover:shadow-md border-primary/10 hover:border-primary/30">
                <CardHeader className="pb-2">
                  <div className="flex justify-between">
                    <div>
                      <CardTitle>{t("landing.pricing.free_plan.title")}</CardTitle>
                      <CardDescription>
                        {t("landing.pricing.free_plan.description")}
                      </CardDescription>
                    </div>
                    <div className="text-3xl font-bold text-primary">
                      {t("landing.pricing.free_plan.price")}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <ul className="space-y-2">
                    {freePlanFeatures.map(({ key, type, withTooltip }) => {
                      const content = (
                        <>
                          {type === "check" ? (
                            <span className="mt-1 mr-2 text-primary">✓</span>
                          ) : (
                            <Info className="w-4 h-4 mt-1 mr-2 text-primary" />
                          )}
                          {t(`landing.pricing.free_plan.features.${key}`)}
                        </>
                      );

                      const itemClass = cn(
                        "flex items-start relative",
                        type === "info" ? "text-muted-foreground" : undefined,
                        "group"
                      );

                      return (
                        <li key={key} className={itemClass}>
                          {content}
                          {withTooltip && (
                            <div className="absolute left-0 -top-2 -translate-y-full w-48 rounded-md bg-popover p-2 text-sm text-popover-foreground shadow-md opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all">
                              {t(`landing.pricing.free_plan.tooltips.${key}`)}
                            </div>
                          )}
                        </li>
                      );
                    })}
                  </ul>

                  <Button className="w-full" asChild>
                    <RouterLink to="/app/register">
                      {t("landing.pricing.free_plan.cta")}
                    </RouterLink>
                  </Button>

                  <p className="mt-2 text-xs text-center text-muted-foreground">
                    {t("landing.pricing.free_plan.no_card")}
                  </p>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="lg:col-span-3"
            >
              <Card className="h-full transition-all bg-card/50 backdrop-blur-sm hover:shadow-md border-primary/10 hover:border-primary/30">
                <CardHeader>
                  <CardTitle>{t("landing.pricing.addons.title")}</CardTitle>
                  <CardDescription>
                    {t("landing.pricing.addons.description")}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                    {addOnCards.map(({ key, withTooltip }) => (
                      <div
                        key={key}
                        className={cn(
                          "relative p-4 border rounded-lg bg-background/50",
                          "group"
                        )}
                      >
                        <div className="flex items-start justify-between mb-2">
                          <h3 className="font-semibold">
                            {t(`landing.pricing.addons.items.${key}.title`)}
                          </h3>
                          <span className="font-bold text-primary">
                            {t(`landing.pricing.addons.items.${key}.price`)}
                          </span>
                        </div>
                        <p className="mb-4 text-sm text-muted-foreground">
                          {t(`landing.pricing.addons.items.${key}.description`)}
                        </p>
                        {withTooltip && (
                          <div className="absolute left-0 -top-2 -translate-y-full w-48 rounded-md bg-popover p-2 text-sm text-popover-foreground shadow-md opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all">
                            {t(`landing.pricing.addons.items.${key}.tooltip`)}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>
      </section>

      <section className="px-4 py-20 bg-primary/5">
        <motion.div
          className="container max-w-3xl mx-auto text-center"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="mb-6 text-3xl font-bold md:text-4xl">
            {t("landing.cta.title")}
          </h2>
          <p className="mb-8 text-xl text-muted-foreground">
            {t("landing.cta.subtitle")}
          </p>
          <Button size="lg" className="px-8" asChild>
            <RouterLink to="/app/register">
              {t("landing.cta.cta")}
            </RouterLink>
          </Button>
          <p className="mt-4 text-sm text-muted-foreground">
            {t("landing.cta.disclaimer")}
          </p>
        </motion.div>
      </section>

      <footer className="px-4 py-12 border-t">
        <div className="container mx-auto">
          <div className="flex flex-col items-center justify-between md:flex-row">
            <div className="flex items-center gap-2 mb-6 md:mb-0">
              <img
                src="/images/logo.avif"
                alt={t("landing.header.logo_alt")}
                className="w-auto h-8"
              />
              <span className="font-semibold">{t("app.name")}</span>
            </div>
            <div className="flex flex-col gap-6 text-center md:flex-row md:gap-12 md:text-left">
              <RouterLink
                to="/app/login"
                className="transition-colors text-muted-foreground hover:text-foreground"
              >
                {t("landing.footer.login")}
              </RouterLink>
              <RouterLink
                to="/register"
                className="transition-colors text-muted-foreground hover:text-foreground"
              >
                {t("landing.footer.sign_up")}
              </RouterLink>
              <a
                href="#features"
                className="transition-colors text-muted-foreground hover:text-foreground"
              >
                {t("landing.footer.features")}
              </a>
              <a
                href="#benefits"
                className="transition-colors text-muted-foreground hover:text-foreground"
              >
                {t("landing.footer.benefits")}
              </a>
            </div>
          </div>
          <div className="pt-8 mt-8 text-sm text-center border-t text-muted-foreground">
            &copy; {new Date().getFullYear()} {" "}
            <a href="https://pleiades.solutions">Pleiades.solutions</a>. {t(
              "landing.footer.rights"
            )}
          </div>
        </div>
      </footer>
    </div>
  );
}
