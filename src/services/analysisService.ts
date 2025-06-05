import { config } from '@/config';

export interface AnalysisFormData {
  name: string;
  symptoms: string;
  duration: string;
  image: File;
}

export interface AnalysisResult {
  severity: string;
  description: string;
  recommendations: string[];
}

class AnalysisService {
  async analyzeImage(formData: AnalysisFormData): Promise<AnalysisResult[]> {
    const formPayload = new FormData();
    formPayload.append('image', formData.image);
    formPayload.append('name', formData.name);
    formPayload.append('duration', formData.duration);
    formPayload.append('symptoms', formData.symptoms);

    const response = await fetch(`${config.apiUrl}/api/analyze`, {
      method: 'POST',
      body: formPayload,
    });

    if (!response.ok) {
      const errorText = await response.text();
      try {
        const errorData = JSON.parse(errorText);
        throw new Error(errorData.detail || 'Analysis failed');
      } catch (parseError) {
        throw new Error(`Analysis failed: ${errorText}`);
      }
    }

    const data = await response.json();
    return data;
  }
}

export const analysisService = new AnalysisService(); 