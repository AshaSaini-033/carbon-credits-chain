import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Upload, FileText, Camera, Loader2, CheckCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { FileUploader } from "./FileUploader";

interface MRVSubmissionFormProps {
  onSuccess: () => void;
}

export const MRVSubmissionForm = ({ onSuccess }: MRVSubmissionFormProps) => {
  const [formData, setFormData] = useState({
    projectId: "",
    carbonTonnes: "",
    methodology: "",
    measurementDate: "",
    coordinates: {
      latitude: "",
      longitude: ""
    },
    biomassData: {
      canopyArea: "",
      avgBiomassDensity: "",
      biomassKg: "",
      carbonKg: ""
    },
    additionalNotes: ""
  });
  
  const [files, setFiles] = useState<File[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  // Mock project list
  const availableProjects = [
    { id: 1, name: "Mangrove Restoration Bay Area" },
    { id: 2, name: "Seagrass Conservation Project" }
  ];

  const calculateCarbonFromBiomass = () => {
    const { canopyArea, avgBiomassDensity } = formData.biomassData;
    if (canopyArea && avgBiomassDensity) {
      const biomassKg = parseFloat(canopyArea) * parseFloat(avgBiomassDensity);
      const carbonKg = biomassKg * 0.47; // 47% carbon content in biomass
      const co2Tonnes = (carbonKg * 3.67) / 1000; // Convert to CO2 equivalent tonnes
      
      setFormData(prev => ({
        ...prev,
        biomassData: {
          ...prev.biomassData,
          biomassKg: biomassKg.toFixed(2),
          carbonKg: carbonKg.toFixed(2)
        },
        carbonTonnes: co2Tonnes.toFixed(2)
      }));
    }
  };

  const handleFileChange = (newFiles: File[]) => {
    setFiles(newFiles);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Validate form
      if (!formData.projectId || !formData.carbonTonnes || !formData.methodology) {
        throw new Error("Please fill in all required fields");
      }

      if (files.length === 0) {
        throw new Error("Please upload at least one evidence file");
      }

      // Create MRV package data
      const mrvPackage = {
        projectId: parseInt(formData.projectId),
        carbonTonnes: parseFloat(formData.carbonTonnes),
        methodology: formData.methodology,
        measurementDate: formData.measurementDate,
        coordinates: {
          latitude: parseFloat(formData.coordinates.latitude),
          longitude: parseFloat(formData.coordinates.longitude)
        },
        biomassData: {
          canopyArea: parseFloat(formData.biomassData.canopyArea),
          avgBiomassDensity: parseFloat(formData.biomassData.avgBiomassDensity),
          biomassKg: parseFloat(formData.biomassData.biomassKg),
          carbonKg: parseFloat(formData.biomassData.carbonKg)
        },
        additionalMetadata: {
          notes: formData.additionalNotes,
          submissionDate: new Date().toISOString(),
          evidenceCount: files.length
        }
      };

      // Simulate API call to submit MRV package
      await new Promise(resolve => setTimeout(resolve, 3000));

      toast({
        title: "MRV Package Submitted Successfully",
        description: `Your MRV package claiming ${formData.carbonTonnes} tonnes CO2 has been submitted for verification.`,
      });

      // Reset form
      setFormData({
        projectId: "",
        carbonTonnes: "",
        methodology: "",
        measurementDate: "",
        coordinates: { latitude: "", longitude: "" },
        biomassData: { canopyArea: "", avgBiomassDensity: "", biomassKg: "", carbonKg: "" },
        additionalNotes: ""
      });
      setFiles([]);

      onSuccess();
      
    } catch (error: any) {
      toast({
        title: "Submission Failed",
        description: error.message || "Failed to submit MRV package",
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
          {/* Left Column */}
          <div className="space-y-4">
            <div>
              <Label htmlFor="projectId">Select Project *</Label>
              <select
                id="projectId"
                className="w-full px-3 py-2 border border-border rounded-md bg-background"
                value={formData.projectId}
                onChange={(e) => setFormData(prev => ({ ...prev, projectId: e.target.value }))}
                required
              >
                <option value="">Select a project</option>
                {availableProjects.map(project => (
                  <option key={project.id} value={project.id}>{project.name}</option>
                ))}
              </select>
            </div>

            <div>
              <Label htmlFor="methodology">Methodology *</Label>
              <select
                id="methodology"
                className="w-full px-3 py-2 border border-border rounded-md bg-background"
                value={formData.methodology}
                onChange={(e) => setFormData(prev => ({ ...prev, methodology: e.target.value }))}
                required
              >
                <option value="">Select Methodology</option>
                <option value="vcs">Verified Carbon Standard (VCS)</option>
                <option value="bcm">Blue Carbon Methodology</option>
                <option value="bci">Blue Carbon Initiative Protocol</option>
                <option value="plan-vivo">Plan Vivo Standard</option>
              </select>
            </div>

            <div>
              <Label htmlFor="measurementDate">Measurement Date *</Label>
              <Input
                id="measurementDate"
                type="date"
                value={formData.measurementDate}
                onChange={(e) => setFormData(prev => ({ ...prev, measurementDate: e.target.value }))}
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
                  value={formData.coordinates.latitude}
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    coordinates: { ...prev.coordinates, latitude: e.target.value }
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
                  value={formData.coordinates.longitude}
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    coordinates: { ...prev.coordinates, longitude: e.target.value }
                  }))}
                />
              </div>
            </div>
          </div>

          {/* Right Column */}
          <div className="space-y-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Biomass Calculation
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="canopyArea">Canopy Area (m²)</Label>
                    <Input
                      id="canopyArea"
                      type="number"
                      placeholder="5000"
                      value={formData.biomassData.canopyArea}
                      onChange={(e) => setFormData(prev => ({ 
                        ...prev, 
                        biomassData: { ...prev.biomassData, canopyArea: e.target.value }
                      }))}
                      onBlur={calculateCarbonFromBiomass}
                    />
                  </div>
                  <div>
                    <Label htmlFor="avgBiomassDensity">Avg Density (kg/m²)</Label>
                    <Input
                      id="avgBiomassDensity"
                      type="number"
                      step="0.1"
                      placeholder="15.5"
                      value={formData.biomassData.avgBiomassDensity}
                      onChange={(e) => setFormData(prev => ({ 
                        ...prev, 
                        biomassData: { ...prev.biomassData, avgBiomassDensity: e.target.value }
                      }))}
                      onBlur={calculateCarbonFromBiomass}
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Biomass (kg)</Label>
                    <Input
                      value={formData.biomassData.biomassKg}
                      readOnly
                      className="bg-muted"
                    />
                  </div>
                  <div>
                    <Label>Carbon (kg)</Label>
                    <Input
                      value={formData.biomassData.carbonKg}
                      readOnly
                      className="bg-muted"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="carbonTonnes">Total Carbon (tonnes CO2) *</Label>
                  <Input
                    id="carbonTonnes"
                    type="number"
                    step="0.01"
                    placeholder="125.50"
                    value={formData.carbonTonnes}
                    onChange={(e) => setFormData(prev => ({ ...prev, carbonTonnes: e.target.value }))}
                    required
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Evidence Upload */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Camera className="h-5 w-5 text-accent" />
              Evidence Files
            </CardTitle>
          </CardHeader>
          <CardContent>
            <FileUploader 
              files={files}
              onFilesChange={handleFileChange}
              acceptedTypes="image/*,.json"
              maxFiles={10}
              maxSize={20}
            />
            <p className="text-sm text-muted-foreground mt-2">
              Upload drone imagery, field photos, and measurement data (JSON). Max 10 files, 20MB each.
            </p>
          </CardContent>
        </Card>

        {/* Additional Notes */}
        <div>
          <Label htmlFor="additionalNotes">Additional Notes</Label>
          <Textarea
            id="additionalNotes"
            placeholder="Provide any additional context, measurement methodology details, environmental conditions, or observations that support your MRV submission..."
            rows={4}
            value={formData.additionalNotes}
            onChange={(e) => setFormData(prev => ({ ...prev, additionalNotes: e.target.value }))}
          />
        </div>

        <Button 
          type="submit" 
          disabled={isSubmitting || files.length === 0}
          className="w-full bg-accent hover:bg-accent-light text-accent-foreground shadow-carbon"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Uploading to IPFS & Submitting...
            </>
          ) : (
            <>
              <Upload className="mr-2 h-4 w-4" />
              Submit MRV Package for Verification
            </>
          )}
        </Button>
      </form>
    </div>
  );
};