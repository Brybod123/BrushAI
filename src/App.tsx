import { useState, useRef, useEffect } from 'react';
import { User, MousePointer2, ArrowLeft, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from './utils/cn';
import { auth, getCurrentUser, signInWithGoogle, signOutUser, createProject, getProjects, getUserProfile } from './lib/firebase';
import { generateText, generateImage, generateWebsiteContent, testApiConnection } from './lib/pollinations';

// Orb Animation Component
function OrbAnimation({ isActive }: { isActive: boolean }) {
  if (!isActive) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center pointer-events-none z-50">
      {/* Center orb */}
      <motion.div
        className="absolute w-4 h-4 rounded-full bg-white/40 backdrop-blur-sm border border-white/30"
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ duration: 0.3 }}
      />
      
      {/* Orbiting orbs */}
      {[0, 1, 2].map((index) => (
        <motion.div
          key={index}
          className="absolute w-3 h-3 rounded-full bg-white/30 backdrop-blur-sm border border-white/20"
          initial={{ 
            x: 0, 
            y: 0,
            scale: 0,
            opacity: 0 
          }}
          animate={{
            x: [
              0,
              Math.sin((index * 120) * Math.PI / 180) * 60,
              Math.sin((index * 120 + 120) * Math.PI / 180) * 60,
              Math.sin((index * 120 + 240) * Math.PI / 180) * 60,
              Math.sin((index * 120) * Math.PI / 180) * 60,
            ],
            y: [
              0,
              Math.cos((index * 120) * Math.PI / 180) * 60,
              Math.cos((index * 120 + 120) * Math.PI / 180) * 60,
              Math.cos((index * 120 + 240) * Math.PI / 180) * 60,
              Math.cos((index * 120) * Math.PI / 180) * 60,
            ],
            scale: [0, 1, 1, 1, 1],
            opacity: [0, 1, 1, 1, 1]
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: "easeInOut",
            delay: index * 0.2,
            times: [0, 0.2, 0.4, 0.6, 1]
          }}
        />
      ))}
      
      {/* Wave bounce effect - initial burst */}
      {[0, 1, 2].map((index) => (
        <motion.div
          key={`wave-${index}`}
          className="absolute w-3 h-3 rounded-full bg-white/20"
          initial={{ 
            y: 0,
            scale: 0,
            opacity: 0 
          }}
          animate={{
            y: [-40, 0, 40, 0],
            scale: [0, 1, 1, 0],
            opacity: [0, 0.8, 0.8, 0]
          }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            ease: "easeInOut",
            delay: index * 0.15,
            repeatDelay: 1.5
          }}
          style={{
            x: (index - 1) * 25
          }}
        />
      ))}
    </div>
  );
}

interface ProjectFile {
  name: string;
  content: string;
  type: 'html' | 'css' | 'js' | 'json';
}

interface Project {
  id: string;
  name: string;
  author: string;
  description: string;
  userId: string;
  imageUrl?: string;
  createdAt: Date;
  files?: ProjectFile[];
}

interface UserProfile {
  id: string;
  userId: string;
  username: string;
  followers?: number;
  views?: number;
}

