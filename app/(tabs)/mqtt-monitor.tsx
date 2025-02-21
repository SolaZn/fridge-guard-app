import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import init from 'react_native_mqtt';

// Initialize MQTT client
init({
  size: 10000,
  storageBackend: AsyncStorage,
  defaultExpires: 1000 * 3600 * 24,
  enableCache: true,
  sync: {}
});

export default function MqttMonitor() {
  const [client, setClient] = useState<any>(null);
  const [connectStatus, setConnectStatus] = useState('Disconnected');
  const [temperature, setTemperature] = useState<number | null>(null);
  const [lastUpdateTime, setLastUpdateTime] = useState<string>('Never');
  const [isReady, setIsReady] = useState(false);
  const [clientId] = useState(`fridge-app-${Math.random().toString(16).slice(2, 10)}`);
  const TOPIC = 'ESILV'; // Remove trailing slash

  useEffect(() => {
    // Create MQTT client instance
    const mqttClient = new Paho.MQTT.Client(
      'broker.emqx.io',
      8083,
      '/mqtt',
      clientId
    );

    // Set callback handlers
    mqttClient.onConnectionLost = (responseObject: any) => {
      if (responseObject.errorCode !== 0) {
        console.log('Connection lost:', responseObject.errorMessage);
        setConnectStatus('Connection Lost');
      }
    };

    mqttClient.onMessageArrived = (message: any) => {
      console.log('Message arrived on topic:', message.destinationName);
      console.log('Message payload:', message.payloadString);
      
      try {
        const data = JSON.parse(message.payloadString);
        console.log('Parsed data:', data);
        
        if (data.temperature !== undefined) {
          // Convert to number and check if it's valid
          const tempValue = Number(data.temperature);
          if (!isNaN(tempValue)) {
            console.log('Setting temperature to:', tempValue);
            setTemperature(tempValue);
            setLastUpdateTime(new Date().toLocaleTimeString());
          } else {
            console.log('Invalid temperature value:', data.temperature);
            setTemperature(null);
          }
        } else {
          console.log('Temperature field not found in message');
        }
      } catch (e) {
        console.error('Failed to parse message:', e);
        console.log('Raw message:', message.payloadString);
      }
    };

    // Connect to the broker
    mqttClient.connect({
      onSuccess: () => {
        console.log('Connected to MQTT broker');
        setConnectStatus('Connected');
        setClient(mqttClient);
      },
      onFailure: (err: any) => {
        console.error('MQTT connection failed:', err);
        setConnectStatus('Connection Failed');
      },
      useSSL: false,
      timeout: 3,
      keepAliveInterval: 60
    });

    return () => {
      if (mqttClient && mqttClient.isConnected()) {
        mqttClient.disconnect();
      }
    };
  }, [clientId]);

  // Subscribe to topic when client is ready
  useEffect(() => {
    if (client && connectStatus === 'Connected') {
      console.log(`Subscribing to topic: ${TOPIC}`);
      
      client.subscribe(TOPIC, {
        qos: 0,
        onSuccess: () => {
          console.log(`Successfully subscribed to ${TOPIC}`);
          setIsReady(true);
        },
        onFailure: (err: any) => {
          console.error('Subscribe failed:', err);
          setIsReady(false);
        }
      });
    }
  }, [client, connectStatus, TOPIC]);

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <View style={styles.header}>
          <Text style={styles.title}>MQTT Sensor Monitor</Text>
          <Text style={[
            styles.connectionStatus,
            { color: connectStatus === 'Connected' ? '#4CAF50' : '#FF9800' }
          ]}>
            {connectStatus}
          </Text>
        </View>

        <View style={styles.sensorCard}>
          <Text style={styles.sensorName}>Fridge Sensor</Text>
          <Text style={styles.clientId}>Client ID: {clientId}</Text>
          <Text style={styles.topic}>Topic: {TOPIC}</Text>
          <View style={styles.tempDisplay}>
            {temperature !== null ? (
              <>
                <Text style={styles.temperature}>{temperature.toFixed(1)}°C</Text>
                <Text style={styles.updateTime}>Last update: {lastUpdateTime}</Text>
              </>
            ) : (
              <Text style={[
                styles.waitingText,
                isReady ? styles.readyText : null
              ]}>
                {isReady ? 'Ready' : 'Waiting for data...'}
              </Text>
            )}
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
    padding: 16,
  },
  card: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
  },
  connectionStatus: {
    fontSize: 14,
    fontWeight: '500',
  },
  sensorCard: {
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    padding: 16,
  },
  sensorName: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 4,
  },
  clientId: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  topic: {
    fontSize: 12,
    color: '#666',
    marginBottom: 12,
  },
  tempDisplay: {
    alignItems: 'center',
  },
  temperature: {
    fontSize: 48,
    fontWeight: '600',
    color: '#007AFF',
  },
  updateTime: {
    fontSize: 12,
    color: '#666',
    marginTop: 8,
  },
  waitingText: {
    fontSize: 16,
    color: '#666',
    fontStyle: 'italic',
  },
  readyText: {
    color: '#4CAF50',
    fontStyle: 'normal',
    fontWeight: '600',
  }
}); 