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

// Test API connection
export const testApiConnection = async () => {
  try {
    const response = await fetch(`${POLLINATIONS_BASE_URL}/v1/models`, {
      headers: {
        ...(import.meta.env.VITE_POLLINATIONS_API_KEY && {
          'Authorization': `Bearer ${import.meta.env.VITE_POLLINATIONS_API_KEY}`
        })
      }
    });
    
    if (response.ok) {
      const models = await response.json();
      console.log('✅ Pollinations API is alive! Available models:', models.data?.length || 0);
      return true;
    } else {
      console.error('❌ Pollinations API test failed:', response.status);
      return false;
    }
  } catch (error) {
    console.error('❌ Pollinations API connection error:', error);
    return false;
  }
};

// Text generation with streaming support
export const generateText = async (prompt: string, options: TextGenerationOptions = {}, onStream?: (chunk: string) => void) => {
  try {
    console.log('🚀 Starting Pollinations text generation:', { prompt: prompt.substring(0, 50) + '...', model: options.model || 'openai' });
    
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
        messages: [
          { role: 'system', content: options.system || 'You are a helpful assistant that generates project descriptions and ideas.' },
          { role: 'user', content: prompt }
        ],
        temperature: options.temperature || 0.7,
        seed: options.seed || 0,
        ...(options.json && { response_format: { type: 'json_object' } }),
        stream: options.stream || false
      })
    });

    console.log('📡 Pollinations API response status:', response.status, response.statusText);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Pollinations API error:', response.status, errorText);
      throw new Error(`HTTP error! status: ${response.status} - ${errorText}`);
    }

    if (options.stream && onStream) {
      console.log('🌊 Starting streaming response...');
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let fullText = '';

      if (reader) {
        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            const chunk = decoder.decode(value, { stream: true });
            const lines = chunk.split('\n');
            
            for (const line of lines) {
              if (line.startsWith('data: ')) {
                const data = line.slice(6);
                if (data === '[DONE]') {
                  console.log('✅ Streaming completed');
                  break;
                }
                
                try {
                  const parsed = JSON.parse(data);
                  const content = parsed.choices?.[0]?.delta?.content || '';
                  if (content) {
                    fullText += content;
                    onStream(content);
                    console.log('📝 Stream chunk:', content);
                  }
                } catch (e) {
                  console.log('🔍 Non-JSON data:', data);
                }
              }
            }
          }
        } catch (error) {
          console.error('❌ Streaming error:', error);
        } finally {
          reader.releaseLock();
        }
      }
      
      console.log('✅ Full streamed text generated:', fullText.substring(0, 100) + '...');
      return fullText;
    } else {
      const result = await response.json();
      const content = result.choices?.[0]?.message?.content || result.content || result;
      console.log('✅ Non-streaming text generated:', content.substring(0, 100) + '...');
      return content;
    }
  } catch (error) {
    console.error('❌ Error generating text:', error);
    // Fallback to a simple response if API fails
    const fallback = `Here's a creative idea for "${prompt}": This could be a modern web application with innovative design and interactive features. The concept involves creating something unique that combines technology with user experience.`;
    console.log('🔄 Using fallback response');
    return fallback;
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
  // Use the gen.pollinations.ai image generation endpoint
  const params = new URLSearchParams({
    prompt,
    model: options.model || 'flux',
    width: options.width?.toString() || '1024',
    height: options.height?.toString() || '1024',
    seed: options.seed?.toString() || '0',
    ...(options.enhance && { enhance: options.enhance.toString() }),
    ...(options.negative_prompt && { negative_prompt: options.negative_prompt }),
    ...(options.safe && { safe: options.safe.toString() }),
    ...(options.quality && { quality: options.quality }),
    ...(options.transparent && { transparent: options.transparent.toString() })
  });

  return `https://gen.pollinations.ai/image/${encodeURIComponent(prompt)}?${params}`;
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
