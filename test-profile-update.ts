// Test profile update API
import fetch from 'node-fetch';

async function testProfileUpdate() {
  try {
    console.log('Testing profile update API...\n');

    const userId = '2c86c23e-28e6-4cda-834a-5a5f815d1965';
    
    // First, get current profile
    console.log('1. Getting current profile...');
    const getResponse = await fetch(`http://localhost:3000/api/users/${userId}/profile`);
    const currentProfile = await getResponse.json();
    console.log('Current profile:', JSON.stringify(currentProfile, null, 2));

    // Update profile
    console.log('\n2. Updating profile...');
    const updateData = {
      name: 'Test Student',
      gender: 'Male',
      schoolName: 'Test School',
      city: 'Mumbai',
      country: 'India',
      curriculum: currentProfile.curriculum,
      grade: currentProfile.grade,
      subjects: currentProfile.subjects,
    };

    const updateResponse = await fetch(`http://localhost:3000/api/users/${userId}/profile`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(updateData),
    });

    console.log('Update response status:', updateResponse.status);
    
    if (!updateResponse.ok) {
      const errorData = await updateResponse.json();
      console.error('❌ Update failed:', JSON.stringify(errorData, null, 2));
      process.exit(1);
    }

    const updateResult = await updateResponse.json();
    console.log('✓ Update successful:', JSON.stringify(updateResult, null, 2));

    // Verify the update
    console.log('\n3. Verifying update...');
    const verifyResponse = await fetch(`http://localhost:3000/api/users/${userId}/profile`);
    const updatedProfile = await verifyResponse.json();
    console.log('Updated profile:', JSON.stringify(updatedProfile, null, 2));

    console.log('\n✅ Profile update test completed successfully!');
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

testProfileUpdate();
