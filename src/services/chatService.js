import axios from 'axios';

export const sendMessageToQuestorBot = async (messages) => {
  try {
    const response = await axios.post('/api/chat', {
      messages: messages
    });
    
    return response.data;
  } catch (error) {
    console.error('Error calling Chat API:', error);
    throw error;
  }
};

export default {
  sendMessageToQuestorBot
};