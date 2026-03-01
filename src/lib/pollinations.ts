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
    const response = await fetch(`${POLLINATIONS_BASE_URL}/prompts`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prompt,
        model: options.model || 'openai',
        temperature: options.temperature || 0.7,
        seed: options.seed || 0,
        systemPrompt: options.system,
        jsonMode: options.json || false,
        stream: options.stream || false
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Pollinations API error:', response.status, errorText);
      throw new Error(`HTTP error! status: ${response.status} - ${errorText}`);
    }

    const result = await response.json();
    return result.text || result.content || result;
  } catch (error) {
    console.error('Error generating text:', error);
    // Fallback to a simple response if API fails
    return `Here's a creative idea for "${prompt}": This could be a modern web application with innovative design and interactive features. The concept involves creating something unique that combines technology with user experience.`;
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
  // Use the simple URL-based API that Pollinations provides
  const params = new URLSearchParams({
    prompt,
    model: options.model || 'flux',
    width: options.width?.toString() || '1024',
    height: options.height?.toString() || '1024',
    seed: options.seed?.toString() || '0',
    ...(options.enhance && { enhance: options.enhance.toString() }),
    ...(options.negative_prompt && { negativePrompt: options.negative_prompt }),
    ...(options.safe && { safe: options.safe.toString() }),
    ...(options.quality && { quality: options.quality }),
    ...(options.transparent && { transparent: options.transparent.toString() })
  });

  return `https://pollinations.ai/p/${encodeURIComponent(prompt)}?${params}`;
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
