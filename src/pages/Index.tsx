import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, CheckCircle, ShoppingCart, Waves, Leaf, Shield } from "lucide-react";

const Index = () => {
  const features = [
    {
      icon: <Users className="h-8 w-8 text-primary" />,
      title: "NGO Project Registration",
      description: "Register blue carbon projects with geospatial data and evidence",
      link: "/ngo",
      color: "bg-gradient-ocean"
    },
    {
      icon: <CheckCircle className="h-8 w-8 text-accent" />,
      title: "MRV Verification",
      description: "Review and verify Monitoring, Reporting & Verification packages",
      link: "/verifier", 
      color: "bg-gradient-carbon"
    },
    {
      icon: <ShoppingCart className="h-8 w-8 text-secondary" />,
      title: "Carbon Marketplace",
      description: "Buy, sell and retire verified blue carbon credits",
      link: "/marketplace",
      color: "bg-gradient-subtle"
    }
  ];

  const stats = [
    { label: "Active Projects", value: "127", icon: <Waves className="h-5 w-5" /> },
    { label: "Carbon Tonnes Verified", value: "45,231", icon: <Leaf className="h-5 w-5" /> },
    { label: "Tokens Retired", value: "12,456", icon: <Shield className="h-5 w-5" /> }
  ];

  return (
    <div className="min-h-screen bg-gradient-hero">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-hero opacity-90" />
        
        <div className="relative container mx-auto px-6 py-20">
          <div className="text-center mb-16">
            <Badge className="mb-6 bg-primary/10 text-primary border-primary/20 hover:bg-primary/20">
              🌊 Blockchain-Powered Blue Carbon Registry
            </Badge>
            
            <h1 className="text-6xl font-bold text-primary-foreground mb-6 leading-tight">
              Blue Carbon
              <span className="block text-transparent bg-clip-text bg-gradient-carbon">
                Registry & MRV
              </span>
            </h1>
            
            <p className="text-xl text-primary-foreground/80 max-w-3xl mx-auto mb-8 leading-relaxed">
              A transparent, blockchain-based system for monitoring, reporting, and verifying 
              blue carbon sequestration in mangroves, seagrass beds, and salt marshes.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" className="bg-accent hover:bg-accent-light text-accent-foreground shadow-carbon">
                <Link to="/ngo" className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Register Project
                </Link>
              </Button>
              <Button variant="outline" size="lg" className="border-primary-foreground/20 text-primary-foreground hover:bg-primary-foreground/10">
                <Link to="/marketplace" className="flex items-center gap-2">
                  <ShoppingCart className="h-5 w-5" />
                  Explore Marketplace
                </Link>
              </Button>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
            {stats.map((stat, index) => (
              <Card key={index} className="bg-card/80 backdrop-blur-lg border-border/50 shadow-elegant">
                <CardContent className="p-6 text-center">
                  <div className="flex items-center justify-center mb-3">
                    <div className="p-2 rounded-full bg-primary/10">
                      {stat.icon}
                    </div>
                  </div>
                  <h3 className="text-3xl font-bold text-card-foreground mb-1">{stat.value}</h3>
                  <p className="text-muted-foreground">{stat.label}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Feature Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <Card key={index} className="group hover:scale-105 transition-all duration-300 bg-card/90 backdrop-blur-lg border-border/50 shadow-elegant hover:shadow-ocean">
                <CardHeader className="pb-4">
                  <div className={`w-16 h-16 rounded-2xl ${feature.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}>
                    {feature.icon}
                  </div>
                  <CardTitle className="text-xl text-card-foreground">{feature.title}</CardTitle>
                  <CardDescription className="text-muted-foreground">
                    {feature.description}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button asChild className="w-full bg-primary hover:bg-primary-dark text-primary-foreground shadow-ocean">
                    <Link to={feature.link}>
                      Get Started
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* How it Works */}
          <div className="mt-20 text-center">
            <h2 className="text-4xl font-bold text-primary-foreground mb-12">How It Works</h2>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
              <div className="flex flex-col items-center">
                <div className="w-12 h-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xl font-bold mb-4">1</div>
                <h3 className="text-lg font-semibold text-primary-foreground mb-2">Register Project</h3>
                <p className="text-primary-foreground/70 text-sm">NGOs register blue carbon restoration projects with geospatial boundaries</p>
              </div>
              <div className="flex flex-col items-center">
                <div className="w-12 h-12 rounded-full bg-secondary text-secondary-foreground flex items-center justify-center text-xl font-bold mb-4">2</div>
                <h3 className="text-lg font-semibold text-primary-foreground mb-2">Submit Evidence</h3>
                <p className="text-primary-foreground/70 text-sm">Upload drone imagery, field measurements, and MRV data packages to IPFS</p>
              </div>
              <div className="flex flex-col items-center">
                <div className="w-12 h-12 rounded-full bg-accent text-accent-foreground flex items-center justify-center text-xl font-bold mb-4">3</div>
                <h3 className="text-lg font-semibold text-primary-foreground mb-2">Verification</h3>
                <p className="text-primary-foreground/70 text-sm">Independent verifiers review evidence and approve carbon credit issuance</p>
              </div>
              <div className="flex flex-col items-center">
                <div className="w-12 h-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xl font-bold mb-4">4</div>
                <h3 className="text-lg font-semibold text-primary-foreground mb-2">Mint & Trade</h3>
                <p className="text-primary-foreground/70 text-sm">Verified credits are minted as ERC20 tokens and traded on the marketplace</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;