import { View, Text, StyleSheet, FlatList } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function Notifications() {  // Changed to default export
  const notifications = [
    {
      id: '1',
      type: 'warning',
      message: 'Temperature rising',
      timestamp: '2 min ago'
    },
  ];

  return (
    <View style={styles.container}>
      <FlatList
        data={notifications}
        renderItem={({ item }) => (
          <View style={[
            styles.notificationCard,
            item.type === 'warning' ? styles.warningCard : styles.normalCard
          ]}>
            <Ionicons
              name="alert-circle"
              size={24}
              color={item.type === 'warning' ? '#FF9500' : '#007AFF'}
            />
            <View style={styles.notificationContent}>
              <Text style={styles.message}>{item.message}</Text>
              <Text style={styles.timestamp}>{item.timestamp}</Text>
            </View>
          </View>
        )}
        keyExtractor={item => item.id}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  notificationCard: {
    flexDirection: 'row',
    padding: 16,
    borderRadius: 8,
    marginBottom: 8,
    backgroundColor: 'white',
    alignItems: 'center',
  },
  warningCard: {
    backgroundColor: '#FFF5E6',
  },
  normalCard: {
    backgroundColor: 'white',
  },
  notificationContent: {
    marginLeft: 12,
    flex: 1,
  },
  message: {
    fontSize: 16,
    marginBottom: 4,
  },
  timestamp: {
    color: '#666',
    fontSize: 12,
  },
}); 