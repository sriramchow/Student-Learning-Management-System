import axios from 'axios';

export default async function handler(req, res) {
  // Set CORS headers to allow requests from your frontend
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,POST');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  // Handle preflight OPTIONS request
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Get the Anthropic API key from environment variables
    const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
    
    if (!ANTHROPIC_API_KEY) {
      return res.status(500).json({ error: 'API key not configured' });
    }

    // Extract messages from the request body
    const { messages } = req.body;

    // Call the Anthropic API
    const response = await axios.post(
      'https://api.anthropic.com/v1/messages',
      {
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 1024,
        messages: messages,
        system: "You are Questor Bot, an educational AI assistant designed to help users with their learning journey. You're friendly, supportive, and knowledgeable. Your responses should be helpful, accurate, and encouraging. Keep responses concise and clear. When appropriate, suggest additional resources or learning paths. If asked about coding, provide accurate guidance. If unsure about something, acknowledge your limitations rather than guessing. Your personality is warm and engaging, and you should sound excited to help users learn and grow."
      },
      {
        headers: {
          'x-api-key': ANTHROPIC_API_KEY,
          'anthropic-version': '2023-06-01',
          'content-type': 'application/json'
        }
      }
    );

    // Return the API response
    return res.status(200).json(response.data);
  } catch (error) {
    console.error('Error calling Anthropic API:', error.response?.data || error.message);
    
    return res.status(500).json({
      error: 'Failed to process request',
      details: error.response?.data || error.message
    });
  }
}