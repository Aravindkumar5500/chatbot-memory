const request = require('supertest');
const app = require('./server'); // Import the app instance

describe('Cortex Backend API Protocols', () => {
  test('Archive Check: GET /history should return a valid history array', async () => {
    const res = await request(app).get('/history');
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  test('Intelligence Pivot: POST /chat should default MCP to Model Context Protocol', async () => {
    const res = await request(app)
      .post('/chat')
      .send({ message: 'What is MCP?' });
    
    expect(res.statusCode).toBe(200);
    expect(res.body.text.toLowerCase()).toContain('model context protocol');
  });

  test('Guardian Check: POST /validate-entry should verify structured data quality', async () => {
    const entry = {
      category: "IPL",
      title: "Match 23 Winner",
      content: "CSK won against MI by 5 wickets in a thrilling finish on 15 April 2025 in Chennai stadium.",
      tags: ["CSK", "MI", "IPL2025"]
    };

    const res = await request(app)
      .post('/validate-entry')
      .send({ entry });
    
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('valid');
    expect(res.body).toHaveProperty('suggested_tags');
  });
});
