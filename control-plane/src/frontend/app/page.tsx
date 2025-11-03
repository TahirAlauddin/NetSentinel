import Link from "next/link"
import { ArrowRight, CheckCircle, Zap, Users, BarChart3, Shield } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-red-500 rounded-lg flex items-center justify-center text-white font-bold">N</div>
            <span className="text-xl font-bold text-foreground">NetSentinel</span>
          </div>
          <div className="flex items-center gap-6">
            <Link href="/login" className="text-foreground hover:text-red-500 transition-colors">
              Sign In
            </Link>
            <Link href="/signup">
              <Button className="bg-red-500 hover:bg-gold text-white">Start Free</Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="max-w-6xl mx-auto px-6 py-24 md:py-32">
        <div className="text-center space-y-8">
          <div className="inline-block px-4 py-2 bg-muted border border-border rounded-full text-sm font-medium text-muted-foreground">
            ✨ Enterprise-grade ITSM for modern teams
          </div>

          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-balance leading-tight text-foreground">
            Manage IT Services. <span className="text-red-500">Effortlessly.</span>
          </h1>

          <p className="text-lg text-muted-foreground max-w-2xl mx-auto text-balance">
            Streamline your IT operations with a modern, multi-tenant service management platform designed for teams
            that value speed and simplicity.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-8">
            <Link href="/signup">
              <Button size="lg" className="bg-red-500 hover:bg-gold text-white px-8">
                Get Started Free
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
            <Button size="lg" variant="outline" className="border-border hover:bg-muted bg-transparent">
              View Demo
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="bg-card border-t border-border py-20">
        <div className="max-w-6xl mx-auto px-6">
          <h2 className="text-3xl font-bold text-center mb-16 text-foreground">Built for Enterprise. Simple to Use.</h2>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: Zap,
                title: "Lightning Fast Setup",
                description: "Get your team up and running in minutes. No complex configuration needed.",
              },
              {
                icon: Users,
                title: "Team Collaboration",
                description:
                  "Built-in tools for seamless communication and ticket management across your organization.",
              },
              {
                icon: BarChart3,
                title: "Real-time Analytics",
                description: "Track performance metrics and gain insights into your IT operations instantly.",
              },
              {
                icon: Shield,
                title: "Enterprise Security",
                description: "Bank-level encryption and multi-tenant isolation for complete data protection.",
              },
              {
                icon: CheckCircle,
                title: "Automated Workflows",
                description: "Automate repetitive tasks and let your team focus on what matters.",
              },
              {
                icon: BarChart3,
                title: "Scalable Infrastructure",
                description: "Grows with your business. Handle any volume with our Kubernetes-powered platform.",
              },
            ].map((feature, i) => (
              <div
                key={i}
                className="p-6 bg-background border border-border rounded-lg hover:border-red-500 transition-colors"
              >
                <feature.icon className="w-10 h-10 text-red-500 mb-4" />
                <h3 className="text-lg font-semibold text-foreground mb-2">{feature.title}</h3>
                <p className="text-muted-foreground">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="max-w-6xl mx-auto px-6 py-24">
        <div className="bg-red-500 rounded-lg p-12 md:p-16 text-center space-y-6">
          <h2 className="text-3xl md:text-4xl font-bold text-white">Ready to simplify your IT operations?</h2>
          <p className="text-lg text-white/80 max-w-2xl mx-auto">
            Join hundreds of organizations managing their IT services with NetSentinel. Start your free trial today.
          </p>
          <Link href="/signup">
            <Button size="lg" className="bg-white hover:bg-gold text-red-500 px-8">
              Start Your Free Trial
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border bg-card/50 py-12">
        <div className="max-w-6xl mx-auto px-6 text-center text-muted-foreground">
          <p>© 2025 NetSentinel. Built for teams that value simplicity and reliability.</p>
        </div>
      </footer>
    </div>
  )
}
