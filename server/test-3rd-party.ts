import axios from 'axios';
import { IMAGE_GENERATION_CONFIG } from './src/config/aiModels';

async function testApi() {
  const config = IMAGE_GENERATION_CONFIG;
  const url = `${config.baseUrl}/v1/chat/completions`; // Try chat completions first
  
  console.log(`Testing API at ${url} with model ${config.model}`);

  try {
    const response = await axios.post(url, {
      model: config.model,
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: "Generate an image of a cute cat" }
          ]
        }
      ]
    }, {
      headers: {
        [config.apiKeyHeaderKey || 'Authorization']: `Bearer ${config.apiKey}`,
        'Content-Type': 'application/json'
      }
    });

    console.log("Response status:", response.status);
    console.log("Response data:", JSON.stringify(response.data, null, 2));
  } catch (error: any) {
    console.error("Error:", error.message);
    if (error.response) {
      console.error("Response data:", error.response.data);
      console.error("Response status:", error.response.status);
    }
  }
}

testApi();
