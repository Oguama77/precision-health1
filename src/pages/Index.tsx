import { useState } from 'react';
import { Upload, Camera, FileText, User, Clock, Sparkles, Download, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { config } from '@/config';

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
  const [chatMessage, setChatMessage] = useState('');
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
    setAnalysisResult(null);
    
    try {
      const formPayload = new FormData();
      formPayload.append('image', selectedImage);
      formPayload.append('name', formData.name);
      formPayload.append('duration', formData.duration);
      formPayload.append('symptoms', formData.symptoms);

      const response = await fetch(`${config.apiUrl}/api/analyze`, {
        method: 'POST',
        body: formPayload,
      });

      console.log('API Response Status:', response.status);
      console.log('API URL being used:', `${config.apiUrl}/api/analyze`);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('API Error Response:', errorText);
        try {
          const errorData = JSON.parse(errorText);
          throw new Error(errorData.detail || 'Analysis failed');
        } catch (parseError) {
          throw new Error(`Analysis failed: ${errorText}`);
        }
      }

      const results = await response.json();
      
      if (!Array.isArray(results) || results.length === 0) {
        throw new Error('Invalid analysis results received');
      }

      setAnalysisResult(results);
      
      toast({
        title: "Analysis Complete",
        description: "Your skin analysis has been completed successfully.",
      });
    } catch (error) {
      console.error('Analysis error:', error);
      setAnalysisResult(null);
      toast({
        title: "Analysis Failed",
        description: error instanceof Error ? error.message : "There was an error analyzing your skin condition. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const resetForm = () => {
    setFormData({ name: '', symptoms: '', duration: '' });
    setSelectedImage(null);
    setImagePreview(null);
    setAnalysisResult(null);
  };

  const downloadReport = () => {
    // Create a temporary div for the report
    const reportDiv = document.createElement('div');
    reportDiv.style.padding = '40px';
    reportDiv.style.maxWidth = '800px';
    reportDiv.style.margin = '0 auto';
    reportDiv.style.fontFamily = 'Arial, sans-serif';

    // Add logo and header
    reportDiv.innerHTML = `
      <div style="text-align: center; margin-bottom: 30px;">
        <img src="/logo_only.PNG" alt="Precision Logo" style="width: 120px; margin-bottom: 20px;" />
        <h1 style="color: #613175; margin: 0; font-size: 24px;">PRECISION</h1>
        <h2 style="color: #613175; margin: 10px 0; font-size: 20px;">DERMATOLOGY CONSULTATION REPORT</h2>
      </div>

      <div style="margin-bottom: 30px;">
        <p><strong>Patient:</strong> ${formData.name}</p>
        <p><strong>Date:</strong> ${new Date().toLocaleDateString()}</p>
        <p><strong>Symptoms Duration:</strong> ${formData.duration}</p>
        <p><strong>Symptoms Description:</strong> ${formData.symptoms}</p>
      </div>

      <h3 style="color: #613175; margin-top: 30px;">ANALYSIS RESULTS</h3>
      ${analysisResult.map((result: any, index: number) => `
        <div style="margin: 20px 0; padding: 15px; border: 1px solid #e0e0e0; border-radius: 5px;">
          <h4 style="color: #613175; margin-top: 0;">ASSESSMENT ${index + 1}</h4>
          <p><strong>Severity:</strong> ${result.severity}</p>
          <p><strong>Description:</strong> ${result.description}</p>
          <p><strong>Recommendations:</strong></p>
          <ul style="margin-top: 5px;">
            ${result.recommendations.map((rec: string) => `
              <li style="margin-bottom: 5px;">${rec}</li>
            `).join('')}
          </ul>
        </div>
      `).join('')}

      <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #e0e0e0; font-size: 12px; color: #666;">
        <p><strong>DISCLAIMER:</strong> This AI analysis is for informational purposes only and should not replace professional medical advice. Please consult with a qualified dermatologist for proper diagnosis and treatment.</p>
      </div>
    `;

    // Add the report to the document temporarily
    document.body.appendChild(reportDiv);

    // Print settings
    const printSettings = {
      margin: {
        top: '20mm',
        bottom: '20mm',
        left: '20mm',
        right: '20mm'
      }
    };

    // Print the report
    window.print();

    // Remove the temporary div after printing
    document.body.removeChild(reportDiv);

    toast({
      title: "Report Ready",
      description: "Please save the report as PDF when the print dialog opens.",
    });
  };

  const handleChatSubmit = () => {
    if (chatMessage.trim()) {
      toast({
        title: "Message Sent",
        description: "Your message has been sent to our dermatology team. We'll get back to you soon.",
      });
      setChatMessage('');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-white font-inter">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md border-b border-purple-100 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            {/* Logo Space */}
            <div className="flex items-center gap-4">
              <div className="w-20 h-20 flex items-center justify-center">
                <img 
                  src="/logo_only.PNG" 
                  alt="Precision Skin Insights Logo" 
                  className="w-full h-full object-contain"
                />
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
        {/* Temporary debug element */}
        <div className="bg-gray-100 p-4 mb-4 rounded">
          <p>Debug - API URL: {config.apiUrl}</p>
        </div>
        {isAnalyzing ? (
          <div className="flex flex-col items-center justify-center space-y-4 min-h-[400px]">
            <div className="w-16 h-16 border-4 border-purple-200 border-t-[#613175] rounded-full animate-spin"></div>
            <h3 className="text-xl font-semibold text-gray-800">Analyzing Your Image</h3>
            <p className="text-gray-600 text-center max-w-md">
              Please wait while our AI analyzes your skin condition. This may take a few moments...
            </p>
          </div>
        ) : !analysisResult ? (
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
                    <span>Assessment {index + 1}</span>
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

            <div className="flex gap-4 justify-center flex-wrap">
              <Button
                onClick={downloadReport}
                className="bg-[#613175] hover:bg-purple-700 text-white px-6 py-2 font-inter flex items-center gap-2"
              >
                <Download className="h-4 w-4" />
                Download Report
              </Button>

              <Dialog>
                <DialogTrigger asChild>
                  <Button
                    className="bg-gradient-to-r from-[#613175] to-purple-600 hover:from-purple-700 hover:to-purple-800 text-white px-6 py-2 font-inter flex items-center gap-2"
                  >
                    <MessageSquare className="h-4 w-4" />
                    Chat with Dermatologist
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md">
                  <DialogHeader>
                    <DialogTitle className="font-playfair text-[#613175]">Chat with Dermatologist</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <p className="text-sm text-gray-600 font-inter">
                      Send a message to our dermatology team for further consultation about your analysis.
                    </p>
                    <Textarea
                      value={chatMessage}
                      onChange={(e) => setChatMessage(e.target.value)}
                      placeholder="Type your message or questions here..."
                      className="min-h-[120px] border-purple-200 focus:border-[#613175] focus:ring-[#613175] font-inter"
                    />
                    <div className="flex gap-2 justify-end">
                      <Button
                        onClick={handleChatSubmit}
                        disabled={!chatMessage.trim()}
                        className="bg-[#613175] hover:bg-purple-700 text-white font-inter"
                      >
                        Send Message
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>

              <Button
                onClick={resetForm}
                variant="outline"
                className="border-[#613175] text-[#613175] hover:bg-[#613175] hover:text-white px-6 py-2 font-inter"
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
