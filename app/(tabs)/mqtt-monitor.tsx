import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Dimensions, ScrollView, TouchableOpacity, AppState } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import init from 'react_native_mqtt';
import { LineChart } from 'react-native-chart-kit';

// Initialize MQTT client
init({
  size: 10000,
  storageBackend: AsyncStorage,
  defaultExpires: 1000 * 3600 * 24,
  enableCache: true,
  sync: {}
});

interface TempDataPoint {
  temp: number;
  time: string;
  timestamp: number;
}

export default function MqttMonitor() {
  const [client, setClient] = useState<any>(null);
  const [connectStatus, setConnectStatus] = useState('Disconnected');
  const [temperature, setTemperature] = useState<number | null>(null);
  const [lastUpdateTime, setLastUpdateTime] = useState<string>('Never');
  const [isReady, setIsReady] = useState(false);
  const [clientId] = useState(`fridge-app-${Math.random().toString(16).slice(2, 10)}`);
  const TOPIC = 'ESILV'; // Remove trailing slash
  const [tempHistory, setTempHistory] = useState<TempDataPoint[]>([]);
  const NORMAL_TEMP_MIN = -4;
  const NORMAL_TEMP_MAX = 6;
  const WARNING_TEMP_MAX = 10;
  const appState = useRef(AppState.currentState);
  const mqttRef = useRef<any>(null);

  const handleReset = () => {
    setTempHistory([]);
    setTemperature(null);
    setLastUpdateTime('Never');
    setIsReady(true);
  };

  // Handle app state changes
  useEffect(() => {
    const subscription = AppState.addEventListener('change', nextAppState => {
      if (
        appState.current === 'background' &&
        nextAppState === 'active'
      ) {
        // App has come to the foreground
        console.log('App has come to foreground, reconnecting MQTT...');
        reconnectMqtt();
      }
      appState.current = nextAppState;
    });

    return () => {
      subscription.remove();
    };
  }, []);

  const reconnectMqtt = () => {
    try {
      if (mqttRef.current) {
        mqttRef.current.disconnect();
      }
      setupMqttConnection();
    } catch (error) {
      console.error('Reconnection error:', error);
      setConnectStatus('Connection Failed');
    }
  };

  const setupMqttConnection = () => {
    try {
      const mqttClient = new Paho.MQTT.Client(
        'broker.emqx.io',
        8083,
        '/mqtt',
        clientId
      );

      mqttClient.onConnectionLost = (responseObject: any) => {
        if (responseObject.errorCode !== 0) {
          console.log('Connection lost:', responseObject.errorMessage);
          setConnectStatus('Connection Lost');
          // Try to reconnect after a delay
          setTimeout(reconnectMqtt, 5000);
        }
      };

      mqttClient.onMessageArrived = (message: any) => {
        console.log('Message arrived on topic:', message.destinationName);
        try {
          const data = JSON.parse(message.payloadString);
          if (data.temperature !== undefined) {
            const tempValue = Number(data.temperature);
            if (!isNaN(tempValue)) {
              setTemperature(tempValue);
              const now = Date.now(); // Use timestamp in milliseconds
              const newDataPoint = {
                temp: tempValue,
                time: formatTime(now),
                timestamp: now
              };
              
              setTempHistory(prev => {
                const newHistory = [...prev, newDataPoint]
                  .sort((a, b) => a.timestamp - b.timestamp)
                  .slice(-10);
                return newHistory;
              });
              
              setLastUpdateTime(formatTime(now));
            }
          }
        } catch (e) {
          console.error('Message processing error:', e);
        }
      };

      mqttClient.connect({
        onSuccess: () => {
          console.log('Connected to MQTT broker');
          setConnectStatus('Connected');
          mqttClient.subscribe(TOPIC, {
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
        },
        onFailure: (err: any) => {
          console.error('MQTT connection failed:', err);
          setConnectStatus('Connection Failed');
          // Try to reconnect after a delay
          setTimeout(reconnectMqtt, 5000);
        },
        useSSL: false,
        timeout: 3,
        keepAliveInterval: 60
      });

      mqttRef.current = mqttClient;
    } catch (error) {
      console.error('Setup error:', error);
      setConnectStatus('Setup Failed');
    }
  };

  useEffect(() => {
    setupMqttConnection();

    return () => {
      try {
        if (mqttRef.current && mqttRef.current.isConnected()) {
          mqttRef.current.disconnect();
        }
      } catch (error) {
        console.error('Cleanup error:', error);
      }
    };
  }, [clientId]);

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false // Use 24-hour format
    });
  };

  const renderChart = () => {
    if (tempHistory.length < 2) return null;

    const chartData = {
      labels: tempHistory.map(point => formatTime(point.timestamp)),
      datasets: [{
        data: tempHistory.map(point => point.temp),
      }]
    };

    return (
      <View style={styles.chartContainer}>
        <View style={styles.chartHeader}>
          <Text style={styles.chartTitle}>Temperature History</Text>
          <TouchableOpacity 
            style={styles.resetButton}
            onPress={handleReset}
          >
            <Text style={styles.resetButtonText}>Reset</Text>
          </TouchableOpacity>
        </View>
        <LineChart
          data={chartData}
          width={Dimensions.get('window').width - 40}
          height={220}
          chartConfig={{
            backgroundColor: '#ffffff',
            backgroundGradientFrom: '#ffffff',
            backgroundGradientTo: '#ffffff',
            decimalPlaces: 1,
            color: (opacity = 1) => {
              const currentTemp = tempHistory[tempHistory.length - 1]?.temp;
              if (currentTemp > WARNING_TEMP_MAX) {
                return `rgba(255, 0, 0, ${opacity})`;
              } else if (currentTemp > NORMAL_TEMP_MAX) {
                return `rgba(255, 204, 0, ${opacity})`;
              }
              return `rgba(0, 122, 255, ${opacity})`;
            },
            labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
            propsForLabels: {
              fontSize: '10',
              rotation: -45,
              dy: 10
            },
            propsForVerticalLabels: {
              rotation: -45,
              dy: 10
            },
            style: {
              borderRadius: 16
            }
          }}
          bezier
          style={styles.chart}
          withDots={true}
          withInnerLines={true}
          withOuterLines={true}
          withVerticalLines={false}
          withHorizontalLines={true}
          withVerticalLabels={true}
          withHorizontalLabels={true}
          segments={5}
          yAxisInterval={2}
          xLabelsOffset={-10}
        />
        <View style={styles.legendContainer}>
          <View style={styles.legendItem}>
            <View style={[styles.legendColor, { backgroundColor: '#007AFF' }]} />
            <Text style={styles.legendText}>Normal ({NORMAL_TEMP_MIN}°C to {NORMAL_TEMP_MAX}°C)</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendColor, { backgroundColor: '#FFCC00' }]} />
            <Text style={styles.legendText}>Warning ({NORMAL_TEMP_MAX}°C to {WARNING_TEMP_MAX}°C)</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendColor, { backgroundColor: '#FF0000' }]} />
            <Text style={styles.legendText}>Critical (> {WARNING_TEMP_MAX}°C)</Text>
          </View>
        </View>
      </View>
    );
  };

  return (
    <ScrollView style={styles.container}>
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
                <Text style={[
                  styles.temperature,
                  temperature > WARNING_TEMP_MAX ? styles.criticalTemp :
                  temperature > NORMAL_TEMP_MAX ? styles.warningTemp :
                  styles.normalTemp
                ]}>
                  {temperature.toFixed(1)}°C
                </Text>
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
      
      {renderChart()}
      
      <View style={styles.bottomPadding} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
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
  },
  chartContainer: {
    marginTop: 20,
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    paddingBottom: 30, // Added extra padding at bottom for rotated labels
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  chartTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 16,
  },
  chart: {
    marginVertical: 8,
    borderRadius: 16,
  },
  legendContainer: {
    marginTop: 16,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  legendColor: {
    width: 16,
    height: 16,
    borderRadius: 8,
    marginRight: 8,
  },
  legendText: {
    fontSize: 12,
    color: '#666',
  },
  bottomPadding: {
    height: 20,
  },
  chartHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  resetButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  resetButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  normalTemp: {
    color: '#007AFF',
  },
  warningTemp: {
    color: '#FFCC00',
  },
  criticalTemp: {
    color: '#FF0000',
  },
}); 