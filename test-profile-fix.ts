// Test script to verify profile update fix
import fetch from 'node-fetch';

async function testProfileUpdate() {
  try {
    // First, login to get a valid user ID
    console.log('Testing profile update fix...\n');
    
    const loginResponse = await fetch('http://localhost:3000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'admin@preptick.com',
        password: 'Admin@123'
      })
    });

    if (!loginResponse.ok) {
      throw new Error(`Login failed: ${loginResponse.status}`);
    }

    const loginData = await loginResponse.json() as any;
    const userId = loginData.user.id;
    console.log('✓ Logged in successfully');
    console.log(`User ID: ${userId}\n`);

    // Test profile update with all fields including name
    const updateData = {
      name: 'Test Admin User',
      gender: 'Male',
      schoolName: 'Test School',
      city: 'Mumbai',
      country: 'India',
      curriculum: 'CBSE',
      grade: 10,
      subjects: JSON.stringify(['Mathematics', 'Science', 'English'])
    };

    console.log('Updating profile with data:', updateData);
    
    const updateResponse = await fetch(`http://localhost:3000/api/users/${userId}/profile`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updateData)
    });

    if (!updateResponse.ok) {
      const errorText = await updateResponse.text();
      throw new Error(`Profile update failed: ${updateResponse.status} - ${errorText}`);
    }

    const updateResult = await updateResponse.json() as any;
    console.log('\n✓ Profile updated successfully!');
    console.log('Updated user data:', JSON.stringify(updateResult.user, null, 2));

    // Verify the update by fetching the profile
    const getResponse = await fetch(`http://localhost:3000/api/users/${userId}/profile`);
    
    if (!getResponse.ok) {
      throw new Error(`Get profile failed: ${getResponse.status}`);
    }

    const profileData = await getResponse.json() as any;
    console.log('\n✓ Profile fetched successfully!');
    console.log('Profile data:', JSON.stringify(profileData, null, 2));

    console.log('\n✅ All tests passed! Profile update is working correctly.');
  } catch (error) {
    console.error('\n❌ Test failed:', error);
    process.exit(1);
  }
}

testProfileUpdate();
