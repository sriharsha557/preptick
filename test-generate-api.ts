// Test the generate test API directly
import fetch from 'node-fetch';

async function testGenerateAPI() {
  try {
    console.log('Testing /api/tests/generate endpoint...\n');

    const requestBody = {
      userId: '2c86c23e-28e6-4cda-834a-5a5f815d1965',
      subject: 'Mathematics',
      topics: ['112dc924-3e3c-40fe-8dc6-87447f60b420'], // Use a real topic ID
      questionCount: 5,
      testCount: 1,
      testMode: 'InAppExam',
    };

    console.log('Request body:', JSON.stringify(requestBody, null, 2));

    const response = await fetch('http://localhost:3000/api/tests/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    console.log('\nResponse status:', response.status);
    console.log('Response headers:', response.headers.raw());

    const data = await response.json();
    console.log('\nResponse body:', JSON.stringify(data, null, 2));

    if (!response.ok) {
      console.error('\n❌ API call failed');
      process.exit(1);
    }

    console.log('\n✅ API call successful!');
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

testGenerateAPI();
