import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Plus, MapPin, Upload, FileText } from "lucide-react";
import { ProjectRegistrationForm } from "@/components/ProjectRegistrationForm";
import { MRVSubmissionForm } from "@/components/MRVSubmissionForm";
import { ProjectMap } from "@/components/ProjectMap";

const NGODashboard = () => {
  const [activeTab, setActiveTab] = useState<'overview' | 'register' | 'submit-mrv'>('overview');
  
  // Mock project data
  const projects = [
    {
      id: 1,
      name: "Mangrove Restoration Bay Area",
      status: "Active",
      area: "250 hectares",
      carbonEstimate: "1,250 tonnes CO2",
      lastMRV: "2024-01-15",
      coordinates: { lat: -6.2088, lng: 106.8456 }
    },
    {
      id: 2,
      name: "Seagrass Conservation Project",
      status: "Pending Verification",
      area: "180 hectares", 
      carbonEstimate: "890 tonnes CO2",
      lastMRV: "2024-01-10",
      coordinates: { lat: -6.1744, lng: 106.8227 }
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-subtle">
      {/* Header */}
      <div className="bg-card shadow-sm border-b">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="sm" asChild>
                <Link to="/" className="flex items-center gap-2">
                  <ArrowLeft className="h-4 w-4" />
                  Back to Home
                </Link>
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-card-foreground">NGO Dashboard</h1>
                <p className="text-muted-foreground">Manage your blue carbon projects</p>
              </div>
            </div>
            <Badge className="bg-accent/10 text-accent border-accent/20">
              🌱 Conservation Partner
            </Badge>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 py-8">
        {/* Navigation Tabs */}
        <div className="flex flex-col sm:flex-row gap-4 mb-8">
          <Button
            variant={activeTab === 'overview' ? 'default' : 'outline'}
            onClick={() => setActiveTab('overview')}
            className="justify-start"
          >
            <FileText className="h-4 w-4 mr-2" />
            Project Overview
          </Button>
          <Button
            variant={activeTab === 'register' ? 'default' : 'outline'}
            onClick={() => setActiveTab('register')}
            className="justify-start"
          >
            <Plus className="h-4 w-4 mr-2" />
            Register New Project
          </Button>
          <Button
            variant={activeTab === 'submit-mrv' ? 'default' : 'outline'}
            onClick={() => setActiveTab('submit-mrv')}
            className="justify-start"
          >
            <Upload className="h-4 w-4 mr-2" />
            Submit MRV Package
          </Button>
        </div>

        {/* Content */}
        {activeTab === 'overview' && (
          <div className="space-y-8">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-2xl font-bold text-primary">2</CardTitle>
                  <CardDescription>Active Projects</CardDescription>
                </CardHeader>
              </Card>
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-2xl font-bold text-accent">430 ha</CardTitle>
                  <CardDescription>Total Area</CardDescription>
                </CardHeader>
              </Card>
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-2xl font-bold text-secondary">2,140</CardTitle>
                  <CardDescription>Estimated CO2 Tonnes</CardDescription>
                </CardHeader>
              </Card>
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-2xl font-bold text-primary">856</CardTitle>
                  <CardDescription>Tokens Earned</CardDescription>
                </CardHeader>
              </Card>
            </div>

            {/* Map */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-5 w-5 text-primary" />
                  Project Locations
                </CardTitle>
                <CardDescription>
                  Interactive map showing your registered blue carbon projects
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-96 rounded-lg overflow-hidden">
                  <ProjectMap projects={projects} />
                </div>
              </CardContent>
            </Card>

            {/* Projects List */}
            <Card>
              <CardHeader>
                <CardTitle>Your Projects</CardTitle>
                <CardDescription>
                  Manage and monitor your blue carbon restoration projects
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {projects.map((project) => (
                    <div
                      key={project.id}
                      className="flex items-center justify-between p-4 border border-border rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <div>
                        <h3 className="font-semibold text-card-foreground">{project.name}</h3>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                          <span>Area: {project.area}</span>
                          <span>Carbon: {project.carbonEstimate}</span>
                          <span>Last MRV: {project.lastMRV}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Badge
                          variant={project.status === 'Active' ? 'default' : 'secondary'}
                          className={project.status === 'Active' ? 'bg-accent' : 'bg-secondary'}
                        >
                          {project.status}
                        </Badge>
                        <Button size="sm" variant="outline">
                          View Details
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {activeTab === 'register' && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Plus className="h-5 w-5 text-primary" />
                Register New Blue Carbon Project
              </CardTitle>
              <CardDescription>
                Create a new project registration with geospatial boundaries and baseline data
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ProjectRegistrationForm onSuccess={() => setActiveTab('overview')} />
            </CardContent>
          </Card>
        )}

        {activeTab === 'submit-mrv' && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="h-5 w-5 text-accent" />
                Submit MRV Package
              </CardTitle>
              <CardDescription>
                Upload monitoring data, drone imagery, and field measurements for verification
              </CardDescription>
            </CardHeader>
            <CardContent>
              <MRVSubmissionForm onSuccess={() => setActiveTab('overview')} />
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default NGODashboard;