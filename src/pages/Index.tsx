import { useState } from 'react';
import { Upload, Camera, FileText, User, Clock, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';

const Index = () => {
  const [formData, setFormData] = useState({
    name: '',
    symptoms: '',
    duration: '',
  });
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<any>(null);
  const { toast } = useToast();

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedImage(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedImage || !formData.name || !formData.symptoms) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields and upload an image.",
        variant: "destructive"
      });
      return;
    }

    setIsAnalyzing(true);
    
    // Simulate AI analysis
    setTimeout(() => {
      const mockResults = [
        {
          condition: "Mild Acne Vulgaris",
          confidence: 87,
          description: "Based on the image analysis, the skin shows characteristics of mild acne vulgaris with comedones and minor inflammatory lesions.",
          recommendations: [
            "Use a gentle salicylic acid cleanser twice daily",
            "Apply benzoyl peroxide 2.5% gel to affected areas",
            "Avoid touching or picking at lesions",
            "Consider consulting a dermatologist for personalized treatment"
          ],
          severity: "Mild"
        },
        {
          condition: "Post-inflammatory Hyperpigmentation",
          confidence: 73,
          description: "Secondary analysis indicates possible post-inflammatory hyperpigmentation in previously affected areas.",
          recommendations: [
            "Use sunscreen SPF 30+ daily",
            "Consider vitamin C serum in the morning",
            "Gentle exfoliation with AHA/BHA products",
            "Consistent skincare routine for 6-8 weeks"
          ],
          severity: "Mild"
        }
      ];
      
      setAnalysisResult(mockResults);
      setIsAnalyzing(false);
      
      toast({
        title: "Analysis Complete",
        description: "Your skin analysis has been completed successfully.",
      });
    }, 3000);
  };

  const resetForm = () => {
    setFormData({ name: '', symptoms: '', duration: '' });
    setSelectedImage(null);
    setImagePreview(null);
    setAnalysisResult(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-white font-inter">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md border-b border-purple-100 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            {/* Logo Space */}
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gray-200 rounded-lg flex items-center justify-center border-2 border-dashed border-gray-300">
                <span className="text-xs text-gray-500 font-medium">LOGO</span>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-[#613175] font-playfair">Precision</h1>
                <p className="text-sm text-gray-600 font-inter">AI Dermatology Consultations</p>
              </div>
            </div>
            
            {/* Right side branding */}
            <div className="w-10 h-10 bg-gradient-to-br from-[#613175] to-purple-600 rounded-xl flex items-center justify-center">
              <Sparkles className="h-6 w-6 text-white" />
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {!analysisResult ? (
          <div className="space-y-8">
            {/* Hero Section */}
            <div className="text-center space-y-4">
              <h2 className="text-4xl font-bold text-gray-900 font-playfair">
                Advanced Skin Analysis
              </h2>
              <p className="text-xl text-gray-600 max-w-2xl mx-auto font-inter">
                Upload an image of your skin concern and receive AI-powered analysis for conditions like acne and hyperpigmentation.
              </p>
            </div>

            {/* Form */}
            <Card className="border-purple-200 shadow-lg">
              <CardHeader className="bg-gradient-to-r from-[#613175] to-purple-600 text-white rounded-t-lg">
                <CardTitle className="flex items-center gap-2 font-playfair">
                  <FileText className="h-5 w-5" />
                  Consultation Form
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Personal Information */}
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="name" className="flex items-center gap-2 text-gray-700 font-medium font-inter">
                        <User className="h-4 w-4" />
                        Full Name *
                      </Label>
                      <Input
                        id="name"
                        value={formData.name}
                        onChange={(e) => setFormData({...formData, name: e.target.value})}
                        placeholder="Enter your full name"
                        className="mt-1 border-purple-200 focus:border-[#613175] focus:ring-[#613175] font-inter"
                        required
                      />
                    </div>

                    <div>
                      <Label htmlFor="duration" className="flex items-center gap-2 text-gray-700 font-medium font-inter">
                        <Clock className="h-4 w-4" />
                        Duration of Symptoms
                      </Label>
                      <Input
                        id="duration"
                        value={formData.duration}
                        onChange={(e) => setFormData({...formData, duration: e.target.value})}
                        placeholder="e.g., 2 weeks, 3 months"
                        className="mt-1 border-purple-200 focus:border-[#613175] focus:ring-[#613175] font-inter"
                      />
                    </div>

                    <div>
                      <Label htmlFor="symptoms" className="flex items-center gap-2 text-gray-700 font-medium font-inter">
                        <FileText className="h-4 w-4" />
                        Symptoms Description *
                      </Label>
                      <Textarea
                        id="symptoms"
                        value={formData.symptoms}
                        onChange={(e) => setFormData({...formData, symptoms: e.target.value})}
                        placeholder="Describe your skin concerns, symptoms, and any relevant details..."
                        className="mt-1 border-purple-200 focus:border-[#613175] focus:ring-[#613175] min-h-[100px] font-inter"
                        required
                      />
                    </div>
                  </div>

                  {/* Image Upload */}
                  <div className="space-y-4">
                    <Label className="flex items-center gap-2 text-gray-700 font-medium font-inter">
                      <Camera className="h-4 w-4" />
                      Upload Skin Image *
                    </Label>
                    
                    <div className="border-2 border-dashed border-purple-300 rounded-lg p-6 text-center hover:border-[#613175] transition-colors">
                      {imagePreview ? (
                        <div className="space-y-4">
                          <img
                            src={imagePreview}
                            alt="Preview"
                            className="max-w-full max-h-64 mx-auto rounded-lg shadow-md"
                          />
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => {
                              setSelectedImage(null);
                              setImagePreview(null);
                            }}
                            className="border-[#613175] text-[#613175] hover:bg-[#613175] hover:text-white font-inter"
                          >
                            Change Image
                          </Button>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          <Upload className="h-12 w-12 text-purple-400 mx-auto" />
                          <div>
                            <p className="text-gray-600 font-inter">Click to upload or drag and drop</p>
                            <p className="text-sm text-gray-500 font-inter">PNG, JPG, JPEG up to 10MB</p>
                          </div>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleImageChange}
                            className="hidden"
                            id="image-upload"
                          />
                          <Label
                            htmlFor="image-upload"
                            className="inline-flex items-center px-4 py-2 bg-[#613175] text-white rounded-md hover:bg-purple-700 transition-colors cursor-pointer font-inter"
                          >
                            Select Image
                          </Label>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Submit Button */}
                  <Button
                    type="submit"
                    disabled={isAnalyzing}
                    className="w-full bg-gradient-to-r from-[#613175] to-purple-600 hover:from-purple-700 hover:to-purple-800 text-white py-3 text-lg font-semibold rounded-lg shadow-lg transform transition-all duration-200 hover:scale-[1.02] font-inter"
                  >
                    {isAnalyzing ? (
                      <div className="flex items-center gap-2">
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                        Analyzing Image...
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <Sparkles className="h-5 w-5" />
                        Start AI Analysis
                      </div>
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>
        ) : (
          /* Analysis Results */
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-3xl font-bold text-gray-900 mb-2 font-playfair">Analysis Complete</h2>
              <p className="text-gray-600 font-inter">AI-powered dermatological assessment for {formData.name}</p>
            </div>

            {analysisResult.map((result: any, index: number) => (
              <Card key={index} className="border-purple-200 shadow-lg">
                <CardHeader className="bg-gradient-to-r from-[#613175] to-purple-600 text-white">
                  <CardTitle className="flex items-center justify-between font-playfair">
                    <span>{result.condition}</span>
                    <span className="bg-white/20 px-3 py-1 rounded-full text-sm font-inter">
                      {result.confidence}% confidence
                    </span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-2 font-playfair">Assessment</h4>
                      <p className="text-gray-700 font-inter">{result.description}</p>
                    </div>
                    
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-2 font-playfair">Severity</h4>
                      <span className={`px-3 py-1 rounded-full text-sm font-medium font-inter ${
                        result.severity === 'Mild' 
                          ? 'bg-green-100 text-green-800' 
                          : result.severity === 'Moderate'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {result.severity}
                      </span>
                    </div>

                    <div>
                      <h4 className="font-semibold text-gray-900 mb-2 font-playfair">Recommendations</h4>
                      <ul className="space-y-2">
                        {result.recommendations.map((rec: string, i: number) => (
                          <li key={i} className="flex items-start gap-2">
                            <div className="w-2 h-2 bg-[#613175] rounded-full mt-2 flex-shrink-0"></div>
                            <span className="text-gray-700 font-inter">{rec}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <p className="text-yellow-800 text-sm font-inter">
                <strong>Disclaimer:</strong> This AI analysis is for informational purposes only and should not replace professional medical advice. Please consult with a qualified dermatologist for proper diagnosis and treatment.
              </p>
            </div>

            <div className="flex gap-4 justify-center">
              <Button
                onClick={resetForm}
                className="bg-[#613175] hover:bg-purple-700 text-white px-8 py-2 font-inter"
              >
                New Consultation
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Index;
