#!/usr/bin/env node

// Simple Jenkins connection test script
const https = require('https');
const http = require('http');

// Test configuration - update these values
const config = {
  url: 'http://20.121.40.237:8080',
  username: 'admin',
  apiToken: 'your-api-token-here'
};

function testJenkinsConnection() {
  console.log('Testing Jenkins connection...');
  console.log('URL:', config.url);
  console.log('Username:', config.username);
  
  const url = new URL(config.url);
  const auth = Buffer.from(`${config.username}:${config.apiToken}`).toString('base64');
  
  const options = {
    hostname: url.hostname,
    port: url.port || (url.protocol === 'https:' ? 443 : 80),
    path: '/api/json?tree=description',
    method: 'GET',
    headers: {
      'Authorization': `Basic ${auth}`,
      'Content-Type': 'application/json',
    },
    timeout: 10000
  };

  const client = url.protocol === 'https:' ? https : http;

  const req = client.request(options, (res) => {
    console.log('Status Code:', res.statusCode);
    console.log('Status Message:', res.statusMessage);
    
    let data = '';
    
    res.on('data', (chunk) => {
      data += chunk;
    });
    
    res.on('end', () => {
      if (res.statusCode === 200) {
        console.log('✅ Connection successful!');
        console.log('Response:', JSON.parse(data));
      } else {
        console.log('❌ Connection failed');
        console.log('Error response:', data);
      }
    });
  });

  req.on('error', (error) => {
    console.error('❌ Request failed:', error.message);
    
    if (error.code === 'ENOTFOUND') {
      console.log('💡 DNS resolution failed. Check if the hostname is correct.');
    } else if (error.code === 'ECONNREFUSED') {
      console.log('💡 Connection refused. Check if Jenkins is running and the port is correct.');
    } else if (error.code === 'ETIMEDOUT') {
      console.log('💡 Connection timeout. Check if Jenkins is accessible from this network.');
    }
  });

  req.on('timeout', () => {
    console.log('❌ Request timed out');
    req.destroy();
  });

  req.end();
}

// Run the test
testJenkinsConnection();