export function App() {
  const [inputValue, setInputValue] = useState('');
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [showOrbAnimation, setShowOrbAnimation] = useState(false);
  const [showExampleUi, setShowExampleUi] = useState(false);
  const [showProfileDetail, setShowProfileDetail] = useState(false);
  const [viewingProject, setViewingProject] = useState<Project | null>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(false);
  const [generatedContent, setGeneratedContent] = useState('');
  const [generatedImageUrl, setGeneratedImageUrl] = useState('');
  const [streamingContent, setStreamingContent] = useState('');
  const [projectFiles, setProjectFiles] = useState<ProjectFile[]>([]);
  const profileRef = useRef<HTMLDivElement>(null);

  // Initialize Firebase and load data
  useEffect(() => {
    const initializeApp = async () => {
      // Test Pollinations API connection
      await testApiConnection();
      
      const user = getCurrentUser();
      if (user) {
        setCurrentUser(user);
        try {
          const profile = await getUserProfile(user.uid);
          if (profile) {
            setUserProfile(profile);
          }
          const userProjects = await getProjects(user.uid);
          setProjects(userProjects);
        } catch (error) {
          console.error('Error loading user data:', error);
        }
      } else {
        // Load public projects
        try {
          const publicProjects = await getProjects();
          setProjects(publicProjects);
        } catch (error) {
          console.error('Error loading projects:', error);
        }
      }
    };

    initializeApp();

    // Listen for auth changes
    if (auth) {
      const unsubscribe = auth.onAuthStateChanged(async (user: any) => {
        setCurrentUser(user);
        if (user) {
          try {
            const profile = await getUserProfile(user.uid);
            if (profile) {
              setUserProfile(profile);
            }
            const userProjects = await getProjects(user.uid);
            setProjects(userProjects);
          } catch (error) {
            console.error('Error loading user data:', error);
          }
        } else {
          setUserProfile(null);
          try {
            const publicProjects = await getProjects();
            setProjects(publicProjects);
          } catch (error) {
            console.error('Error loading projects:', error);
          }
        }
      });

      return () => unsubscribe();
    }
  }, []);

  // Close profile menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setIsProfileOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Handle Enter key press with AI generation and streaming
  const handleKeyDown = async (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && inputValue.trim()) {
      console.log('🎯 User input received:', inputValue);
      setShowOrbAnimation(true);
      setLoading(true);
      setStreamingContent('');
      setGeneratedContent('');
      setProjectFiles([]);
      
      try {
        console.log('🤖 Starting AI generation process...');
        
        // Generate content using Pollinations API with streaming
        const generatedText = await generateText(inputValue, {
          model: 'openai',
          temperature: 0.7,
          system: 'You are a helpful assistant that generates project descriptions and ideas for web applications, games, and websites. When users ask for games, create engaging game concepts. When users ask for apps, create modern application ideas. Always provide creative and detailed descriptions.',
          stream: true
        }, (chunk: string) => {
          console.log('📥 Streaming chunk received:', chunk);
          setStreamingContent(prev => prev + chunk);
        });
        
        console.log('✅ Text generation completed');
        setGeneratedContent(generatedText);
        setStreamingContent('');
        
        // Generate HTML project with VFS
        console.log('🏗️ Generating HTML project files...');
        const files = await generateHTMLProject(inputValue, generatedText);
        
        // Generate an image for the project
        console.log('🖼️ Generating image...');
        const imageUrl = generateImage(inputValue, {
          model: 'flux',
          width: 1024,
          height: 1024,
          enhance: true
        });
        
        console.log('🖼️ Image URL generated:', imageUrl);
        setGeneratedImageUrl(imageUrl);
        
        // If user is logged in, create a project
        if (currentUser) {
          console.log('💾 Creating project in database...');
          const projectId = await createProject({
            name: inputValue,
            author: userProfile?.username || currentUser.displayName || 'Anonymous',
            description: generatedText,
            userId: currentUser.uid,
            imageUrl,
            files
          });
          
          console.log('✅ Project created with ID:', projectId);
          
          // Refresh projects list
          const updatedProjects = await getProjects(currentUser.uid);
          setProjects(updatedProjects);
          console.log('🔄 Projects list refreshed');
        }
        
      } catch (error) {
        console.error('❌ Error in AI generation process:', error);
        setGeneratedContent('Failed to generate content. Please try again.');
      } finally {
        setLoading(false);
        console.log('🏁 AI generation process finished');
        // After ~4 seconds (a couple of animation rounds), show the example UI
        setTimeout(() => {
          setShowOrbAnimation(false);
          setShowExampleUi(true);
          console.log('🎨 Showing example UI');
        }, 4000);
      }
    }
  };

  // Generate HTML project with AI content
  const generateHTMLProject = async (projectName: string, description: string) => {
    console.log('🏗️ Generating AI-powered website:', projectName);
    
    // Check if user is asking for a game
    const isGame = projectName.toLowerCase().includes('game') || 
                   projectName.toLowerCase().includes('play') ||
                   projectName.toLowerCase().includes('puzzle') ||
                   projectName.toLowerCase().includes('quiz') ||
                   projectName.toLowerCase().includes('racing') ||
                   projectName.toLowerCase().includes('adventure') ||
                   projectName.toLowerCase().includes('break') ||
                   projectName.toLowerCase().includes('blocks') ||
                   projectName.toLowerCase().includes('minecraft') ||
                   projectName.toLowerCase().includes('mine') ||
                   projectName.toLowerCase().includes('block');
    
    try {
      // Generate website content using AI
      console.log('🤖 Calling AI to generate website content...');
      const websiteContent = await generateWebsiteContent(projectName, description, isGame);
      
      const files: ProjectFile[] = [
        {
          name: 'index.html',
          type: 'html',
          content: websiteContent.html
        },
        {
          name: 'styles.css',
          type: 'css',
          content: websiteContent.css
        },
        {
          name: 'script.js',
          type: 'js',
          content: websiteContent.js
        }
      ];
      
      console.log('📁 AI-generated', files.length, 'files:', files.map(f => f.name));
      setProjectFiles(files);
      return files;
    } catch (error) {
      console.error('❌ Error generating AI content:', error);
      // Return empty files if AI fails
      const fallbackFiles: ProjectFile[] = [
        {
          name: 'index.html',
          type: 'html',
          content: `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${projectName}</title>
    <style>
        body { font-family: Arial, sans-serif; text-align: center; padding: 50px; }
        h1 { color: #667eea; }
    </style>
</head>
<body>
    <h1>${projectName}</h1>
    <p>${description}</p>
    <p>AI content generation failed. Please try again.</p>
</body>
</html>`
        },
        {
          name: 'styles.css',
          type: 'css',
          content: `/* Fallback CSS */`
        },
        {
          name: 'script.js',
          type: 'js',
          content: `// Fallback JavaScript`
        }
      ];
      setProjectFiles(fallbackFiles);
      return fallbackFiles;
    }
  };

  // Generate game HTML
  const generateGameHTML = (projectName: string, description: string) => {
    // Check if it's a block-breaking game
    const isBlockGame = projectName.toLowerCase().includes('break') || 
                        projectName.toLowerCase().includes('blocks') ||
                        projectName.toLowerCase().includes('minecraft') ||
                        projectName.toLowerCase().includes('mine');
    
    if (isBlockGame) {
      return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${projectName}</title>
    <link rel="stylesheet" href="styles.css">
</head>
<body>
    <div class="game-container">
        <header>
            <h1>${projectName}</h1>
            <p>${description}</p>
            <div class="game-stats">
                <span id="score">Score: 0</span>
                <span id="blocks">Blocks: 0</span>
                <span id="level">Level: 1</span>
                <span id="tool">Tool: Pickaxe</span>
            </div>
        </header>
        <main>
            <div class="game-board" id="gameBoard">
                <div class="game-message" id="gameMessage">
                    <h2>Ready to Break Blocks?</h2>
                    <p>Click Start Game to begin mining!</p>
                    <button id="startBtn">Start Game</button>
                </div>
            </div>
            <div class="inventory">
                <h3>Inventory</h3>
                <div class="inventory-items">
                    <div class="item" data-type="wood">🪵 Wood: <span id="woodCount">0</span></div>
                    <div class="item" data-type="stone">🪨 Stone: <span id="stoneCount">0</span></div>
                    <div class="item" data-type="iron">⚙️ Iron: <span id="ironCount">0</span></div>
                    <div class="item" data-type="gold">🪙 Gold: <span id="goldCount">0</span></div>
                    <div class="item" data-type="diamond">💎 Diamond: <span id="diamondCount">0</span></div>
                </div>
            </div>
            <div class="game-controls">
                <button class="tool-btn active" data-tool="pickaxe">⛏️ Pickaxe</button>
                <button class="tool-btn" data-tool="axe">🪓 Axe</button>
                <button class="tool-btn" data-tool="shovel">🔨 Shovel</button>
                <button class="tool-btn" data-tool="sword">⚔️ Sword</button>
            </div>
        </main>
        <footer>
            <p>🎮 ${projectName} - Created with AI</p>
        </footer>
    </div>
    <script src="script.js"></script>
</body>
</html>`;
    } else {
      // Default game template
      return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${projectName}</title>
    <link rel="stylesheet" href="styles.css">
</head>
<body>
    <div class="game-container">
        <header>
            <h1>${projectName}</h1>
            <p>${description}</p>
            <div class="game-stats">
                <span id="score">Score: 0</span>
                <span id="level">Level: 1</span>
                <span id="lives">Lives: 3</span>
            </div>
        </header>
        <main>
            <div class="game-board" id="gameBoard">
                <div class="game-message" id="gameMessage">
                    <h2>Ready to Play?</h2>
                    <p>Click Start Game to begin!</p>
                    <button id="startBtn">Start Game</button>
                </div>
            </div>
            <div class="game-controls">
                <button id="upBtn">↑</button>
                <button id="leftBtn">←</button>
                <button id="downBtn">↓</button>
                <button id="rightBtn">→</button>
                <button id="actionBtn">Action</button>
            </div>
        </main>
        <footer>
            <p>🎮 ${projectName} - Created with AI</p>
        </footer>
    </div>
    <script src="script.js"></script>
</body>
</html>`;
    }
  };

  // Generate app HTML
  const generateAppHTML = (projectName: string, description: string) => {
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${projectName}</title>
    <link rel="stylesheet" href="styles.css">
</head>
<body>
    <div class="container">
        <header>
            <h1>${projectName}</h1>
            <p>${description}</p>
            <nav class="app-nav">
                <button class="nav-btn active" data-section="home">Home</button>
                <button class="nav-btn" data-section="features">Features</button>
                <button class="nav-btn" data-section="about">About</button>
                <button class="nav-btn" data-section="contact">Contact</button>
            </nav>
        </header>
        <main>
            <section class="content-section active" id="home">
                <h2>Welcome to ${projectName}</h2>
                <p>This is a modern web application created with AI assistance.</p>
                <button id="actionBtn">Get Started</button>
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
            <section class="content-section" id="features">
                <h2>Features</h2>
                <p>Discover all the amazing features of ${projectName}.</p>
            </section>
            <section class="content-section" id="about">
                <h2>About</h2>
                <p>Learn more about ${projectName} and our mission.</p>
            </section>
            <section class="content-section" id="contact">
                <h2>Contact</h2>
                <p>Get in touch with us for any questions.</p>
            </section>
        </main>
        <footer>
            <p>&copy; 2024 ${projectName}. All rights reserved.</p>
        </footer>
    </div>
    <script src="script.js"></script>
</body>
</html>`;
  };

  // Generate game CSS
  const generateGameCSS = () => {
    return `* {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
}

body {
    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
    line-height: 1.6;
    color: #fff;
    background: linear-gradient(135deg, #8B4513 0%, #654321 100%);
    min-height: 100vh;
    overflow-x: hidden;
}

.game-container {
    max-width: 1200px;
    margin: 0 auto;
    padding: 20px;
}

header {
    text-align: center;
    margin-bottom: 30px;
}

header h1 {
    font-size: 3rem;
    margin-bottom: 10px;
    text-shadow: 2px 2px 4px rgba(0,0,0,0.3);
    animation: glow 2s ease-in-out infinite alternate;
}

@keyframes glow {
    from { text-shadow: 2px 2px 4px rgba(0,0,0,0.3), 0 0 10px #fff; }
    to { text-shadow: 2px 2px 4px rgba(0,0,0,0.3), 0 0 20px #fff, 0 0 30px #fff; }
}

.game-stats {
    display: flex;
    justify-content: center;
    gap: 30px;
    margin-top: 20px;
    font-size: 1.2rem;
    font-weight: bold;
}

.game-board {
    background: rgba(139, 69, 19, 0.3);
    border: 3px solid rgba(255,255,255,0.3);
    border-radius: 20px;
    height: 400px;
    margin-bottom: 30px;
    position: relative;
    overflow: hidden;
    backdrop-filter: blur(10px);
}

.game-message {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    text-align: center;
    z-index: 10;
}

.game-message h2 {
    font-size: 2rem;
    margin-bottom: 15px;
}

#startBtn {
    background: linear-gradient(45deg, #FFD700, #FFA500);
    color: #333;
    border: none;
    padding: 15px 30px;
    font-size: 1.2rem;
    border-radius: 25px;
    cursor: pointer;
    transition: all 0.3s ease;
    margin-top: 20px;
    font-weight: bold;
}

#startBtn:hover {
    transform: scale(1.1);
    box-shadow: 0 5px 15px rgba(255, 215, 0, 0.4);
}

.inventory {
    background: rgba(0, 0, 0, 0.3);
    border: 2px solid rgba(255,255,255,0.2);
    border-radius: 15px;
    padding: 20px;
    margin-bottom: 20px;
}

.inventory h3 {
    text-align: center;
    margin-bottom: 15px;
    color: #FFD700;
}

.inventory-items {
    display: flex;
    justify-content: space-around;
    flex-wrap: wrap;
    gap: 10px;
}

.item {
    background: rgba(255,255,255,0.1);
    padding: 10px 15px;
    border-radius: 10px;
    text-align: center;
    min-width: 100px;
    border: 1px solid rgba(255,255,255,0.2);
}

.game-controls {
    display: flex;
    justify-content: center;
    gap: 10px;
    flex-wrap: wrap;
}

.tool-btn {
    background: rgba(255,255,255,0.2);
    color: white;
    border: 2px solid rgba(255,255,255,0.3);
    padding: 15px 20px;
    font-size: 1.2rem;
    border-radius: 15px;
    cursor: pointer;
    transition: all 0.3s ease;
    backdrop-filter: blur(10px);
}

.tool-btn:hover,
.tool-btn.active {
    background: rgba(255,255,255,0.3);
    transform: translateY(-2px);
    border-color: #FFD700;
}

.block {
    position: absolute;
    cursor: pointer;
    transition: all 0.3s ease;
    border-radius: 5px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1.5rem;
    user-select: none;
}

.block:hover {
    transform: scale(1.1);
    box-shadow: 0 0 20px rgba(255,255,255,0.5);
}

.block.breaking {
    animation: break-block 0.5s ease-out forwards;
}

@keyframes break-block {
    0% { transform: scale(1) rotate(0deg); opacity: 1; }
    50% { transform: scale(1.2) rotate(10deg); opacity: 0.8; }
    100% { transform: scale(0) rotate(20deg); opacity: 0; }
}

.particle {
    position: absolute;
    width: 4px;
    height: 4px;
    background: #FFD700;
    border-radius: 50%;
    pointer-events: none;
    animation: particle-float 1s ease-out forwards;
}

@keyframes particle-float {
    to {
        transform: translate(var(--tx), var(--ty));
        opacity: 0;
    }
}

footer {
    text-align: center;
    margin-top: 30px;
    opacity: 0.8;
}

@media (max-width: 768px) {
    .game-container {
        padding: 10px;
    }
    
    header h1 {
        font-size: 2rem;
    }
    
    .game-board {
        height: 300px;
    }
    
    .game-stats {
        flex-direction: column;
        gap: 10px;
        align-items: center;
    }
    
    .inventory-items {
        flex-direction: column;
        align-items: center;
    }
    
    .item {
        width: 200px;
    }
}`;
  };

  // Generate app CSS
  const generateAppCSS = () => {
    return `* {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
}

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
    margin-bottom: 40px;
    color: white;
}

header h1 {
    font-size: 3rem;
    margin-bottom: 10px;
    text-shadow: 2px 2px 4px rgba(0,0,0,0.3);
}

header p {
    font-size: 1.2rem;
    opacity: 0.9;
    margin-bottom: 20px;
}

.app-nav {
    display: flex;
    justify-content: center;
    gap: 10px;
    flex-wrap: wrap;
}

.nav-btn {
    background: rgba(255,255,255,0.2);
    color: white;
    border: 2px solid rgba(255,255,255,0.3);
    padding: 10px 20px;
    border-radius: 25px;
    cursor: pointer;
    transition: all 0.3s ease;
    backdrop-filter: blur(10px);
}

.nav-btn:hover,
.nav-btn.active {
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

.content-section {
    display: none;
}

.content-section.active {
    display: block;
}

.content-section h2 {
    color: #667eea;
    margin-bottom: 20px;
    font-size: 2rem;
}

.content-section p {
    margin-bottom: 20px;
    font-size: 1.1rem;
}

#actionBtn {
    background: linear-gradient(45deg, #667eea, #764ba2);
    color: white;
    border: none;
    padding: 15px 30px;
    font-size: 1.1rem;
    border-radius: 25px;
    cursor: pointer;
    transition: transform 0.3s ease, box-shadow 0.3s ease;
    margin-bottom: 30px;
}

#actionBtn:hover {
    transform: translateY(-2px);
    box-shadow: 0 5px 15px rgba(102, 126, 234, 0.4);
}

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
    transition: transform 0.3s ease, box-shadow 0.3s ease;
}

.feature-card:hover {
    transform: translateY(-5px);
    box-shadow: 0 10px 25px rgba(0,0,0,0.1);
}

.feature-card h3 {
    color: #667eea;
    margin-bottom: 15px;
    font-size: 1.3rem;
}

footer {
    text-align: center;
    color: white;
    opacity: 0.8;
}

@media (max-width: 768px) {
    .container {
        padding: 10px;
    }
    
    header h1 {
        font-size: 2rem;
    }
    
    main {
        padding: 20px;
    }
    
    .app-nav {
        flex-direction: column;
        align-items: center;
    }
    
    .nav-btn {
        width: 200px;
    }
}`;
  };

  // Generate game JavaScript
  const generateGameJS = (projectName: string) => {
    // Check if it's a block-breaking game
    const isBlockGame = projectName.toLowerCase().includes('break') || 
                        projectName.toLowerCase().includes('blocks') ||
                        projectName.toLowerCase().includes('minecraft') ||
                        projectName.toLowerCase().includes('mine');
    
    if (isBlockGame) {
      return `// Block Breaking Game JavaScript for ${projectName}
document.addEventListener('DOMContentLoaded', function() {
    console.log('${projectName} game loaded!');
    
    const gameBoard = document.getElementById('gameBoard');
    const startBtn = document.getElementById('startBtn');
    const scoreElement = document.getElementById('score');
    const blocksElement = document.getElementById('blocks');
    const levelElement = document.getElementById('level');
    const toolElement = document.getElementById('tool');
    const gameMessage = document.getElementById('gameMessage');
    const toolBtns = document.querySelectorAll('.tool-btn');
    
    // Inventory elements
    const woodCount = document.getElementById('woodCount');
    const stoneCount = document.getElementById('stoneCount');
    const ironCount = document.getElementById('ironCount');
    const goldCount = document.getElementById('goldCount');
    const diamondCount = document.getElementById('diamondCount');
    
    let score = 0;
    let blocks = 0;
    let level = 1;
    let gameActive = false;
    let currentTool = 'pickaxe';
    let gameBlocks = [];
    
    // Block types with their properties
    const blockTypes = [
        { type: 'wood', emoji: '🪵', color: '#8B4513', hardness: 1, points: 10 },
        { type: 'stone', emoji: '🪨', color: '#808080', hardness: 2, points: 20 },
        { type: 'iron', emoji: '⚙️', color: '#C0C0C0', hardness: 3, points: 30 },
        { type: 'gold', emoji: '🪙', color: '#FFD700', hardness: 2, points: 50 },
        { type: 'diamond', emoji: '💎', color: '#B9F2FF', hardness: 4, points: 100 }
    ];
    
    // Tool effectiveness against block types
    const toolEffectiveness = {
        pickaxe: { wood: 3, stone: 2, iron: 1, gold: 2, diamond: 1 },
        axe: { wood: 3, stone: 1, iron: 1, gold: 1, diamond: 0 },
        shovel: { wood: 2, stone: 2, iron: 1, gold: 1, diamond: 0 },
        sword: { wood: 2, stone: 1, iron: 1, gold: 1, diamond: 1 }
    };
    
    // Start game
    startBtn.addEventListener('click', startGame);
    
    // Tool selection
    toolBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            toolBtns.forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            currentTool = this.getAttribute('data-tool');
            toolElement.textContent = \`Tool: \${currentTool.charAt(0).toUpperCase() + currentTool.slice(1)}\`;
        });
    });
    
    function startGame() {
        console.log('🎮 Starting block breaking game...');
        gameActive = true;
        score = 0;
        blocks = 0;
        level = 1;
        updateStats();
        
        // Hide start message
        gameMessage.style.display = 'none';
        
        // Create blocks
        createBlocks();
        
        console.log('🎯 Game started! Break the blocks!');
    }
    
    function createBlocks() {
        // Clear existing blocks
        gameBlocks.forEach(block => block.element.remove());
        gameBlocks = [];
        
        // Create random blocks
        const numBlocks = 10 + level * 2;
        
        for (let i = 0; i < numBlocks; i++) {
            const blockType = blockTypes[Math.floor(Math.random() * blockTypes.length)];
            const block = document.createElement('div');
            block.className = 'block';
            block.textContent = blockType.emoji;
            block.style.cssText = \`
                width: \${40 + Math.random() * 20}px;
                height: \${40 + Math.random() * 20}px;
                background: \${blockType.color};
                left: \${Math.random() * 80}%;
                top: \${Math.random() * 80}%;
                font-size: \${20 + Math.random() * 10}px;
                box-shadow: 0 2px 5px rgba(0,0,0,0.3);
            \`;
            
            block.addEventListener('click', () => {
                if (gameActive) {
                    breakBlock(block, blockType);
                }
            });
            
            gameBoard.appendChild(block);
            gameBlocks.push({
                element: block,
                type: blockType,
                hits: 0,
                maxHits: blockType.hardness
            });
        }
        
        blocksElement.textContent = \`Blocks: \${numBlocks}\`;
    }
    
    function breakBlock(blockElement, blockType) {
        const block = gameBlocks.find(b => b.element === blockElement);
        if (!block) return;
        
        const effectiveness = toolEffectiveness[currentTool][blockType.type];
        block.hits += effectiveness;
        
        // Create hit effect
        createHitEffect(blockElement);
        
        if (block.hits >= block.maxHits) {
            // Block broken
            score += blockType.points;
            blocks++;
            updateInventory(blockType.type);
            updateStats();
            
            // Breaking animation
            blockElement.classList.add('breaking');
            
            // Create particles
            createParticles(blockElement);
            
            setTimeout(() => {
                blockElement.remove();
                gameBlocks = gameBlocks.filter(b => b.element !== blockElement);
                
                // Check if level complete
                if (gameBlocks.length === 0) {
                    levelUp();
                }
                
                // Update blocks count
                blocksElement.textContent = \`Blocks: \${gameBlocks.length}\`;
            }, 500);
        }
    }
    
    function createHitEffect(element) {
        const effect = document.createElement('div');
        effect.style.cssText = \`
            position: absolute;
            top: \${element.offsetTop}px;
            left: \${element.offsetLeft}px;
            width: \${element.offsetWidth}px;
            height: \${element.offsetHeight}px;
            border: 2px solid #FFD700;
            border-radius: 5px;
            pointer-events: none;
            animation: hit-effect 0.2s ease-out forwards;
        \`;
        gameBoard.appendChild(effect);
        
        setTimeout(() => effect.remove(), 200);
    }
    
    function createParticles(element) {
        for (let i = 0; i < 8; i++) {
            const particle = document.createElement('div');
            particle.className = 'particle';
            particle.style.cssText = \`
                left: \${element.offsetLeft + element.offsetWidth / 2}px;
                top: \${element.offsetTop + element.offsetHeight / 2}px;
                --tx: \${(Math.random() - 0.5) * 100}px;
                --ty: \${(Math.random() - 0.5) * 100}px;
            \`;
            gameBoard.appendChild(particle);
            
            setTimeout(() => particle.remove(), 1000);
        }
    }
    
    function updateInventory(blockType) {
        const countElement = document.getElementById(\`\${blockType}Count\`);
        if (countElement) {
            const currentCount = parseInt(countElement.textContent);
            countElement.textContent = currentCount + 1;
        }
    }
    
    function levelUp() {
        level++;
        updateStats();
        
        // Show level up message
        const message = document.createElement('div');
        message.textContent = \`Level \${level}!\`;
        message.style.cssText = \`
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            font-size: 3rem;
            color: #FFD700;
            font-weight: bold;
            z-index: 100;
            animation: level-up 2s ease-out forwards;
        \`;
        gameBoard.appendChild(message);
        
        setTimeout(() => {
            message.remove();
            createBlocks();
        }, 2000);
    }
    
    function updateStats() {
        scoreElement.textContent = \`Score: \${score}\`;
        levelElement.textContent = \`Level: \${level}\`;
    }
    
    // Add CSS animations
    const style = document.createElement('style');
    style.textContent = \`
        @keyframes hit-effect {
            0% { transform: scale(1); opacity: 1; }
            100% { transform: scale(1.2); opacity: 0; }
        }
        
        @keyframes level-up {
            0% { transform: translate(-50%, -50%) scale(0); opacity: 1; }
            50% { transform: translate(-50%, -50%) scale(1.5); opacity: 1; }
            100% { transform: translate(-50%, -50%) scale(1); opacity: 0; }
        }
    \`;
    document.head.appendChild(style);
});`;
    } else {
      // Default game JavaScript
      return `// Game JavaScript for ${projectName}
document.addEventListener('DOMContentLoaded', function() {
    console.log('${projectName} game loaded!');
    
    const gameBoard = document.getElementById('gameBoard');
    const startBtn = document.getElementById('startBtn');
    const scoreElement = document.getElementById('score');
    const levelElement = document.getElementById('level');
    const livesElement = document.getElementById('lives');
    const gameMessage = document.getElementById('gameMessage');
    
    let score = 0;
    let level = 1;
    let lives = 3;
    let gameActive = false;
    let gameElements = [];
    
    // Start game
    startBtn.addEventListener('click', startGame);
    
    function startGame() {
        console.log('🎮 Starting game...');
        gameActive = true;
        score = 0;
        level = 1;
        lives = 3;
        updateStats();
        
        // Hide start message
        gameMessage.style.display = 'none';
        
        // Create game elements
        createGameElements();
        
        // Start game loop
        gameLoop();
        
        // Add keyboard controls
        setupKeyboardControls();
    }
    
    function createGameElements() {
        // Clear existing elements
        gameElements.forEach(el => el.element.remove());
        gameElements = [];
        
        // Create random game elements
        for (let i = 0; i < 5; i++) {
            const element = document.createElement('div');
            element.className = 'game-element';
            element.style.cssText = \`
                position: absolute;
                width: 50px;
                height: 50px;
                background: linear-gradient(45deg, #ff6b6b, #4ecdc4);
                border-radius: 50%;
                left: \${Math.random() * 80 + 10}%;
                top: \${Math.random() * 70 + 10}%;
                cursor: pointer;
                transition: all 0.3s ease;
                box-shadow: 0 5px 15px rgba(0,0,0,0.3);
            \`;
            
            element.addEventListener('click', () => {
                if (gameActive) {
                    collectElement(element);
                }
            });
            
            gameBoard.appendChild(element);
            gameElements.push({
                element,
                x: parseFloat(element.style.left),
                y: parseFloat(element.style.top),
                vx: (Math.random() - 0.5) * 2,
                vy: (Math.random() - 0.5) * 2
            });
        }
    }
    
    function collectElement(element) {
        score += 10;
        updateStats();
        
        // Visual feedback
        element.style.transform = 'scale(1.5)';
        element.style.opacity = '0';
        
        setTimeout(() => {
            element.remove();
            gameElements = gameElements.filter(g => g.element !== element);
            
            // Check if level complete
            if (gameElements.length === 0) {
                levelUp();
            }
        }, 300);
        
        // Create particle effect
        createParticles(element.offsetLeft + 25, element.offsetTop + 25);
    }
    
    function createParticles(x, y) {
        for (let i = 0; i < 10; i++) {
            const particle = document.createElement('div');
            particle.style.cssText = \`
                position: absolute;
                width: 5px;
                height: 5px;
                background: #fff;
                border-radius: 50%;
                left: \${x}px;
                top: \${y}px;
                pointer-events: none;
                animation: particle-float 1s ease-out forwards;
            \`;
            gameBoard.appendChild(particle);
            
            setTimeout(() => particle.remove(), 1000);
        }
    }
    
    function levelUp() {
        level++;
        updateStats();
        
        // Show level up message
        const message = document.createElement('div');
        message.textContent = \`Level \${level}!\`;
        message.style.cssText = \`
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            font-size: 3rem;
            color: #fff;
            font-weight: bold;
            z-index: 100;
            animation: level-up 2s ease-out forwards;
        \`;
        gameBoard.appendChild(message);
        
        setTimeout(() => {
            message.remove();
            createGameElements();
        }, 2000);
    }
    
    function gameLoop() {
        if (!gameActive) return;
        
        // Update game elements
        gameElements.forEach(gameEl => {
            gameEl.x += gameEl.vx;
            gameEl.y += gameEl.vy;
            
            // Bounce off walls
            if (gameEl.x <= 0 || gameEl.x >= 85) gameEl.vx *= -1;
            if (gameEl.y <= 0 || gameEl.y >= 75) gameEl.vy *= -1;
            
            gameEl.element.style.left = gameEl.x + '%';
            gameEl.element.style.top = gameEl.y + '%';
        });
        
        requestAnimationFrame(gameLoop);
    }
    
    function setupKeyboardControls() {
        document.addEventListener('keydown', (e) => {
            if (!gameActive) return;
            
            switch(e.key) {
                case 'ArrowUp':
                case 'w':
                    movePlayer('up');
                    break;
                case 'ArrowDown':
                case 's':
                    movePlayer('down');
                    break;
                case 'ArrowLeft':
                case 'a':
                    movePlayer('left');
                    break;
                case 'ArrowRight':
                case 'd':
                    movePlayer('right');
                    break;
                case ' ':
                    playerAction();
                    break;
            }
        });
    }
    
    function movePlayer(direction) {
        console.log('Moving player:', direction);
        // Add player movement logic here
    }
    
    function playerAction() {
        console.log('Player action!');
        // Add player action logic here
    }
    
    function updateStats() {
        scoreElement.textContent = \`Score: \${score}\`;
        levelElement.textContent = \`Level: \${level}\`;
        livesElement.textContent = \`Lives: \${lives}\`;
    }
    
    // Add CSS animations
    const style = document.createElement('style');
    style.textContent = \`
        @keyframes particle-float {
            to {
                transform: translate(\${Math.random() * 100 - 50}px, \${-Math.random() * 100}px);
                opacity: 0;
            }
        }
        
        @keyframes level-up {
            0% { transform: translate(-50%, -50%) scale(0); opacity: 1; }
            50% { transform: translate(-50%, -50%) scale(1.5); opacity: 1; }
            100% { transform: translate(-50%, -50%) scale(1); opacity: 0; }
        }
    \`;
    document.head.appendChild(style);
});`;
    }
  };

  // Generate app JavaScript
  const generateAppJS = (projectName: string) => {
    return `// Interactive JavaScript for ${projectName}
document.addEventListener('DOMContentLoaded', function() {
    console.log('${projectName} loaded successfully!');
    
    const actionBtn = document.getElementById('actionBtn');
    const navBtns = document.querySelectorAll('.nav-btn');
    const sections = document.querySelectorAll('.content-section');
    
    // Navigation
    navBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            const targetSection = this.getAttribute('data-section');
            
            // Update active states
            navBtns.forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            
            // Show target section
            sections.forEach(section => {
                section.classList.remove('active');
                if (section.id === targetSection) {
                    section.classList.add('active');
                }
            });
        });
    });
    
    // Action button functionality
    actionBtn.addEventListener('click', function() {
        // Create a fun animation
        const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7'];
        const randomColor = colors[Math.floor(Math.random() * colors.length)];
        
        const content = document.querySelector('.content-section.active');
        content.style.background = \`linear-gradient(45deg, \${randomColor}22, \${randomColor}11)\`;
        content.style.transition = 'background 0.5s ease';
        
        // Add a new element
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
        
        // Scroll to the new element
        newElement.scrollIntoView({ behavior: 'smooth' });
        
        // Remove the element after 5 seconds
        setTimeout(() => {
            newElement.style.opacity = '0';
            newElement.style.transition = 'opacity 0.5s ease';
            setTimeout(() => newElement.remove(), 500);
        }, 5000);
    });
    
    // Add some interactive features
    document.addEventListener('mousemove', function(e) {
        const x = e.clientX / window.innerWidth;
        const y = e.clientY / window.innerHeight;
        
        document.body.style.background = \`linear-gradient(\${135 + x * 45}deg, 
            hsl(\${250 + x * 60}, 70%, \${50 + y * 20}%) 0%, 
            hsl(\${280 + x * 60}, 70%, \${40 + y * 20}%) 100%)\`;
    });
    
    // Add smooth scroll behavior
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({ behavior: 'smooth' });
            }
        });
    });
    
    // Add form validation if forms exist
    const forms = document.querySelectorAll('form');
    forms.forEach(form => {
        form.addEventListener('submit', function(e) {
            e.preventDefault();
            console.log('Form submitted:', new FormData(this));
        });
    });
    
    // Add loading states for any buttons
    const buttons = document.querySelectorAll('button');
    buttons.forEach(btn => {
        btn.addEventListener('click', function() {
            if (!this.classList.contains('nav-btn')) {
                this.style.transform = 'scale(0.95)';
                setTimeout(() => {
                    this.style.transform = 'scale(1)';
                }, 100);
            }
        });
    });
});`;
  };

  // Generate complete HTML with embedded CSS and JS for iframe preview
  const generateCompleteHTML = (files: ProjectFile[]) => {
    const htmlFile = files.find(f => f.name === 'index.html');
    const cssFile = files.find(f => f.name === 'styles.css');
    const jsFile = files.find(f => f.name === 'script.js');
    
    if (!htmlFile) return '';
    
    let completeHTML = htmlFile.content;
    
    // Embed CSS if available
    if (cssFile) {
      const cssContent = cssFile.content.replace(/`/g, '\\`');
      completeHTML = completeHTML.replace(
        '</head>',
        `    <style>\n${cssContent}\n    </style>\n  </head>`
      );
    }
    
    // Embed JS if available
    if (jsFile) {
      const jsContent = jsFile.content.replace(/`/g, '\\`');
      completeHTML = completeHTML.replace(
        '<script src="script.js"></script>',
        `    <script>\n${jsContent}\n    </script>`
      );
    }
    
    return completeHTML;
  };

  const handleSignIn = async () => {
    try {
      const user = await signInWithGoogle();
      setCurrentUser(user);
      setIsProfileOpen(false);
    } catch (error) {
      console.error('Error signing in:', error);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOutUser();
      setIsProfileOpen(false);
      setShowProfileDetail(false);
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  if (showExampleUi) {
    return (
      <div className="min-h-screen bg-[#808080] relative overflow-hidden font-mono p-6 flex gap-6 h-screen">
        {/* Global Noise Texture Overlay */}
        <div 
          className="absolute inset-0 pointer-events-none z-10"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
            opacity: 0.08,
          }}
        />
        
        {/* Left Section - Live Preview Only */}
        <div className="flex-1 relative z-20 flex flex-col gap-6">
          {projectFiles.length > 0 ? (
            <div className="flex-1 bg-white/10 backdrop-blur-xl rounded-[40px] border border-white/15 shadow-2xl p-6 overflow-hidden relative">
              <div 
                className="absolute inset-0 pointer-events-none opacity-10"
                style={{
                  backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
                }}
              />
              <div className="h-full flex flex-col">
                <h3 className="text-white text-xl mb-4 text-center">Live Preview</h3>
                <div className="flex-1 bg-white/10 backdrop-blur-md rounded-lg p-2 min-h-0">
                  <iframe
                    srcDoc={generateCompleteHTML(projectFiles)}
                    className="w-full h-full rounded border-0"
                    title="Project Preview"
                    sandbox="allow-scripts allow-same-origin"
                  />
                </div>
                <div className="mt-4 text-white/70 text-sm text-center">
                  <p>📁 Generated Files: {projectFiles.map(f => f.name).join(', ')}</p>
                  <p className="text-xs mt-1">✨ Full VFS preview with embedded CSS & JavaScript</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex-1 bg-white/10 backdrop-blur-xl rounded-[40px] border border-white/15 shadow-2xl p-10 overflow-hidden relative flex items-center justify-center">
              <div 
                className="absolute inset-0 pointer-events-none opacity-10"
                style={{
                  backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
                }}
              />
              <div className="text-center">
                <h1 className="text-white text-4xl md:text-5xl font-normal tracking-wider max-w-2xl leading-tight mb-4">
                  Enter a project idea
                </h1>
                <p className="text-white/70 text-lg">
                  Type any app, game, or website name and press Enter
                </p>
                <div className="mt-8 text-white/50 text-sm">
                  <p>🎮 Games • 📱 Apps • 🌐 Websites • 🎨 Tools</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right Section - Sidebar */}
        <div className="flex-1 relative z-20 flex flex-col gap-6">
          {/* Top Info Card */}
          <div className="flex-[4] bg-white/10 backdrop-blur-xl rounded-[40px] border border-white/15 shadow-2xl p-10 overflow-hidden relative">
            <div 
              className="absolute inset-0 pointer-events-none opacity-10"
              style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
              }}
            />
            <p className="text-white text-lg leading-relaxed font-mono opacity-90">
              {(streamingContent || generatedContent) || 'Some html jarble example goes here... blah blah blah'}
            </p>
          </div>

          {/* Bottom Input Field Container */}
          <div className="flex-none bg-white/5 backdrop-blur-xl rounded-[40px] border border-white/10 shadow-2xl p-2 relative overflow-hidden">
             <div className="bg-white/10 rounded-[32px] overflow-hidden relative flex items-center gap-2 px-3">
                <input
                  type="text"
                  placeholder="Any Changes?"
                  className="flex-1 px-4 py-5 bg-transparent text-white placeholder-white/50 outline-none font-mono text-lg"
                />
                <button 
                  className="flex items-center gap-2 px-4 py-3 bg-white/20 rounded-[24px] border border-white/30 hover:bg-white/30 transition-all group"
                  onClick={() => alert('Element selection mode activated! Click on any element on the page to select it for specific questions.')}
                >
                  <MousePointer2 className="w-5 h-5 text-white/80 group-hover:text-white transition-colors" />
                  <span className="text-white/70 text-sm font-mono">Select Element</span>
                </button>
                <div 
                  className="absolute inset-0 pointer-events-none opacity-5"
                  style={{
                    backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
                  }}
                />
             </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#808080] relative overflow-hidden font-mono">
      {/* Global Noise Texture Overlay */}
      <div 
        className="absolute inset-0 pointer-events-none z-10"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
          opacity: 0.08,
        }}
      />
      
      {/* Grain texture overlay with blend mode */}
      <div 
        className="absolute inset-0 pointer-events-none z-10 mix-blend-overlay"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='grain'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='1.5' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23grain)'/%3E%3C/svg%3E")`,
          opacity: 0.15,
        }}
      />

      {/* Main Content Area */}
      <div className={cn("relative z-20 p-8 h-screen flex flex-col transition-all duration-500", showOrbAnimation && "blur-xl")}>
        {/* Header Section */}
        <div className="flex items-start justify-between w-full max-w-6xl mx-auto">
          {/* Search/Input Bar */}
          <div className="relative">
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="What would you like to create?"
              className="w-[300px] px-5 py-4 bg-white/10 backdrop-blur-xl rounded-[24px] text-white placeholder-white/70 text-sm outline-none border border-white/20 focus:border-white/40 focus:bg-white/15 transition-all shadow-xl"
            />
            {/* Input specific grain/noise overlay */}
            <div 
              className="absolute inset-0 pointer-events-none rounded-[24px]"
              style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
                opacity: 0.05,
              }}
            />
          </div>

          {/* Profile Section */}
          <div className="relative" ref={profileRef}>
            <button 
              onClick={() => setIsProfileOpen(!isProfileOpen)}
              className={cn(
                "w-12 h-12 bg-white/10 backdrop-blur-xl rounded-2xl flex items-center justify-center border border-white/20 hover:bg-white/15 transition-all shadow-xl relative overflow-hidden group",
                isProfileOpen && "bg-white/20 border-white/40"
              )}
            >
              <User className="w-6 h-6 text-white/80 group-hover:text-white transition-colors" />
              {/* Noise overlay for the button */}
              <div 
                className="absolute inset-0 pointer-events-none rounded-2xl"
                style={{
                  backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
                  opacity: 0.08,
                }}
              />
            </button>

            {/* Profile Menu Dropdown */}
            <AnimatePresence>
              {isProfileOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  className="absolute right-0 mt-4 w-[280px] bg-white/15 backdrop-blur-3xl rounded-[28px] border border-white/30 shadow-2xl p-6 z-50 overflow-hidden"
                >
                  {/* Menu inner noise */}
                  <div 
                    className="absolute inset-0 pointer-events-none"
                    style={{
                      backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.7' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
                      opacity: 0.12,
                    }}
                  />

                  {/* Header Row: Username and Icon */}
                  <div className="flex justify-between items-center mb-8 relative z-10">
                    <span className="text-white text-[19px] font-normal tracking-tight font-mono">
                      {userProfile?.username || currentUser?.displayName || 'Guest'}
                    </span>
                    <div className="relative">
                      <div className="w-14 h-14 rounded-full bg-white/10 flex items-center justify-center border border-white/10 overflow-hidden backdrop-blur-sm">
                        {currentUser?.photoURL ? (
                          <img src={currentUser.photoURL} alt="Profile" className="w-full h-full object-cover" />
                        ) : (
                          <User className="w-10 h-10 text-white/20" />
                        )}
                        <div 
                          className="absolute inset-0 pointer-events-none"
                          style={{
                            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
                            opacity: 0.15,
                          }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Controls Row */}
                  <div className="flex gap-4 relative z-10">
                    {currentUser ? (
                      <>
                        {/* Sign Out Button */}
                        <button 
                          onClick={handleSignOut}
                          className="flex-1 h-[72px] bg-white/30 backdrop-blur-md rounded-[24px] border border-white/30 flex items-center justify-center hover:bg-white/40 transition-all shadow-sm"
                        >
                          <span className="text-white text-sm font-mono">Sign Out</span>
                        </button>
                      </>
                    ) : (
                      <>
                        {/* Sign In Button */}
                        <button 
                          onClick={handleSignIn}
                          className="flex-1 h-[72px] bg-white/30 backdrop-blur-md rounded-[24px] border border-white/30 flex items-center justify-center hover:bg-white/40 transition-all shadow-sm"
                        >
                          <span className="text-white text-sm font-mono">Sign In</span>
                        </button>
                      </>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Project List Area */}
        <div className="mt-16 flex gap-8 ml-4 max-w-6xl mx-auto w-full">
          {projects.length > 0 ? (
            projects.slice(0, 6).map((project) => (
              <div 
                key={project.id} 
                className="relative group flex-shrink-0 cursor-pointer"
                onClick={() => setViewingProject(project)}
              >
                <div className="w-[150px] h-[170px] bg-white/10 backdrop-blur-xl rounded-[32px] overflow-hidden border border-white/20 shadow-2xl transition-transform hover:scale-[1.02]">
                  {/* Image/Preview */}
                  <div className="h-[120px] bg-white/15 relative overflow-hidden">
                    {project.imageUrl ? (
                      <img 
                        src={project.imageUrl} 
                        alt={project.name} 
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <User className="w-8 h-8 text-white/30" />
                      </div>
                    )}
                    {/* Card specific grain/noise overlay */}
                    <div 
                      className="absolute inset-0 pointer-events-none"
                      style={{
                        backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
                        opacity: 0.1,
                      }}
                    />
                  </div>
                  {/* Card Footer */}
                  <div className="h-[50px] bg-white/20 backdrop-blur-2xl px-5 flex items-center justify-between relative border-t border-white/10">
                    <span className="text-white text-[14px] font-normal tracking-tight font-mono truncate">
                      {project.name}
                    </span>
                    <div className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center border border-white/30 backdrop-blur-sm">
                      <User className="w-4 h-4 text-black/90" />
                    </div>
                  </div>
                </div>
              </div>
            ))
          ) : (
            // Fallback to placeholder projects if no real projects
            [1, 2].map((i) => (
              <div 
                key={i} 
                className="relative group flex-shrink-0 cursor-pointer"
                onClick={() => setViewingProject({
                  id: `placeholder-${i}`,
                  name: `Project ${i}`,
                  author: i === 1 ? "Brybod123" : "Bingaling123",
                  description: "This is a sample project description. The project showcases various design elements and interactive features.",
                  userId: 'placeholder',
                  createdAt: new Date()
                })}
              >
                <div className="w-[150px] h-[170px] bg-white/10 backdrop-blur-xl rounded-[32px] overflow-hidden border border-white/20 shadow-2xl transition-transform hover:scale-[1.02]">
                  {/* Image/Preview Placeholder */}
                  <div className="h-[120px] bg-white/15 relative overflow-hidden">
                     {/* Card specific grain/noise overlay */}
                    <div 
                      className="absolute inset-0 pointer-events-none"
                      style={{
                        backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
                        opacity: 0.1,
                      }}
                    />
                  </div>
                  {/* Card Footer */}
                  <div className="h-[50px] bg-white/20 backdrop-blur-2xl px-5 flex items-center justify-between relative border-t border-white/10">
                    <span className="text-white text-[14px] font-normal tracking-tight font-mono">Project</span>
                    <div className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center border border-white/30 backdrop-blur-sm">
                      <User className="w-4 h-4 text-black/90" />
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Orb Animation Overlay */}
      {showOrbAnimation && (
        <div 
          className="fixed inset-0 z-50 cursor-pointer"
          onClick={() => setShowOrbAnimation(false)}
        >
          <OrbAnimation isActive={showOrbAnimation} />
        </div>
      )}

      {/* Profile Detail View Overlay */}
      <AnimatePresence>
        {showProfileDetail && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] bg-[#808080] p-12 overflow-y-auto"
            onClick={() => setShowProfileDetail(false)}
          >
            <div className="max-w-6xl mx-auto mt-20" onClick={e => e.stopPropagation()}>
              <div className="flex items-start gap-8 mb-16">
                <div className="relative">
                  <div className="w-24 h-24 rounded-full bg-white/20 backdrop-blur-md flex flex-col items-center justify-center border border-white/30 overflow-hidden relative shadow-2xl">
                    <div className="w-8 h-8 rounded-full bg-white/40 mb-1" />
                    <div className="w-16 h-8 rounded-[100%] bg-white/40 translate-y-2 shadow-inner" />
                    <div className="absolute inset-0 bg-noise opacity-40 pointer-events-none" />
                  </div>
                </div>
                
                <div className="flex-1">
                  <p className="font-mono text-sm text-white/70 mb-1">10 Followers - 5,097 Views</p>
                  <h2 className="text-4xl font-mono text-white mb-4">Brybod123</h2>
                  <div className="flex gap-3">
                    <button className="px-6 py-1.5 bg-white/20 backdrop-blur-md rounded-full font-mono text-white border border-white/30 hover:bg-white/30 transition-colors text-sm shadow-sm">
                      Follow
                    </button>
                    <button className="px-6 py-1.5 bg-white/20 backdrop-blur-md rounded-full font-mono text-white border border-white/30 hover:bg-white/30 transition-colors text-sm shadow-sm">
                      Exclude
                    </button>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
                {[1, 2, 3, 4].map((i) => (
                  <div 
                    key={i} 
                    className="aspect-[4/5] bg-white/20 backdrop-blur-md rounded-[32px] border border-white/30 relative overflow-hidden group shadow-xl hover:scale-[1.02] transition-transform cursor-pointer"
                    onClick={() => setViewingProject({
                      name: `Project ${i}`,
                      author: "Brybod123",
                      description: "A creative project showcasing modern design principles and interactive elements."
                    })}
                  >
                    <div className="absolute inset-0 bg-noise opacity-60 mix-blend-overlay" />
                    <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                ))}
              </div>
            </div>
            
            <div className="fixed inset-0 pointer-events-none z-[-1]">
              <div className="absolute inset-0 opacity-[0.12] mix-blend-overlay bg-noise" />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Project View Overlay */}
      <AnimatePresence>
        {viewingProject && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[70] bg-[#808080] p-6 md:p-10 overflow-y-auto"
            onClick={() => setViewingProject(null)}
          >
            <div className="max-w-6xl mx-auto mt-6 md:mt-10" onClick={(e) => e.stopPropagation()}>
              {/* Back Button */}
              <button
                onClick={() => setViewingProject(null)}
                className="flex items-center gap-2 mb-6 text-white/70 hover:text-white transition-colors font-mono text-sm"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back</span>
              </button>

              {/* Two-column layout matching project editing page */}
              <div className="flex flex-col md:flex-row gap-6 md:gap-8">
                {/* Left panel: large preview card (same as "A WEBSITE GOES HERE!!!!" card) */}
                <div className="flex-[2.5] relative z-20 flex">
                  <div className="w-full bg-white/10 backdrop-blur-xl rounded-[40px] border border-white/15 shadow-2xl flex items-center justify-center p-10 md:p-12 overflow-hidden relative">
                    <div
                      className="absolute inset-0 pointer-events-none opacity-10"
                      style={{
                        backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
                      }}
                    />
                    <h1 className="text-white text-3xl md:text-4xl lg:text-5xl font-normal tracking-wider text-center max-w-2xl leading-tight">
                      {viewingProject.name}
                    </h1>
                  </div>
                </div>

                {/* Right panel: replaces HTML code + input with author & description */}
                <div className="flex-1 relative z-20 flex flex-col gap-6">
                  {/* Top info card: author and stats */}
                  <div className="flex-[4] bg-white/10 backdrop-blur-xl rounded-[40px] border border-white/15 shadow-2xl p-8 md:p-10 overflow-hidden relative">
                    <div
                      className="absolute inset-0 pointer-events-none opacity-10"
                      style={{
                        backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
                      }}
                    />
                    <div className="flex items-center gap-4 mb-6">
                      <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center border border-white/30">
                        <User className="w-5 h-5 text-white/80" />
                      </div>
                      <div>
                        <p className="text-white/60 text-xs uppercase tracking-[0.2em] mb-1">
                          Author
                        </p>
                        <p className="text-white text-xl font-mono">{viewingProject.author}</p>
                      </div>
                    </div>
                    <div>
                      <p className="text-white/60 text-xs uppercase tracking-[0.2em] mb-2">
                        Description
                      </p>
                      <p className="text-white text-base md:text-lg leading-relaxed font-mono opacity-90 whitespace-pre-line">
                        {viewingProject.description}
                      </p>
                    </div>
                  </div>

                  {/* Bottom spacer card to mirror the "Any Changes?" bar height but without input */}
                  <div className="flex-none bg-white/5 backdrop-blur-xl rounded-[40px] border border-white/10 shadow-2xl px-6 py-4 text-white/40 text-sm font-mono flex items-center justify-center">
                    <span>Project metadata view</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="fixed inset-0 pointer-events-none z-[-1]">
              <div className="absolute inset-0 opacity-[0.12] mix-blend-overlay bg-noise" />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
