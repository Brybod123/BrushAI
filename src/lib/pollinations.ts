// Pollinations API service
const POLLINATIONS_BASE_URL = 'https://gen.pollinations.ai';

// Generate complete website content using AI
export const generateWebsiteContent = async (projectName: string, description: string, isGame: boolean) => {
  try {
    console.log('🤖 Generating website content with AI:', projectName);
    
    const systemPrompt = isGame 
      ? `You are a web developer creating a complete, functional game website. Generate the HTML, CSS, and JavaScript for a "${projectName}" game based on this description: "${description}". 
        Create a fully working game with proper game mechanics, animations, and user interactions. 
        The game should be engaging, visually appealing, and include all necessary game features.`
      : `You are a web developer creating a complete, functional website. Generate the HTML, CSS, and JavaScript for a "${projectName}" website based on this description: "${description}". 
        Create a modern, responsive website with proper navigation, sections, and interactive features. 
        The website should be visually appealing, user-friendly, and include all necessary web features.`;

    const response = await fetch(`${POLLINATIONS_BASE_URL}/v1/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(import.meta.env.VITE_POLLINATIONS_API_KEY && {
          'Authorization': `Bearer ${import.meta.env.VITE_POLLINATIONS_API_KEY}`
        })
      },
      body: JSON.stringify({
        model: 'openai',
        messages: [
          { role: 'system', content: systemPrompt },
          { 
            role: 'user', 
            content: `Generate the complete HTML, CSS, and JavaScript for "${projectName}". 
            Provide the code in a structured JSON format with three keys: 'html', 'css', and 'js'.
            The HTML should be a complete, valid HTML5 document.
            The CSS should be modern and responsive.
            The JavaScript should be interactive and functional.
            Make sure all three files work together seamlessly.`
          }
        ],
        temperature: 0.7,
        response_format: { type: 'json_object' }
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Error generating website content:', response.status, errorText);
      throw new Error(`HTTP error! status: ${response.status} - ${errorText}`);
    }

    const result = await response.json();
    const content = result.choices?.[0]?.message?.content;
    
    if (!content) {
      throw new Error('No content generated');
    }

    // Try to parse JSON response
    let websiteContent;
    try {
      websiteContent = JSON.parse(content);
    } catch (e) {
      console.error('Failed to parse JSON, using fallback');
      websiteContent = generateFallbackContent(projectName, description, isGame);
    }

    console.log('✅ Website content generated successfully');
    return websiteContent;
  } catch (error) {
    console.error('❌ Error generating website content:', error);
    return generateFallbackContent(projectName, description, isGame);
  }
};

// Generate fallback content if AI fails
const generateFallbackContent = (projectName: string, description: string, isGame: boolean) => {
  console.log('🔄 Using fallback content generation');
  
  if (isGame) {
    return {
      html: `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${projectName}</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            margin: 0;
            padding: 20px;
            min-height: 100vh;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
        }
        .game-container {
            text-align: center;
            background: rgba(255,255,255,0.1);
            padding: 40px;
            border-radius: 20px;
            backdrop-filter: blur(10px);
        }
        h1 { font-size: 3rem; margin-bottom: 20px; }
        .game-board {
            width: 400px;
            height: 400px;
            background: rgba(0,0,0,0.3);
            border: 2px solid rgba(255,255,255,0.3);
            border-radius: 10px;
            margin: 20px 0;
            position: relative;
            cursor: crosshair;
        }
        .score { font-size: 1.5rem; margin: 10px 0; }
        button {
            background: linear-gradient(45deg, #ff6b6b, #4ecdc4);
            color: white;
            border: none;
            padding: 15px 30px;
            font-size: 1.2rem;
            border-radius: 25px;
            cursor: pointer;
            margin: 10px;
            transition: transform 0.3s ease;
        }
        button:hover { transform: scale(1.05); }
        .game-element {
            position: absolute;
            width: 30px;
            height: 30px;
            background: #ff6b6b;
            border-radius: 5px;
            cursor: pointer;
            transition: all 0.3s ease;
        }
    </style>
</head>
<body>
    <div class="game-container">
        <h1>${projectName}</h1>
        <p>${description}</p>
        <div class="score">Score: <span id="score">0</span></div>
        <div class="game-board" id="gameBoard"></div>
        <button id="startBtn">Start Game</button>
        <button id="resetBtn">Reset</button>
    </div>
    <script>
        let score = 0;
        let gameActive = false;
        let elements = [];
        
        document.getElementById('startBtn').addEventListener('click', startGame);
        document.getElementById('resetBtn').addEventListener('click', resetGame);
        
        function startGame() {
            gameActive = true;
            score = 0;
            updateScore();
            createElements();
        }
        
        function resetGame() {
            gameActive = false;
            score = 0;
            updateScore();
            document.getElementById('gameBoard').innerHTML = '';
            elements = [];
        }
        
        function createElements() {
            const board = document.getElementById('gameBoard');
            board.innerHTML = '';
            elements = [];
            
            for (let i = 0; i < 10; i++) {
                const element = document.createElement('div');
                element.className = 'game-element';
                element.style.left = Math.random() * 350 + 'px';
                element.style.top = Math.random() * 350 + 'px';
                element.style.background = ['#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4'][Math.floor(Math.random() * 4)];
                
                element.addEventListener('click', () => {
                    if (gameActive) {
                        score += 10;
                        updateScore();
                        element.style.transform = 'scale(0)';
                        element.style.opacity = '0';
                        setTimeout(() => {
                            element.remove();
                            elements = elements.filter(e => e !== element);
                            if (elements.length === 0) {
                                alert('Level Complete! Score: ' + score);
                                resetGame();
                            }
                        }, 300);
                    }
                });
                
                board.appendChild(element);
                elements.push(element);
            }
        }
        
        function updateScore() {
            document.getElementById('score').textContent = score;
        }
        
        // Animation loop
        function animate() {
            if (gameActive) {
                elements.forEach(element => {
                    const currentLeft = parseFloat(element.style.left);
                    const currentTop = parseFloat(element.style.top);
                    element.style.left = (currentLeft + (Math.random() - 0.5) * 4) + 'px';
                    element.style.top = (currentTop + (Math.random() - 0.5) * 4) + 'px';
                    
                    // Bounce off walls
                    if (currentLeft <= 0 || currentLeft >= 370) {
                        element.style.left = Math.max(0, Math.min(370, currentLeft + (Math.random() - 0.5) * 4)) + 'px';
                    }
                    if (currentTop <= 0 || currentTop >= 370) {
                        element.style.top = Math.max(0, Math.min(370, currentTop + (Math.random() - 0.5) * 4)) + 'px';
                    }
                });
            }
            requestAnimationFrame(animate);
        }
        animate();
    </script>
</body>
</html>`,
      css: `/* Game Styles */`,
      js: `/* Game JavaScript */`
    };
  } else {
    return {
      html: `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${projectName}</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: #333;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
        }
        .container {
            max-width: 1200px;
            margin: 0 auto;
            padding: 20px;
        }
        header {
            text-align: center;
            color: white;
            margin-bottom: 40px;
        }
        h1 { font-size: 3rem; margin-bottom: 10px; }
        nav {
            display: flex;
            justify-content: center;
            gap: 10px;
            margin-bottom: 20px;
        }
        .nav-btn {
            background: rgba(255,255,255,0.2);
            color: white;
            border: 2px solid rgba(255,255,255,0.3);
            padding: 10px 20px;
            border-radius: 25px;
            cursor: pointer;
            transition: all 0.3s ease;
        }
        .nav-btn:hover, .nav-btn.active {
            background: rgba(255,255,255,0.3);
            transform: translateY(-2px);
        }
        main {
            background: white;
            border-radius: 15px;
            padding: 40px;
            box-shadow: 0 10px 30px rgba(0,0,0,0.2);
            margin-bottom: 40px;
        }
        .section {
            display: none;
        }
        .section.active {
            display: block;
        }
        h2 { color: #667eea; margin-bottom: 20px; }
        .btn {
            background: linear-gradient(45deg, #667eea, #764ba2);
            color: white;
            border: none;
            padding: 15px 30px;
            border-radius: 25px;
            cursor: pointer;
            transition: transform 0.3s ease;
            margin: 10px 0;
        }
        .btn:hover { transform: translateY(-2px); }
        .feature-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 20px;
            margin-top: 30px;
        }
        .feature-card {
            background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
            padding: 30px;
            border-radius: 15px;
            text-align: center;
            transition: transform 0.3s ease;
        }
        .feature-card:hover {
            transform: translateY(-5px);
        }
        footer {
            text-align: center;
            color: white;
            opacity: 0.8;
        }
    </style>
</head>
<body>
    <div class="container">
        <header>
            <h1>${projectName}</h1>
            <p>${description}</p>
            <nav>
                <button class="nav-btn active" data-section="home">Home</button>
                <button class="nav-btn" data-section="about">About</button>
                <button class="nav-btn" data-section="contact">Contact</button>
            </nav>
        </header>
        <main>
            <section class="section active" id="home">
                <h2>Welcome to ${projectName}</h2>
                <p>This is a modern web application created with AI assistance.</p>
                <button class="btn">Get Started</button>
                <div class="feature-grid">
                    <div class="feature-card">
                        <h3>🚀 Fast Performance</h3>
                        <p>Optimized for speed and efficiency</p>
                    </div>
                    <div class="feature-card">
                        <h3>🎨 Beautiful Design</h3>
                        <p>Modern, responsive interface</p>
                    </div>
                    <div class="feature-card">
                        <h3>⚡ Interactive Features</h3>
                        <p>Dynamic content and animations</p>
                    </div>
                </div>
            </section>
            <section class="section" id="about">
                <h2>About</h2>
                <p>Learn more about ${projectName} and our mission.</p>
            </section>
            <section class="section" id="contact">
                <h2>Contact</h2>
                <p>Get in touch with us for any questions.</p>
            </section>
        </main>
        <footer>
            <p>&copy; 2024 ${projectName}. All rights reserved.</p>
        </footer>
    </div>
    <script>
        // Navigation
        const navBtns = document.querySelectorAll('.nav-btn');
        const sections = document.querySelectorAll('.section');
        
        navBtns.forEach(btn => {
            btn.addEventListener('click', function() {
                const targetSection = this.getAttribute('data-section');
                
                navBtns.forEach(b => b.classList.remove('active'));
                this.classList.add('active');
                
                sections.forEach(section => {
                    section.classList.remove('active');
                    if (section.id === targetSection) {
                        section.classList.add('active');
                    }
                });
            });
        });
        
        // Interactive button
        document.querySelector('.btn').addEventListener('click', function() {
            const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7'];
            const randomColor = colors[Math.floor(Math.random() * colors.length)];
            
            const content = document.querySelector('.section.active');
            content.style.background = \`linear-gradient(45deg, \${randomColor}22, \${randomColor}11)\`;
            content.style.transition = 'background 0.5s ease';
            
            const newElement = document.createElement('div');
            newElement.innerHTML = \`
                <h3>🎉 Dynamic Content!</h3>
                <p>This content was generated dynamically using JavaScript.</p>
                <p>Timestamp: \${new Date().toLocaleString()}</p>
                <p>Project: ${projectName}</p>
            \`;
            newElement.style.cssText = \`
                background: white;
                padding: 20px;
                border-radius: 10px;
                margin-top: 20px;
                box-shadow: 0 5px 15px rgba(0,0,0,0.1);
            \`;
            
            content.appendChild(newElement);
            newElement.scrollIntoView({ behavior: 'smooth' });
            
            setTimeout(() => {
                newElement.style.opacity = '0';
                newElement.style.transition = 'opacity 0.5s ease';
                setTimeout(() => newElement.remove(), 500);
            }, 5000);
        });
        
        // Mouse tracking effect
        document.addEventListener('mousemove', function(e) {
            const x = e.clientX / window.innerWidth;
            const y = e.clientY / window.innerHeight;
            
            document.body.style.background = \`linear-gradient(\${135 + x * 45}deg, 
                hsl(\${250 + x * 60}, 70%, \${50 + y * 20}%) 0%, 
                hsl(\${280 + x * 60}, 70%, \${40 + y * 20}%) 100%)\`;
        });
    </script>
</body>
</html>`,
      css: `/* App Styles */`,
      js: `/* App JavaScript */`
    };
  }
};

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
