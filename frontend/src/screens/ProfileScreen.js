import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, Alert, ActivityIndicator, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { apiFetch } from '../services/apiClient';
import { clearTokens } from '../services/authService';

const ProfileScreen = ({ navigation, onLogout }) => {
  const [profile, setProfile] = useState({
    age: '',
    weight: '',
    height: '',
    goals: '',
    healthConditions: ''
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const data = await apiFetch('/api/profile/me');
      if (data) {
        setProfile({
          age: data.age?.toString() || '',
          weight: data.weight?.toString() || '',
          height: data.height?.toString() || '',
          goals: data.goals?.join(', ') || '',
          healthConditions: data.healthConditions?.join(', ') || ''
        });
      }
    } catch (error) {
      console.log('Error fetching profile', error);
    } finally {
      setLoading(false);
    }
  };

  const saveProfile = async () => {
    try {
      setSaving(true);
      const payload = {
        age: parseInt(profile.age) || 0,
        weight: parseInt(profile.weight) || 0,
        height: parseInt(profile.height) || 0,
        goals: profile.goals.split(',').map(g => g.trim()).filter(Boolean),
        healthConditions: profile.healthConditions.split(',').map(h => h.trim()).filter(Boolean),
        onboardingCompleted: true,
        activityLevel: 'moderately-active', // Defaulting for now
        gender: 'prefer-not-to-say'
      };

      await apiFetch('/api/profile/update', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      Alert.alert('Saved', 'Profile saved successfully.');
    } catch (error) {
      Alert.alert('Error', error.message);
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async () => {
    await clearTokens();
    onLogout();
  };

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center' }]}>
        <ActivityIndicator size="large" color="#ff6b00" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity style={styles.menuButton} onPress={() => navigation.navigate('Menu')} activeOpacity={0.84}>
            <Ionicons name="menu" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.title}>My Profile</Text>
        </View>
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.content}>
        <Text style={styles.info}>
          Complete your profile so our AI can generate personalized diet plans for you.
        </Text>
        
        <Text style={styles.label}>Age</Text>
        <TextInput 
          style={styles.input} 
          placeholder="e.g. 25" 
          placeholderTextColor="#666" 
          keyboardType="numeric"
          value={profile.age}
          onChangeText={(text) => setProfile({...profile, age: text})}
        />
        
        <Text style={styles.label}>Weight (kg)</Text>
        <TextInput 
          style={styles.input} 
          placeholder="e.g. 70" 
          placeholderTextColor="#666" 
          keyboardType="numeric"
          value={profile.weight}
          onChangeText={(text) => setProfile({...profile, weight: text})}
        />

        <Text style={styles.label}>Height (cm)</Text>
        <TextInput 
          style={styles.input} 
          placeholder="e.g. 175" 
          placeholderTextColor="#666" 
          keyboardType="numeric"
          value={profile.height}
          onChangeText={(text) => setProfile({...profile, height: text})}
        />

        <Text style={styles.label}>Goals (comma separated)</Text>
        <TextInput 
          style={styles.input} 
          placeholder="e.g. Muscle Gain, Fat Loss" 
          placeholderTextColor="#666" 
          value={profile.goals}
          onChangeText={(text) => setProfile({...profile, goals: text})}
        />

        <Text style={styles.label}>Health Conditions / Allergies</Text>
        <TextInput 
          style={styles.input} 
          placeholder="e.g. Peanut allergy, hypertension" 
          placeholderTextColor="#666" 
          value={profile.healthConditions}
          onChangeText={(text) => setProfile({...profile, healthConditions: text})}
        />

        <TouchableOpacity style={styles.saveButton} onPress={saveProfile} disabled={saving}>
          {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveButtonText}>Save Profile</Text>}
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0d0d12',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: 60,
    backgroundColor: '#1a1a24',
    borderBottomWidth: 1,
    borderBottomColor: '#2a2a36',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  menuButton: {
    width: 42,
    height: 42,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#23232e',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    marginRight: 12,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
  },
  logoutButton: {
    padding: 8,
    backgroundColor: '#2a2a36',
    borderRadius: 8,
  },
  logoutText: {
    color: '#ff4444',
    fontWeight: 'bold',
  },
  content: {
    padding: 20,
  },
  info: {
    color: '#aaa',
    marginBottom: 24,
    lineHeight: 20,
  },
  label: {
    color: '#fff',
    marginBottom: 8,
    fontWeight: '600',
  },
  input: {
    backgroundColor: '#1a1a24',
    color: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#333',
  },
  saveButton: {
    backgroundColor: '#ff6b00',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 16,
  },
  saveButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  }
});

export default ProfileScreen;
