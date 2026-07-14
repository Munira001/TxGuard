const axios = require('axios');
require('dotenv').config();

const JWT = process.env.JWT_TOKEN;
const API_ORIGIN = process.env.API_ORIGIN || "https://txline.txodds.com";
const API_TOKEN = process.env.API_TOKEN;

async function test(endpoint) {
  try {
    console.log(`\n🔍 Testing: ${endpoint}`);
    const headers = {};
    if (JWT) {
      headers['Authorization'] = `Bearer ${JWT}`;
    }
    if (API_TOKEN) {
      headers['X-Api-Token'] = API_TOKEN;
    }
    const response = await axios.get(
      `${API_ORIGIN}${endpoint}`,
      { headers }
    );
    console.log(`✅ SUCCESS: Got data`);
    return true;
  } catch (error) {
    console.log(`❌ Failed: ${error.response?.status}`);
    return false;
  }
}

async function main() {
  await test('/api/fixtures/snapshot?competitionId=72&limit=1');
  await test('/api/worldcup/fixtures');
  await test('/api/worldcup/odds');
  await test('/api/odds/snapshot/1');
}

main();