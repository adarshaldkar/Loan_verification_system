const fetch = require('node:http');

async function runTests() {
  const adminCredentials = {
    email: 'admin@loanverify.com',
    password: 'admin123'
  };

  try {
    console.log('Sending requests to server...');
    
    // 1. Health check
    const healthRes = await makeRequest('http://localhost:5000/api/v1/health', 'GET');
    console.log('HEALTH RESPONSE:', healthRes);

    // 2. Login
    const loginRes = await makeRequest('http://localhost:5000/api/v1/auth/login', 'POST', adminCredentials);
    console.log('LOGIN RESPONSE:', loginRes);

    if (loginRes.success && loginRes.token) {
      const token = loginRes.token;
      
      // 3. Analytics
      const analyticsRes = await makeRequest('http://localhost:5000/api/v1/admin/analytics', 'GET', null, token);
      console.log('ANALYTICS RESPONSE:', analyticsRes);

      // 4. Create case
      const caseBody = {
        firstName: 'Test',
        lastName: 'User',
        email: 'test@example.com',
        phone: '1234567890',
        address: '123 Test St, Test City',
        loanAmount: 150000,
        type: 'RESIDENTIAL'
      };
      const caseRes = await makeRequest('http://localhost:5000/api/v1/admin/cases', 'POST', caseBody, token);
      console.log('CREATE CASE RESPONSE:', caseRes);

      // 5. Get Agents
      const agentsRes = await makeRequest('http://localhost:5000/api/v1/admin/agents', 'GET', null, token);
      console.log('AGENTS RESPONSE:', agentsRes);
    }
  } catch (error) {
    console.error('TEST ERROR:', error.message);
  }
}

function makeRequest(url, method, body = null, token = null) {
  return new Promise((resolve, reject) => {
    const parsedUrl = new URL(url);
    const options = {
      hostname: parsedUrl.hostname,
      port: parsedUrl.port,
      path: parsedUrl.pathname + parsedUrl.search,
      method: method,
      headers: {
        'Content-Type': 'application/json'
      }
    };

    if (token) {
      options.headers['Authorization'] = `Bearer ${token}`;
    }

    const req = fetch.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          resolve(data);
        }
      });
    });

    req.on('error', (err) => {
      reject(err);
    });

    if (body) {
      req.write(JSON.stringify(body));
    }
    req.end();
  });
}

runTests();
