import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { apiFetch } from '../services/apiClient';

const DietScreen = ({ navigation }) => {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    fetchDietPlans();
  }, []);

  const fetchDietPlans = async () => {
    try {
      setLoading(true);
      const data = await apiFetch('/api/diet/');
      setPlans(data.data || []);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const generateNewPlan = async () => {
    try {
      setGenerating(true);
      const data = await apiFetch('/api/diet/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}), 
      });
      void data;
      fetchDietPlans();
    } catch (error) {
      const isProfileIssue = error.message?.toLowerCase().includes('profile') || error.message?.toLowerCase().includes('onboarding');
      Alert.alert(isProfileIssue ? 'Profile incomplete' : 'Error', error.message, isProfileIssue ? [
        { text: 'Go to Profile', onPress: () => navigation.navigate('Profile') },
      ] : undefined);
    } finally {
      setGenerating(false);
    }
  };

  const renderMeal = (meal, index) => (
    <View key={index} style={styles.mealCard}>
      <View style={styles.mealHeader}>
        <Text style={styles.mealName}>{meal.name}</Text>
        <Text style={styles.mealTime}>{meal.time}</Text>
      </View>
      <View style={styles.macrosRow}>
        <Text style={styles.macroText}>{meal.calories} kcal</Text>
        <Text style={styles.macroText}>{meal.protein}g protein</Text>
        <Text style={styles.macroText}>{meal.carbs}g carbs</Text>
        <Text style={styles.macroText}>{meal.fat}g fat</Text>
      </View>
      {meal.notes ? <Text style={styles.mealNotes}>{meal.notes}</Text> : null}
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity style={styles.menuButton} onPress={() => navigation.navigate('Menu')} activeOpacity={0.84}>
            <Ionicons name="menu" size={24} color="#fff" />
          </TouchableOpacity>
          <View>
            <Text style={styles.kicker}>Gemini 2.5 Flash</Text>
            <Text style={styles.title}>Diet Plan</Text>
          </View>
        </View>
        <TouchableOpacity style={styles.generateButton} onPress={generateNewPlan} disabled={generating}>
          {generating ? <ActivityIndicator color="#fff" size="small" /> : <Text style={styles.generateButtonText}>Generate</Text>}
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#ff6b00" style={{ marginTop: 50 }} />
      ) : plans.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="restaurant-outline" size={64} color="#555" />
          <Text style={styles.emptyStateText}>No diet plans generated yet.</Text>
          <Text style={styles.emptyStateSub}>Generate a meal plan based on your profile, goals, and health conditions.</Text>
        </View>
      ) : (
        <ScrollView style={styles.scrollView}>
          {plans.map((plan) => (
            <View key={plan._id} style={styles.planContainer}>
              <View style={styles.planHeader}>
                <Text style={styles.planDate}>Plan created {new Date(plan.createdAt).toLocaleDateString()}</Text>
                <Text style={styles.planTarget}>{plan.targetCalories} kcal / day</Text>
              </View>
              {plan.meals.map(renderMeal)}
            </View>
          ))}
        </ScrollView>
      )}
    </View>
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
    paddingRight: 10,
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
  kicker: {
    color: '#e85d2a',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    marginBottom: 3,
  },
  title: {
    fontSize: 24,
    fontWeight: '900',
    color: '#fff',
  },
  generateButton: {
    backgroundColor: '#e85d2a',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 14,
    minWidth: 96,
    alignItems: 'center',
  },
  generateButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  scrollView: {
    padding: 16,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 100,
    padding: 20,
  },
  emptyStateText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 16,
  },
  emptyStateSub: {
    color: '#888',
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 22,
  },
  planContainer: {
    marginBottom: 32,
  },
  planHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
    paddingHorizontal: 4,
  },
  planDate: {
    color: '#888',
    fontSize: 14,
  },
  planTarget: {
    color: '#ff6b00',
    fontWeight: 'bold',
  },
  mealCard: {
    backgroundColor: '#1a1a24',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#2a2a36',
  },
  mealHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  mealName: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '800',
    flex: 1,
    paddingRight: 12,
  },
  mealTime: {
    color: '#aaa',
    fontSize: 14,
  },
  macrosRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
    backgroundColor: '#23232e',
    padding: 10,
    borderRadius: 8,
  },
  macroText: {
    color: '#ddd',
    fontSize: 13,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
  mealNotes: {
    color: '#888',
    fontSize: 14,
    fontStyle: 'italic',
    lineHeight: 20,
  },
});

export default DietScreen;
