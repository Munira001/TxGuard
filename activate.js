const axios = require('axios');
const fs = require('fs');
require('dotenv').config();

const API_ORIGIN = process.env.API_ORIGIN || "https://txline.txodds.com";
const API_BASE = `${API_ORIGIN}/api`;
const API_TOKEN = process.env.API_TOKEN || "";

async function main() {
  try {
    console.log(`🔌 Using API Origin: ${API_ORIGIN}`);
    console.log("🔑 Step 1: Getting guest JWT token...");
    
    const authResponse = await axios.post(`${API_ORIGIN}/auth/guest/start`);
    const jwt = authResponse.data.token;
    
    console.log("✅ JWT Token obtained!");
    console.log(`JWT: ${jwt.substring(0, 50)}...`);
    
    // Save JWT (keep API_ORIGIN in env too)
    let envContent = `JWT_TOKEN=${jwt}\nAPI_ORIGIN=${API_ORIGIN}\n`;
    if (API_TOKEN) {
      envContent += `API_TOKEN=${API_TOKEN}\n`;
    }
    fs.writeFileSync('.env', envContent);
    console.log("💾 Saved config to .env file");
    
    // Test API access
    console.log("\n🔐 Step 2: Testing API access...");
    
    const headers = {
      Authorization: `Bearer ${jwt}`,
      'Content-Type': 'application/json'
    };
    if (API_TOKEN) {
      headers['X-Api-Token'] = API_TOKEN;
    }

    try {
      const testResponse = await axios.get(
        `${API_BASE}/fixtures/snapshot?competitionId=72&limit=1`,
        { 
          headers,
          timeout: 10000
        }
      );
      
      console.log("✅ API Access GRANTED!");
      console.log(`✅ Got ${testResponse.data.fixtures ? testResponse.data.fixtures.length : 0} fixture(s)`);
      console.log("\n🎉 You're ready to run the detector!");
      
    } catch (apiError) {
      if (apiError.response?.status === 403) {
        console.log("\n⚠️  403 Forbidden - Free tier not activated yet");
        console.log("📋 Free tier activation is self-serve on Solana Mainnet or Devnet!");
        console.log("\n💡 HOW TO ACTIVATE:");
        console.log("1. Make sure you have a funded Solana wallet (e.g. in Phantom).");
        console.log("2. Clone the tx-on-chain repository and run the on-chain subscription script:");
        console.log("   git clone https://github.com/txodds/tx-on-chain.git");
        console.log("   cd tx-on-chain");
        console.log("   npm install");
        console.log("   # Run the subscription script with your wallet keypair file:");
        console.log("   # For Devnet, use https://api.devnet.solana.com");
        console.log("   # For Mainnet subscription details, check the IDL and docs at:");
        console.log("   # IDL: https://github.com/txodds/tx-on-chain/blob/main/idl/txoracle.json");
        console.log("   # Docs: https://txline.txodds.com/documentation/programs/mainnet");
        console.log("3. The script will output your API Token. Copy that token!");
        console.log("4. Paste the API Token in your TxGuard .env file as: API_TOKEN=<your_token>");
        console.log("5. Ensure API_ORIGIN=https://txline.txodds.com is in your TxGuard .env file.");
        console.log("6. Run 'node detector.js'!");
        process.exit(1);
      } else {
        throw apiError;
      }
    }
    
  } catch (error) {
    console.error("\n❌ Error:", error.message || error);
    if (error.response) {
      console.error("Status Code:", error.response.status);
      console.error("Response Data:", error.response.data);
    } else if (error.request) {
      console.error("No response received from server. Request details:", error.request);
    }
    process.exit(1);
  }
}

main();