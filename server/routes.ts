import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupYouTubeAuth, getAuthUrl, exchangeCodeForTokens, getCurrentUser, revokeToken } from "./youtube";
import { fetchUserVideos, fetchVideoDetails, fetchRetentionData, fetchCaptions } from "./youtube";
import { generateHotspotInsights, generateActionableInsights } from "./ai";
import passport from "passport";
import session from "express-session";
import MemoryStore from "memorystore";

export async function registerRoutes(app: Express): Promise<Server> {
  // Configure session storage
  const SessionStore = MemoryStore(session);
  
  app.use(session({
    secret: process.env.SESSION_SECRET || 'ytinsights-session-secret',
    resave: false,
    saveUninitialized: false,
    cookie: { secure: process.env.NODE_ENV === 'production', maxAge: 24 * 60 * 60 * 1000 }, // 24 hours
    store: new SessionStore({ checkPeriod: 86400000 }) // 24 hours
  }));

  // Initialize passport for auth
  app.use(passport.initialize());
  app.use(passport.session());

  // Setup YouTube OAuth
  setupYouTubeAuth(passport);

  // Auth routes
  app.get('/api/auth/youtube/url', async (req, res) => {
    try {
      const url = await getAuthUrl();
      res.json({ url });
    } catch (error) {
      console.error('Error generating auth URL:', error);
      res.status(500).json({ message: 'Failed to generate auth URL' });
    }
  });

  app.get('/api/auth/youtube/callback', async (req, res) => {
    try {
      const code = req.query.code as string;
      if (!code) {
        return res.status(400).json({ message: 'Authorization code is required' });
      }

      const tokenData = await exchangeCodeForTokens(code);
      const userData = await getCurrentUser(tokenData.access_token);

      // Store user data in session and database
      req.session.user = {
        id: userData.id,
        accessToken: tokenData.access_token,
        refreshToken: tokenData.refresh_token
      };

      // Create or update user in storage
      let user = await storage.getUserByUsername(userData.id);
      if (user) {
        // Update existing user
        // Since our storage doesn't have an update method, we'll simulate it
        user = await storage.createUser({
          username: userData.id,
          password: 'oauth-user', // Not actually used since this is OAuth
          email: userData.email,
          accessToken: tokenData.access_token,
          refreshToken: tokenData.refresh_token,
          youtubeChannelId: userData.id,
          displayName: userData.name
        });
      } else {
        // Create new user
        user = await storage.createUser({
          username: userData.id,
          password: 'oauth-user', // Not actually used since this is OAuth
          email: userData.email,
          accessToken: tokenData.access_token,
          refreshToken: tokenData.refresh_token,
          youtubeChannelId: userData.id,
          displayName: userData.name
        });
      }

      res.redirect('/');
    } catch (error) {
      console.error('Auth callback error:', error);
      res.status(500).json({ message: 'Authentication failed' });
    }
  });

  app.get('/api/auth/status', (req, res) => {
    res.json({ authenticated: !!req.session.user });
  });

  app.post('/api/auth/logout', async (req, res) => {
    try {
      if (req.session.user?.accessToken) {
        await revokeToken(req.session.user.accessToken);
      }
      req.session.destroy(() => {
        res.status(200).json({ message: 'Logged out successfully' });
      });
    } catch (error) {
      console.error('Logout error:', error);
      res.status(500).json({ message: 'Logout failed' });
    }
  });

  // User profile routes
  app.get('/api/user', (req, res) => {
    if (!req.session.user) {
      return res.status(401).json({ message: 'Not authenticated' });
    }

    storage.getUserByUsername(req.session.user.id)
      .then(user => {
        if (!user) {
          return res.status(404).json({ message: 'User not found' });
        }
        
        // Return user without sensitive data
        res.json({
          name: user.displayName,
          email: user.email,
          profileImage: user.profileImage
        });
      })
      .catch(error => {
        console.error('Get user error:', error);
        res.status(500).json({ message: 'Failed to get user data' });
      });
  });

  app.get('/api/user/profile', (req, res) => {
    if (!req.session.user) {
      return res.status(401).json({ message: 'Not authenticated' });
    }

    // Here we would typically fetch user preferences from the database
    // For this MVP, we'll return mock data
    res.json({
      email: 'user@example.com',
      notificationsEnabled: true
    });
  });

  app.patch('/api/user/profile', (req, res) => {
    if (!req.session.user) {
      return res.status(401).json({ message: 'Not authenticated' });
    }

    // Here we would typically update user preferences in the database
    // For this MVP, we'll just return success
    res.json({ success: true });
  });

  // Video routes
  app.get('/api/videos', async (req, res) => {
    if (!req.session.user) {
      return res.status(401).json({ message: 'Not authenticated' });
    }

    try {
      const videos = await fetchUserVideos(req.session.user.accessToken);
      res.json(videos);
    } catch (error) {
      console.error('Fetch videos error:', error);
      res.status(500).json({ message: 'Failed to fetch videos' });
    }
  });

  app.get('/api/videos/:videoId/analysis', async (req, res) => {
    if (!req.session.user) {
      return res.status(401).json({ message: 'Not authenticated' });
    }

    try {
      const { videoId } = req.params;
      const accessToken = req.session.user.accessToken;

      // Fetch all data in parallel
      const [video, retentionData, captions] = await Promise.all([
        fetchVideoDetails(videoId, accessToken),
        fetchRetentionData(videoId, accessToken),
        fetchCaptions(videoId, accessToken)
      ]);

      // Generate hotspots from retention data
      const hotspots = await generateHotspotInsights(videoId, retentionData, captions);

      res.json({
        video,
        retentionData,
        captions,
        hotspots
      });
    } catch (error) {
      console.error('Video analysis error:', error);
      res.status(500).json({ message: 'Failed to analyze video' });
    }
  });

  app.post('/api/videos/:videoId/report', async (req, res) => {
    if (!req.session.user) {
      return res.status(401).json({ message: 'Not authenticated' });
    }

    try {
      const { videoId } = req.params;
      const { email } = req.body;
      
      // In a real implementation, this would generate and email a report
      // For this MVP, we'll just return success
      
      res.json({ 
        success: true, 
        message: 'Report sent successfully' 
      });
    } catch (error) {
      console.error('Report generation error:', error);
      res.status(500).json({ message: 'Failed to generate report' });
    }
  });

  app.get('/api/videos/:videoId/transcript/export', async (req, res) => {
    if (!req.session.user) {
      return res.status(401).json({ message: 'Not authenticated' });
    }

    try {
      const { videoId } = req.params;
      const accessToken = req.session.user.accessToken;

      const captions = await fetchCaptions(videoId, accessToken);

      // Format captions as plain text
      const transcriptText = captions.entries.map(caption => {
        const timestamp = formatTime(caption.startTime);
        return `[${timestamp}] ${caption.text}`;
      }).join('\n\n');

      // Set headers for file download
      res.setHeader('Content-Type', 'text/plain');
      res.setHeader('Content-Disposition', `attachment; filename="transcript-${videoId}.txt"`);
      
      res.send(transcriptText);
    } catch (error) {
      console.error('Transcript export error:', error);
      res.status(500).json({ message: 'Failed to export transcript' });
    }
  });

  // AI Insights routes
  app.post('/api/ai/hotspot-insight', async (req, res) => {
    if (!req.session.user) {
      return res.status(401).json({ message: 'Not authenticated' });
    }

    try {
      const { videoId, timestamp, percentageChange, transcriptText } = req.body;
      
      if (!videoId || timestamp === undefined || percentageChange === undefined || !transcriptText) {
        return res.status(400).json({ message: 'Missing required parameters' });
      }

      // Generate insights for the hotspot
      // In a real implementation, this would call the AI service
      // For this MVP, we'll return mock data
      
      res.json({
        id: `hotspot-${Date.now()}`,
        videoId,
        timestamp,
        percentageChange,
        transcriptText,
        type: percentageChange > 0 ? 'ENGAGEMENT_PEAK' : 'SIGNIFICANT_DROP',
        reasons: [
          percentageChange > 0 
            ? 'Engaging visual demonstration captured viewer attention'
            : 'Technical explanation without visual examples',
          percentageChange > 0
            ? 'Clear value proposition resonated with audience needs'
            : 'Price discussion without showing clear benefits'
        ],
        suggestion: percentageChange > 0
          ? 'Continue using this style of demonstration in future videos'
          : 'Add visual examples when discussing technical details'
      });
    } catch (error) {
      console.error('AI insight error:', error);
      res.status(500).json({ message: 'Failed to generate insight' });
    }
  });

  app.post('/api/ai/actionable-insights', async (req, res) => {
    if (!req.session.user) {
      return res.status(401).json({ message: 'Not authenticated' });
    }

    try {
      const { videoId, hotspots } = req.body;
      
      if (!videoId || !hotspots) {
        return res.status(400).json({ message: 'Missing required parameters' });
      }

      // Generate actionable insights based on all hotspots
      const insights = await generateActionableInsights(hotspots);
      
      res.json(insights);
    } catch (error) {
      console.error('Actionable insights error:', error);
      res.status(500).json({ message: 'Failed to generate actionable insights' });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}

// Helper function to format time
function formatTime(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60);
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
}
