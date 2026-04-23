import axios from 'axios';
import { getPostureBaseUrl } from './apiConfig';

class PostureService {
  async getHealth() {
    const response = await axios.get(`${getPostureBaseUrl()}/health`, {
      timeout: 5000,
    });

    return response.data;
  }

  async analyzeImage({ base64, userId = 'guest', exercise = 'general' }) {
    const response = await axios.post(
      `${getPostureBaseUrl()}/analyze`,
      {
        frame: base64,
        userId,
        exercise,
      },
      {
        timeout: 20000,
      }
    );

    return response.data;
  }

  async analyzeVideo({ uri, userId = 'guest', exercise = 'general' }) {
    const formData = new FormData();
    const extension = uri?.split('.').pop()?.toLowerCase();
    const isMov = extension === 'mov' || extension === 'm4v';
    formData.append('file', {
      uri,
      name: `posture-video.${extension || 'mp4'}`,
      type: isMov ? 'video/quicktime' : 'video/mp4',
    });

    const response = await fetch(
      `${getPostureBaseUrl()}/analyze-video?userId=${encodeURIComponent(userId)}&exercise=${encodeURIComponent(exercise)}`,
      {
        method: 'POST',
        body: formData,
      }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.detail || data.message || 'Video analysis failed');
    }

    return data;
  }
}

export default new PostureService();
