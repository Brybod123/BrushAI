import { useState, useRef, useEffect } from 'react';
import { User, MousePointer2, ArrowLeft, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from './utils/cn';
import { auth, getCurrentUser, signInWithGoogle, signOutUser, createProject, getProjects, getUserProfile } from './lib/firebase';
import { generateText, generateImage, chatCompletion, testApiConnection } from './lib/pollinations';

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

interface Project {
  id: string;
  name: string;
  author: string;
  description: string;
  userId: string;
  imageUrl?: string;
  createdAt: Date;
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
      
      try {
        console.log('🤖 Starting AI generation process...');
        
        // Generate content using Pollinations API with streaming
        const generatedText = await generateText(inputValue, {
          model: 'openai',
          temperature: 0.7,
          system: 'You are a helpful assistant that generates project descriptions and ideas.',
          stream: true
        }, (chunk: string) => {
          console.log('📥 Streaming chunk received:', chunk);
          setStreamingContent(prev => prev + chunk);
        });
        
        console.log('✅ Text generation completed');
        setGeneratedContent(generatedText);
        setStreamingContent('');
        
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
            imageUrl
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
        
        {/* Left Section - Website Placeholder */}
        <div className="flex-[2.5] relative z-20 flex">
          <div className="w-full bg-white/10 backdrop-blur-xl rounded-[40px] border border-white/15 shadow-2xl flex items-center justify-center p-12 overflow-hidden relative">
            <div 
              className="absolute inset-0 pointer-events-none opacity-10"
              style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
              }}
            />
            <h1 className="text-white text-5xl md:text-6xl font-normal tracking-wider text-center max-w-2xl leading-tight">
              {inputValue || 'A WEBSITE GOES HERE!!!!'}
            </h1>
            {generatedImageUrl && (
              <img 
                src={generatedImageUrl} 
                alt="Generated project preview" 
                className="mt-8 rounded-2xl max-w-full max-h-64 object-cover"
              />
            )}
          </div>
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
