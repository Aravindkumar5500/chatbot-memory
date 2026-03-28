const Groq = require('groq-sdk');
const client = new Groq({ apiKey: process.env.GROQ_API_KEY });

async function main() {
  try {
    const chatCompletion = await client.chat.completions.create({
      messages: [{ role: 'user', content: 'Say hello' }],
      model: 'llama-3.3-70b-versatile',
    });
    console.log(chatCompletion.choices[0].message.content);
  } catch (error) {
    console.error('Error details:', error);
  }
}

main();
