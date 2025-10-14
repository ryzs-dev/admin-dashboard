'use client';
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  BarChart3,
  Zap,
  Users,
  Mail,
  MessageSquare,
  TrendingUp,
  Check,
  ArrowRight,
  Star,
} from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function CRMLanding() {
  const [email, setEmail] = useState('');

  const router = useRouter();

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="border-b bg-white/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-slate-900 rounded-lg"></div>
              <span className="text-xl font-semibold">CRMFlow</span>
            </div>
            <div className="hidden md:flex items-center gap-8">
              <a
                href="#features"
                className="text-sm text-slate-600 hover:text-slate-900 transition"
              >
                Features
              </a>
              <a
                href="#integrations"
                className="text-sm text-slate-600 hover:text-slate-900 transition"
              >
                Integrations
              </a>
              <a
                href="#pricing"
                className="text-sm text-slate-600 hover:text-slate-900 transition"
              >
                Pricing
              </a>
            </div>
            <Button
              className="bg-slate-900 hover:bg-slate-800"
              onClick={() => router.push('/login')}
            >
              Get Started
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-6 py-24 md:py-32">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div className="space-y-8">
            <Badge variant="outline" className="text-sm">
              Trusted by 50,000+ companies
            </Badge>
            <h1 className="text-5xl md:text-6xl font-bold tracking-tight text-slate-900">
              Customer relationships, simplified
            </h1>
            <p className="text-xl text-slate-600 leading-relaxed">
              The modern CRM platform that helps you close deals faster,
              automate workflows, and grow your business with confidence.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Button
                size="lg"
                className="bg-slate-900 hover:bg-slate-800 text-base"
              >
                Start free trial <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
              <Button size="lg" variant="outline">
                Watch demo
              </Button>
            </div>
            <div className="flex items-center gap-6 pt-4">
              <div className="flex -space-x-2">
                {[1, 2, 3, 4].map((i) => (
                  <div
                    key={i}
                    className="w-10 h-10 rounded-full bg-slate-200 border-2 border-white"
                  ></div>
                ))}
              </div>
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Star
                    key={i}
                    className="w-4 h-4 fill-slate-900 text-slate-900"
                  />
                ))}
                <span className="ml-2 text-sm text-slate-600">
                  4.9 from 2,000+ reviews
                </span>
              </div>
            </div>
          </div>

          <div className="relative">
            <Card className="shadow-xl border-slate-200">
              <CardHeader className="space-y-4">
                <div className="flex items-center justify-between">
                  <Badge>Live Dashboard</Badge>
                  <div className="flex gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                    <span className="text-xs text-slate-500">Real-time</span>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-600">Monthly Revenue</span>
                    <span className="font-semibold">$124,500</span>
                  </div>
                  <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full w-3/4 bg-slate-900 rounded-full"></div>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4 pt-4">
                  <div className="space-y-1">
                    <div className="text-2xl font-bold">847</div>
                    <div className="text-xs text-slate-500">Active Leads</div>
                  </div>
                  <div className="space-y-1">
                    <div className="text-2xl font-bold">94%</div>
                    <div className="text-xs text-slate-500">Close Rate</div>
                  </div>
                  <div className="space-y-1">
                    <div className="text-2xl font-bold">32</div>
                    <div className="text-xs text-slate-500">Deals Won</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="bg-slate-50 py-24">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <Badge variant="outline" className="mb-4">
              Features
            </Badge>
            <h2 className="text-4xl font-bold text-slate-900 mb-4">
              Everything you need to succeed
            </h2>
            <p className="text-lg text-slate-600">
              Powerful tools designed to help your team work smarter, not
              harder.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <Card className="border-slate-200 hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="w-12 h-12 bg-slate-900 rounded-lg flex items-center justify-center mb-4">
                  <Zap className="w-6 h-6 text-white" />
                </div>
                <CardTitle>Smart Automation</CardTitle>
                <CardDescription className="text-base">
                  Automate repetitive tasks and focus on what matters. Set up
                  workflows in minutes, not hours.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-slate-200 hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="w-12 h-12 bg-slate-900 rounded-lg flex items-center justify-center mb-4">
                  <BarChart3 className="w-6 h-6 text-white" />
                </div>
                <CardTitle>Advanced Analytics</CardTitle>
                <CardDescription className="text-base">
                  Real-time insights into your pipeline. Make data-driven
                  decisions with beautiful dashboards.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-slate-200 hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="w-12 h-12 bg-slate-900 rounded-lg flex items-center justify-center mb-4">
                  <Users className="w-6 h-6 text-white" />
                </div>
                <CardTitle>Team Collaboration</CardTitle>
                <CardDescription className="text-base">
                  Work together seamlessly. Share insights and collaborate with
                  your team in real-time.
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </section>

      {/* Integrations Section */}
      <section id="integrations" className="py-24">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <Badge variant="outline" className="mb-4">
              Integrations
            </Badge>
            <h2 className="text-4xl font-bold text-slate-900 mb-4">
              Connect your favorite tools
            </h2>
            <p className="text-lg text-slate-600">
              Seamlessly integrate with the tools you already use every day.
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[
              { icon: Mail, name: 'Email' },
              { icon: MessageSquare, name: 'Slack' },
              { icon: TrendingUp, name: 'Analytics' },
              { icon: Users, name: 'Teams' },
            ].map((integration, i) => (
              <Card
                key={i}
                className="border-slate-200 hover:shadow-lg transition-shadow"
              >
                <CardContent className="flex flex-col items-center justify-center p-8">
                  <integration.icon className="w-8 h-8 text-slate-700 mb-3" />
                  <span className="font-medium text-slate-900">
                    {integration.name}
                  </span>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="bg-slate-50 py-24">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <Badge variant="outline" className="mb-4">
              Pricing
            </Badge>
            <h2 className="text-4xl font-bold text-slate-900 mb-4">
              Simple, transparent pricing
            </h2>
            <p className="text-lg text-slate-600">
              Choose the plan that fits your needs. All plans include a 14-day
              free trial.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            <Card className="border-slate-200">
              <CardHeader>
                <CardTitle className="text-2xl">Starter</CardTitle>
                <CardDescription>Perfect for small teams</CardDescription>
                <div className="pt-4">
                  <span className="text-4xl font-bold">$29</span>
                  <span className="text-slate-600">/month</span>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <ul className="space-y-3">
                  {[
                    '1,000 contacts',
                    'Basic automation',
                    'Email support',
                    '5 team members',
                  ].map((feature, i) => (
                    <li key={i} className="flex items-center gap-3">
                      <Check className="w-5 h-5 text-slate-900" />
                      <span className="text-slate-600">{feature}</span>
                    </li>
                  ))}
                </ul>
                <Button variant="outline" className="w-full">
                  Start free trial
                </Button>
              </CardContent>
            </Card>

            <Card className="border-slate-900 shadow-xl relative">
              <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-slate-900">
                Most Popular
              </Badge>
              <CardHeader>
                <CardTitle className="text-2xl">Professional</CardTitle>
                <CardDescription>For growing businesses</CardDescription>
                <div className="pt-4">
                  <span className="text-4xl font-bold">$99</span>
                  <span className="text-slate-600">/month</span>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <ul className="space-y-3">
                  {[
                    'Unlimited contacts',
                    'Advanced automation',
                    'Priority support',
                    'Unlimited team members',
                    'Custom integrations',
                  ].map((feature, i) => (
                    <li key={i} className="flex items-center gap-3">
                      <Check className="w-5 h-5 text-slate-900" />
                      <span className="text-slate-600">{feature}</span>
                    </li>
                  ))}
                </ul>
                <Button className="w-full bg-slate-900 hover:bg-slate-800">
                  Start free trial
                </Button>
              </CardContent>
            </Card>

            <Card className="border-slate-200">
              <CardHeader>
                <CardTitle className="text-2xl">Enterprise</CardTitle>
                <CardDescription>For large organizations</CardDescription>
                <div className="pt-4">
                  <span className="text-4xl font-bold">Custom</span>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <ul className="space-y-3">
                  {[
                    'Everything in Pro',
                    'Dedicated support',
                    'Custom development',
                    'SLA guarantee',
                    'Advanced security',
                  ].map((feature, i) => (
                    <li key={i} className="flex items-center gap-3">
                      <Check className="w-5 h-5 text-slate-900" />
                      <span className="text-slate-600">{feature}</span>
                    </li>
                  ))}
                </ul>
                <Button variant="outline" className="w-full">
                  Contact sales
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24">
        <div className="max-w-4xl mx-auto px-6">
          <Card className="border-slate-900 bg-slate-900 text-white">
            <CardContent className="p-12 text-center space-y-6">
              <h2 className="text-3xl md:text-4xl font-bold">
                Ready to transform your business?
              </h2>
              <p className="text-lg text-slate-300 max-w-2xl mx-auto">
                Join thousands of companies using CRMFlow to manage their
                customer relationships better.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto pt-4">
                <Input
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="bg-white text-slate-900"
                />
                <Button className="bg-white text-slate-900 hover:bg-slate-100 whitespace-nowrap">
                  Get started
                </Button>
              </div>
              <p className="text-sm text-slate-400">
                14-day free trial. No credit card required.
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t bg-slate-50 py-12">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-slate-900 rounded-lg"></div>
                <span className="text-xl font-semibold">CRMFlow</span>
              </div>
              <p className="text-sm text-slate-600">
                Transform your customer relationships with smart automation.
              </p>
            </div>

            {[
              {
                title: 'Product',
                links: ['Features', 'Integrations', 'Pricing', 'Updates'],
              },
              {
                title: 'Company',
                links: ['About', 'Blog', 'Careers', 'Press'],
              },
              {
                title: 'Legal',
                links: ['Privacy', 'Terms', 'Security', 'Cookies'],
              },
            ].map((section, i) => (
              <div key={i}>
                <h4 className="font-semibold mb-4">{section.title}</h4>
                <ul className="space-y-2">
                  {section.links.map((link, j) => (
                    <li key={j}>
                      <a
                        href="#"
                        className="text-sm text-slate-600 hover:text-slate-900 transition"
                      >
                        {link}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div className="border-t pt-8 text-center text-sm text-slate-600">
            <p>&copy; 2025 CRMFlow. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
