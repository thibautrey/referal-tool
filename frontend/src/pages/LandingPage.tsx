import {
  ArrowRight,
  BarChart3,
  Globe,
  Link,
  ShieldCheck,
  Users,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import { Button } from "@/components/ui/button";
import { Link as RouterLink } from "react-router-dom";
import { motion } from "framer-motion";

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

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-background/90">
      {/* Header avec navigation */}
      <header className="border-b bg-background/80 backdrop-blur-sm fixed top-0 left-0 right-0 z-50">
        <div className="container flex h-16 items-center justify-between py-4">
          <div className="flex items-center gap-2 pl-6">
            <img src="/images/logo.avif" alt="Logo" className="h-8 w-auto" />
            <span className="font-semibold text-xl">rflnk</span>
          </div>
          <nav className="hidden md:flex items-center gap-6">
            <a
              href="#features"
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              Features
            </a>
            <a
              href="#benefits"
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              Benefits
            </a>
            <RouterLink
              to="/app/login"
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              Login
            </RouterLink>
            <Button asChild>
              <RouterLink to="/app/register">Sign Up</RouterLink>
            </Button>
          </nav>
          <div className="md:hidden">
            <Button variant="ghost" size="icon">
              <span className="sr-only">Menu</span>
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

      {/* Hero Section */}
      <section className="pt-24 md:pt-32 pb-16 md:pb-24 px-4">
        <motion.div
          className="container mx-auto text-center max-w-4xl"
          initial="hidden"
          animate="visible"
          variants={fadeIn}
        >
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-6 bg-clip-text text-transparent bg-gradient-to-r from-primary to-purple-500">
            Optimize Your Affiliate Links
          </h1>
          <p className="text-xl md:text-2xl mb-10 text-muted-foreground max-w-3xl mx-auto">
            Increase your affiliate revenue with our intelligent link management
            platform, designed for influencers and marketers.
          </p>
          <div className="flex flex-col md:flex-row gap-4 justify-center">
            <Button size="lg" asChild>
              <RouterLink to="/register">
                Get Started Free
                <ArrowRight className="ml-2 h-5 w-5" />
              </RouterLink>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <RouterLink to="/login">Login</RouterLink>
            </Button>
          </div>
        </motion.div>
      </section>

      {/* Image de démonstration */}
      <motion.div
        className="container mx-auto px-4 mb-20"
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4, duration: 0.8 }}
      >
        <div className="relative mx-auto max-w-5xl">
          <div className="absolute inset-0 bg-gradient-to-r from-primary/10 via-secondary/10 to-background rounded-xl blur-3xl -z-10" />
          <div className="bg-card/20 border rounded-xl shadow-xl overflow-hidden backdrop-blur-sm">
            <img
              src="https://placehold.co/1200x600/22272e/888888?text=Dashboard+Preview"
              alt="Application Dashboard"
              className="w-full h-auto"
            />
          </div>
        </div>
      </motion.div>

      {/* Features Section */}
      <section id="features" className="py-20 px-4 bg-muted/30">
        <div className="container mx-auto">
          <motion.div
            className="text-center mb-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Key Features
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Our platform provides all the tools you need to optimize your
              affiliate strategy.
            </p>
          </motion.div>

          <motion.div
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
          >
            {/* Feature 1 */}
            <motion.div variants={fadeIn}>
              <Card className="h-full bg-card/50 backdrop-blur-sm hover:shadow-md transition-all border-primary/10 hover:border-primary/30">
                <CardHeader>
                  <Globe className="h-10 w-10 text-primary mb-4" />
                  <CardTitle>Geographic Customization</CardTitle>
                  <CardDescription>
                    Adapt your links based on your visitors' location
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    <li className="flex items-start">
                      <span className="mr-2 mt-1 text-primary">✓</span>
                      Custom short links for your campaigns
                    </li>
                    <li className="flex items-start">
                      <span className="mr-2 mt-1 text-primary">✓</span>
                      Different redirections per country
                    </li>
                    <li className="flex items-start">
                      <span className="mr-2 mt-1 text-primary">✓</span>
                      Maximize impact in each market
                    </li>
                  </ul>
                </CardContent>
              </Card>
            </motion.div>

            {/* Feature 2 */}
            <motion.div variants={fadeIn}>
              <Card className="h-full bg-card/50 backdrop-blur-sm hover:shadow-md transition-all border-primary/10 hover:border-primary/30">
                <CardHeader>
                  <Link className="h-10 w-10 text-primary mb-4" />
                  <CardTitle>Intelligent Rule Management</CardTitle>
                  <CardDescription>
                    Configure redirections based on user profiles
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    <li className="flex items-start">
                      <span className="mr-2 mt-1 text-primary">✓</span>
                      Automatic redirection rules
                    </li>
                    <li className="flex items-start">
                      <span className="mr-2 mt-1 text-primary">✓</span>
                      Different links for the same product
                    </li>
                    <li className="flex items-start">
                      <span className="mr-2 mt-1 text-primary">✓</span>
                      Optimize conversions by segment
                    </li>
                  </ul>
                </CardContent>
              </Card>
            </motion.div>

            {/* Feature 3 */}
            <motion.div variants={fadeIn}>
              <Card className="h-full bg-card/50 backdrop-blur-sm hover:shadow-md transition-all border-primary/10 hover:border-primary/30">
                <CardHeader>
                  <BarChart3 className="h-10 w-10 text-primary mb-4" />
                  <CardTitle>Performance Analysis</CardTitle>
                  <CardDescription>
                    Track the effectiveness of your campaigns in detail
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    <li className="flex items-start">
                      <span className="mr-2 mt-1 text-primary">✓</span>
                      Detailed statistics on clicks and conversions
                    </li>
                    <li className="flex items-start">
                      <span className="mr-2 mt-1 text-primary">✓</span>
                      Analyses by country and period
                    </li>
                    <li className="flex items-start">
                      <span className="mr-2 mt-1 text-primary">✓</span>
                      Visual dashboard with your best performances
                    </li>
                  </ul>
                </CardContent>
              </Card>
            </motion.div>

            {/* Feature 4 */}
            <motion.div variants={fadeIn}>
              <Card className="h-full bg-card/50 backdrop-blur-sm hover:shadow-md transition-all border-primary/10 hover:border-primary/30">
                <CardHeader>
                  <Users className="h-10 w-10 text-primary mb-4" />
                  <CardTitle>Project Organization</CardTitle>
                  <CardDescription>
                    Segment your campaigns for effective management
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    <li className="flex items-start">
                      <span className="mr-2 mt-1 text-primary">✓</span>
                      Separate projects for each campaign
                    </li>
                    <li className="flex items-start">
                      <span className="mr-2 mt-1 text-primary">✓</span>
                      Intuitive management interface
                    </li>
                    <li className="flex items-start">
                      <span className="mr-2 mt-1 text-primary">✓</span>
                      Statistics segmented by project
                    </li>
                  </ul>
                </CardContent>
              </Card>
            </motion.div>

            {/* Feature 5 */}
            <motion.div variants={fadeIn}>
              <Card className="h-full bg-card/50 backdrop-blur-sm hover:shadow-md transition-all border-primary/10 hover:border-primary/30">
                <CardHeader>
                  <ShieldCheck className="h-10 w-10 text-primary mb-4" />
                  <CardTitle>Advanced Security</CardTitle>
                  <CardDescription>
                    Protect your data and account
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    <li className="flex items-start">
                      <span className="mr-2 mt-1 text-primary">✓</span>
                      Two-factor authentication (2FA)
                    </li>
                    <li className="flex items-start">
                      <span className="mr-2 mt-1 text-primary">✓</span>
                      Secure access management
                    </li>
                    <li className="flex items-start">
                      <span className="mr-2 mt-1 text-primary">✓</span>
                      Recovery codes for emergency access
                    </li>
                  </ul>
                </CardContent>
              </Card>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Benefits Section */}
      <section id="benefits" className="py-20 px-4">
        <div className="container mx-auto">
          <motion.div
            className="text-center mb-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Influencer Benefits
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Maximize your affiliate revenue with tools adapted to your
              international audience.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <motion.div
              className="order-2 md:order-1"
              initial={{ opacity: 0, x: -40 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
            >
              <h3 className="text-2xl font-bold mb-6">
                Increase Your Conversions
              </h3>
              <div className="space-y-6">
                <div className="flex gap-4">
                  <div className="flex-shrink-0 h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                    <span className="text-primary font-bold text-lg">1</span>
                  </div>
                  <div>
                    <h4 className="font-semibold text-lg mb-1">
                      Adaptation to Local Markets
                    </h4>
                    <p className="text-muted-foreground">
                      Automatically redirect your visitors to platforms suited
                      to their country to maximize conversion chances.
                    </p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="flex-shrink-0 h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                    <span className="text-primary font-bold text-lg">2</span>
                  </div>
                  <div>
                    <h4 className="font-semibold text-lg mb-1">
                      Real-Time Optimization
                    </h4>
                    <p className="text-muted-foreground">
                      Analyze the performance of your links and quickly adjust
                      your strategies with real-time data.
                    </p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="flex-shrink-0 h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                    <span className="text-primary font-bold text-lg">3</span>
                  </div>
                  <div>
                    <h4 className="font-semibold text-lg mb-1">
                      Simplified Campaign Management
                    </h4>
                    <p className="text-muted-foreground">
                      An intuitive interface allows you to easily manage all
                      your affiliate links and projects.
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>

            <motion.div
              className="order-1 md:order-2 bg-card/20 border rounded-xl shadow-lg overflow-hidden backdrop-blur-sm"
              initial={{ opacity: 0, x: 40 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
            >
              <img
                src="https://placehold.co/600x400/22272e/888888?text=Analytics+Dashboard"
                alt="Analytics Dashboard"
                className="w-full h-auto"
              />
            </motion.div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 bg-primary/5">
        <motion.div
          className="container mx-auto text-center max-w-3xl"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            Ready to Optimize Your Affiliate Revenue?
          </h2>
          <p className="text-xl text-muted-foreground mb-8">
            Join thousands of influencers who are increasing their conversions
            with our platform.
          </p>
          <Button size="lg" className="px-8" asChild>
            <RouterLink to="/register">Create Free Account</RouterLink>
          </Button>
          <p className="mt-4 text-sm text-muted-foreground">
            No credit card required • Set up in minutes
          </p>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="border-t py-12 px-4">
        <div className="container mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center gap-2 mb-6 md:mb-0">
              <img src="/images/logo.avif" alt="Logo" className="h-8 w-auto" />
              <span className="font-semibold">rflnk</span>
            </div>
            <div className="flex flex-col md:flex-row gap-6 md:gap-12 text-center md:text-left">
              <RouterLink
                to="/login"
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                Login
              </RouterLink>
              <RouterLink
                to="/register"
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                Sign Up
              </RouterLink>
              <a
                href="#features"
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                Features
              </a>
              <a
                href="#benefits"
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                Benefits
              </a>
            </div>
          </div>
          <div className="mt-8 pt-8 border-t text-center text-sm text-muted-foreground">
            &copy; {new Date().getFullYear()}{" "}
            <a href="https://pleiades.solutions">Pleiades.solutions</a>. All
            rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
