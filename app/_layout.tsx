import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function Layout() {
  return (
    <Tabs
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;

          switch (route.name) {
            case '(tabs)/index':
              iconName = focused ? 'home' : 'home-outline';
              break;
            case '(tabs)/product-advice':
              iconName = focused ? 'list' : 'list-outline';
              break;
            case '(tabs)/notifications':
              iconName = focused ? 'notifications' : 'notifications-outline';
              break;
            default:
              iconName = 'help-outline';
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#007AFF',
        tabBarInactiveTintColor: 'gray',
      })}
    >
      <Tabs.Screen
        name="(tabs)/index"
        options={{
          title: 'Dashboard',
        }}
      />
      <Tabs.Screen
        name="(tabs)/product-advice"
        options={{
          title: 'Product Advice',
        }}
      />
      <Tabs.Screen
        name="(tabs)/notifications"
        options={{
          title: 'Notifications',
        }}
      />
    </Tabs>
  );
}