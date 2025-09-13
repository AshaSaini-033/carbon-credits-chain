import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { MapPin, Upload, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { ProjectMap } from "./ProjectMap";

interface ProjectRegistrationFormProps {
  onSuccess: () => void;
}

export const ProjectRegistrationForm = ({ onSuccess }: ProjectRegistrationFormProps) => {
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    ownerAddress: "",
    estimatedArea: "",
    expectedCarbon: "",
    methodology: "",
    coordinates: { lat: -6.2088, lng: 106.8456 } // Default to Jakarta Bay
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  // Mock geojson for project boundary
  const mockGeojson = {
    type: "FeatureCollection",
    features: [
      {
        type: "Feature",
        properties: {
          name: formData.name || "New Project"
        },
        geometry: {
          type: "Polygon",
          coordinates: [[
            [formData.coordinates.lng - 0.01, formData.coordinates.lat + 0.01],
            [formData.coordinates.lng + 0.01, formData.coordinates.lat + 0.01],
            [formData.coordinates.lng + 0.01, formData.coordinates.lat - 0.01],
            [formData.coordinates.lng - 0.01, formData.coordinates.lat - 0.01],
            [formData.coordinates.lng - 0.01, formData.coordinates.lat + 0.01]
          ]]
        }
      }
    ]
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Validate form
      if (!formData.name || !formData.description || !formData.ownerAddress) {
        throw new Error("Please fill in all required fields");
      }

      // Simulate API call to register project
      await new Promise(resolve => setTimeout(resolve, 2000));

      toast({
        title: "Project Registered Successfully",
        description: `${formData.name} has been registered with estimated ${formData.expectedCarbon} tonnes CO2 sequestration potential.`,
      });

      // Reset form
      setFormData({
        name: "",
        description: "",
        ownerAddress: "",
        estimatedArea: "",
        expectedCarbon: "",
        methodology: "",
        coordinates: { lat: -6.2088, lng: 106.8456 }
      });

      onSuccess();
      
    } catch (error: any) {
      toast({
        title: "Registration Failed",
        description: error.message || "Failed to register project",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-8">
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div>
              <Label htmlFor="projectName">Project Name *</Label>
              <Input
                id="projectName"
                placeholder="e.g., Mangrove Restoration Bay Area"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                required
              />
            </div>

            <div>
              <Label htmlFor="ownerAddress">Project Owner Address *</Label>
              <Input
                id="ownerAddress"
                placeholder="0x..."
                value={formData.ownerAddress}
                onChange={(e) => setFormData(prev => ({ ...prev, ownerAddress: e.target.value }))}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="estimatedArea">Estimated Area (hectares)</Label>
                <Input
                  id="estimatedArea"
                  type="number"
                  placeholder="250"
                  value={formData.estimatedArea}
                  onChange={(e) => setFormData(prev => ({ ...prev, estimatedArea: e.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="expectedCarbon">Expected Carbon (tonnes CO2)</Label>
                <Input
                  id="expectedCarbon"
                  type="number"
                  placeholder="1250"
                  value={formData.expectedCarbon}
                  onChange={(e) => setFormData(prev => ({ ...prev, expectedCarbon: e.target.value }))}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="methodology">Methodology</Label>
              <select 
                id="methodology"
                className="w-full px-3 py-2 border border-border rounded-md bg-background"
                value={formData.methodology}
                onChange={(e) => setFormData(prev => ({ ...prev, methodology: e.target.value }))}
              >
                <option value="">Select Methodology</option>
                <option value="vcs">Verified Carbon Standard (VCS)</option>
                <option value="bcm">Blue Carbon Methodology</option>
                <option value="bci">Blue Carbon Initiative Protocol</option>
                <option value="plan-vivo">Plan Vivo Standard</option>
              </select>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <Label htmlFor="description">Project Description *</Label>
              <Textarea
                id="description"
                placeholder="Describe your blue carbon restoration project, including ecosystem type (mangroves, seagrass, salt marsh), restoration activities, timeline, and expected environmental benefits..."
                rows={5}
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="latitude">Latitude</Label>
                <Input
                  id="latitude"
                  type="number"
                  step="0.000001"
                  placeholder="-6.2088"
                  value={formData.coordinates.lat}
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    coordinates: { ...prev.coordinates, lat: parseFloat(e.target.value) || 0 }
                  }))}
                />
              </div>
              <div>
                <Label htmlFor="longitude">Longitude</Label>
                <Input
                  id="longitude"
                  type="number"
                  step="0.000001"
                  placeholder="106.8456"
                  value={formData.coordinates.lng}
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    coordinates: { ...prev.coordinates, lng: parseFloat(e.target.value) || 0 }
                  }))}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Project Location Map */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <MapPin className="h-5 w-5 text-primary" />
              <h3 className="font-semibold">Project Location</h3>
            </div>
            <div className="h-64 rounded-lg overflow-hidden">
              <ProjectMap 
                projects={[{
                  id: 0,
                  name: formData.name || "New Project",
                  coordinates: formData.coordinates,
                  status: "Draft",
                  area: formData.estimatedArea + " hectares",
                  carbonEstimate: formData.expectedCarbon + " tonnes CO2",
                  lastMRV: "Not submitted"
                }]} 
                center={formData.coordinates}
              />
            </div>
            <p className="text-sm text-muted-foreground mt-2">
              Click on the map or adjust coordinates to set your project location
            </p>
          </CardContent>
        </Card>

        <Button 
          type="submit" 
          disabled={isSubmitting}
          className="w-full bg-primary hover:bg-primary-dark text-primary-foreground shadow-ocean"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Registering Project...
            </>
          ) : (
            <>
              <Upload className="mr-2 h-4 w-4" />
              Register Blue Carbon Project
            </>
          )}
        </Button>
      </form>
    </div>
  );
};