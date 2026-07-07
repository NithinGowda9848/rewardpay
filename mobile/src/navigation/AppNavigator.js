import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { FontAwesome5 } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { View, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// Import Screens
import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';
import HomeScreen from '../screens/HomeScreen';
import BuyScreen from '../screens/BuyScreen';
import UpiScreen from '../screens/UpiScreen';
import TeamScreen from '../screens/TeamScreen';
import ProfileScreen from '../screens/ProfileScreen';
import SupportScreen from '../screens/SupportScreen';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

// Auth Stack for Public Routes
const AuthStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="Login" component={LoginScreen} />
    <Stack.Screen name="Register" component={RegisterScreen} />
  </Stack.Navigator>
);

// Tab Navigator for Private/Dashboard Routes
const TabNavigator = () => {
  const insets = useSafeAreaInsets();
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: '#6366f1', // accent color
        tabBarInactiveTintColor: '#64748b', // muted text
        tabBarStyle: {
          backgroundColor: '#11131e', // bg-secondary
          borderTopColor: 'rgba(255, 255, 255, 0.06)', // border-glass
          paddingBottom: insets.bottom > 0 ? insets.bottom : 8,
          paddingTop: 8,
          height: 60 + (insets.bottom > 0 ? insets.bottom - 8 : 0),
        },
      tabBarLabelStyle: {
        fontSize: 11,
        fontWeight: '500',
      },
      tabBarIcon: ({ color, size }) => {
        let iconName;

        switch (route.name) {
          case 'Home':
            iconName = 'home';
            break;
          case 'Buy':
            iconName = 'shopping-cart';
            break;
          case 'UPI':
            iconName = 'qrcode';
            break;
          case 'Team':
            iconName = 'users';
            break;
          case 'Profile':
            iconName = 'user';
            break;
          case 'Support':
            iconName = 'headset';
            break;
          default:
            iconName = 'question-circle';
        }

        return <FontAwesome5 name={iconName} size={size - 2} color={color} />;
      },
    })}
  >
    <Tab.Screen name="Home" component={HomeScreen} />
    <Tab.Screen name="Buy" component={BuyScreen} />
    <Tab.Screen name="UPI" component={UpiScreen} />
    <Tab.Screen name="Team" component={TeamScreen} />
    <Tab.Screen name="Profile" component={ProfileScreen} />
    <Tab.Screen name="Support" component={SupportScreen} />
    </Tab.Navigator>
  );
};

export default function AppNavigator() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: '#0a0b10', justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#6366f1" />
      </View>
    );
  }

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {user ? (
        <Stack.Screen name="MainTabs" component={TabNavigator} />
      ) : (
        <Stack.Screen name="Auth" component={AuthStack} />
      )}
    </Stack.Navigator>
  );
}
