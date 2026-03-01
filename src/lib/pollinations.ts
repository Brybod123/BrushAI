// Pollinations API service
const POLLINATIONS_BASE_URL = 'https://gen.pollinations.ai';

export interface TextGenerationOptions {
  model?: string;
  temperature?: number;
  seed?: number;
  system?: string;
  json?: boolean;
  stream?: boolean;
}

export interface ImageGenerationOptions {
  model?: string;
  width?: number;
  height?: number;
  seed?: number;
  enhance?: boolean;
  negative_prompt?: string;
  safe?: boolean;
  quality?: 'low' | 'medium' | 'high' | 'hd';
  image?: string;
  transparent?: boolean;
  duration?: number;
  aspectRatio?: '16:9' | '9:16';
  audio?: boolean;
}

export interface AudioGenerationOptions {
  voice?: string;
  model?: string;
  duration?: number;
}

// Text generation
export const generateText = async (prompt: string, options: TextGenerationOptions = {}) => {
  try {
    const params = new URLSearchParams({
      model: options.model || 'openai',
      seed: options.seed?.toString() || '0',
      ...(options.temperature && { temperature: options.temperature.toString() }),
      ...(options.system && { system: options.system }),
      ...(options.json && { json: options.json.toString() }),
      ...(options.stream && { stream: options.stream.toString() })
    });

    const response = await fetch(`${POLLINATIONS_BASE_URL}/text/${encodeURIComponent(prompt)}?${params}`, {
      headers: {
        ...(import.meta.env.VITE_POLLINATIONS_API_KEY && {
          'Authorization': `Bearer ${import.meta.env.VITE_POLLINATIONS_API_KEY}`
        })
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.text();
  } catch (error) {
    console.error('Error generating text:', error);
    throw error;
  }
};

// Chat completions (OpenAI compatible)
export const chatCompletion = async (messages: Array<{role: string, content: string}>, options: TextGenerationOptions = {}) => {
  try {
    const response = await fetch(`${POLLINATIONS_BASE_URL}/v1/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(import.meta.env.VITE_POLLINATIONS_API_KEY && {
          'Authorization': `Bearer ${import.meta.env.VITE_POLLINATIONS_API_KEY}`
        })
      },
      body: JSON.stringify({
        model: options.model || 'openai',
        messages,
        ...(options.temperature !== undefined && { temperature: options.temperature }),
        ...(options.seed !== undefined && { seed: options.seed }),
        ...(options.stream !== undefined && { stream: options.stream }),
        ...(options.json && { response_format: { type: 'json_object' } })
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error in chat completion:', error);
    throw error;
  }
};

// Image generation
export const generateImage = (prompt: string, options: ImageGenerationOptions = {}) => {
  const params = new URLSearchParams({
    model: options.model || 'flux',
    width: options.width?.toString() || '1024',
    height: options.height?.toString() || '1024',
    seed: options.seed?.toString() || '0',
    ...(options.enhance && { enhance: options.enhance.toString() }),
    ...(options.negative_prompt && { negative_prompt: options.negative_prompt }),
    ...(options.safe && { safe: options.safe.toString() }),
    ...(options.quality && { quality: options.quality }),
    ...(options.image && { image: options.image }),
    ...(options.transparent && { transparent: options.transparent.toString() }),
    ...(options.duration && { duration: options.duration.toString() }),
    ...(options.aspectRatio && { aspectRatio: options.aspectRatio }),
    ...(options.audio !== undefined && { audio: options.audio.toString() })
  });

  return `${POLLINATIONS_BASE_URL}/image/${encodeURIComponent(prompt)}?${params}`;
};

// Audio generation
export const generateAudio = (text: string, options: AudioGenerationOptions = {}) => {
  const params = new URLSearchParams({
    voice: options.voice || 'nova',
    ...(options.model && { model: options.model }),
    ...(options.duration && { duration: options.duration.toString() })
  });

  return `${POLLINATIONS_BASE_URL}/audio/${encodeURIComponent(text)}?${params}`;
};

// Get available models
export const getTextModels = async () => {
  try {
    const response = await fetch(`${POLLINATIONS_BASE_URL}/v1/models`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Error getting text models:', error);
    throw error;
  }
};

export const getImageModels = async () => {
  try {
    const response = await fetch(`${POLLINATIONS_BASE_URL}/image/models`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Error getting image models:', error);
    throw error;
  }
};
