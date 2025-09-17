#!/usr/bin/env node

// Debug script to test Jenkins connection step by step
const https = require('https');
const http = require('http');

// Your Jenkins configuration
const config = {
  url: 'http://20.121.40.237:8080',
  username: 'admin',
  apiToken: 'your-api-token-here' // Replace with your actual API token
};

function makeRequest(path, description) {
  return new Promise((resolve, reject) => {
    console.log(`\n🔍 Testing: ${description}`);
    console.log(`📍 URL: ${config.url}${path}`);
    
    const url = new URL(config.url);
    const auth = Buffer.from(`${config.username}:${config.apiToken}`).toString('base64');
    
    const options = {
      hostname: url.hostname,
      port: url.port || (url.protocol === 'https:' ? 443 : 80),
      path: path,
      method: 'GET',
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/json',
        'User-Agent': 'JenkinsPipelineMonitor/1.0'
      },
      timeout: 15000
    };

    const client = url.protocol === 'https:' ? https : http;

    const req = client.request(options, (res) => {
      console.log(`📊 Status: ${res.statusCode} ${res.statusMessage}`);
      console.log(`📋 Headers:`, JSON.stringify(res.headers, null, 2));
      
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          console.log('✅ Response parsed successfully');
          resolve({ status: res.statusCode, headers: res.headers, data: parsed });
        } catch (e) {
          console.log('⚠️  Response is not JSON');
          resolve({ status: res.statusCode, headers: res.headers, data: data });
        }
      });
    });

    req.on('error', (error) => {
      console.error('❌ Request failed:', error.message);
      reject(error);
    });

    req.on('timeout', () => {
      console.log('⏰ Request timed out');
      req.destroy();
      reject(new Error('Timeout'));
    });

    req.end();
  });
}

async function debugJenkins() {
  console.log('🚀 Starting Jenkins Connection Debug');
  console.log('=====================================');
  
  try {
    // Test 1: Basic Jenkins info
    await makeRequest('/api/json?tree=description', 'Basic Jenkins API');
    
    // Test 2: Get jobs list
    await makeRequest('/api/json?tree=jobs[name,url,color,lastBuild[number,url,timestamp,duration,result,building]]', 'Jobs List');
    
    // Test 3: Get specific job details
    await makeRequest('/job/test/api/json?tree=name,url,color,lastBuild[number,url,timestamp,duration,result,building]', 'Job Details (test)');
    
    // Test 4: Test without authentication
    console.log('\n🔍 Testing: Without Authentication');
    const url = new URL(config.url);
    const options = {
      hostname: url.hostname,
      port: url.port || (url.protocol === 'https:' ? 443 : 80),
      path: '/api/json?tree=description',
      method: 'GET',
      timeout: 10000
    };

    const client = url.protocol === 'https:' ? https : http;
    
    const req = client.request(options, (res) => {
      console.log(`📊 Status (no auth): ${res.statusCode} ${res.statusMessage}`);
      if (res.statusCode === 403) {
        console.log('✅ Jenkins requires authentication (good security!)');
      } else if (res.statusCode === 200) {
        console.log('⚠️  Jenkins allows anonymous access (security concern)');
      }
      res.resume();
    });
    
    req.end();
    
  } catch (error) {
    console.error('💥 Debug failed:', error.message);
  }
}

// Run the debug
debugJenkins();