import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import { LineChart } from 'react-native-chart-kit';

// Mock data - in a real app this would come from your backend
const initialSensors = [
  { id: 1, name: 'Main Fridge', currentTemp: 3.2, minTemp: 1, maxTemp: 5, unit: '°C', status: 'normal' },
  { id: 2, name: 'Freezer', currentTemp: -18.4, minTemp: -22, maxTemp: -16, unit: '°C', status: 'normal' }
];

export default function Index() {
  const [sensors, setSensors] = useState(initialSensors);
  const [expandedSensors, setExpandedSensors] = useState({}); // Track expanded state for each sensor

  // Mock incident detection
  useEffect(() => {
    const interval = setInterval(() => {
      const newSensors = sensors.map(sensor => {
        // Randomly create an incident for demo purposes
        if (Math.random() < 0.05 && sensor.status === 'normal') {
          const newTemp = sensor.name === 'Freezer' 
            ? sensor.maxTemp + Math.random() * 5
            : sensor.maxTemp + Math.random() * 3;
          
          return {
            ...sensor, 
            currentTemp: newTemp,
            status: 'warning'
          };
        }
        return sensor;
      });
      
      setSensors(newSensors);
    }, 10000);
    
    return () => clearInterval(interval);
  }, [sensors]);

  const handleCalibrateSensor = (id) => {
    setSensors(sensors.map(sensor => 
      sensor.id === id ? {...sensor, status: 'calibrating'} : sensor
    ));
    
    // Mock calibration process
    setTimeout(() => {
      setSensors(sensors.map(sensor => 
        sensor.id === id ? {...sensor, status: 'normal', currentTemp: (sensor.minTemp + sensor.maxTemp) / 2} : sensor
      ));
    }, 2000);
  };

  const handleAddSensor = () => {
    const id = sensors.length + 1;
    setSensors([
      ...sensors,
      { 
        id, 
        name: `Sensor ${id}`, 
        currentTemp: 4.0, 
        minTemp: 1, 
        maxTemp: 5, 
        unit: '°C',
        status: 'normal'
      }
    ]);
  };

  const generateTemperatureData = (sensor) => {
    // Generate mock data for the last hour with fewer points (15 points instead of 60)
    const dataPoints = [];
    const now = new Date();
    const isIncident = sensor.status === 'warning';
    
    // Define baseline values based on sensor type
    const baseline = sensor.name === 'Freezer' ? -18 : 3;
    const maxThreshold = sensor.maxTemp;
    const minThreshold = sensor.minTemp;
    
    // Random fluctuation amount (normal operation)
    const normalFluctuation = sensor.name === 'Freezer' ? 0.3 : 0.5;
    
    // For incidents, determine when the incident started (random time within last 30 minutes)
    const incidentStartIndex = isIncident ? Math.floor(Math.random() * 7) + 7 : -1;
    
    // Generate 15 data points (1 per 4 minutes)
    for (let i = 0; i < 15; i++) {
      const timestamp = new Date(now.getTime() - (60 - i * 4) * 60000);
      let temp;
      let status = 'normal';
      
      if (isIncident && i >= incidentStartIndex) {
        // During incident: gradually increase temperature beyond threshold
        const minutesSinceIncident = (i - incidentStartIndex) * 4;
        const exceedance = sensor.name === 'Freezer' 
          ? Math.min(6, minutesSinceIncident * 0.3) // Freezer warms more slowly
          : Math.min(4, minutesSinceIncident * 0.2); // Fridge warms more quickly
        
        temp = maxThreshold + exceedance;
        status = 'warning';
      } else {
        // Normal operation: random fluctuation within normal range
        const fluctuation = (Math.random() - 0.5) * normalFluctuation;
        temp = baseline + fluctuation;
        temp = Math.max(Math.min(temp, maxThreshold - 0.2), minThreshold + 0.2);
      }
      
      dataPoints.push({
        time: timestamp.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}),
        temperature: parseFloat(temp.toFixed(1)),
        status,
        timestampMs: timestamp.getTime()
      });
    }
    
    return {
      dataPoints,
      incidentStartTime: isIncident ? dataPoints[incidentStartIndex].timestampMs : null
    };
  };

  const toggleGraph = (sensorId) => {
    setExpandedSensors(prev => ({
      ...prev,
      [sensorId]: !prev[sensorId]
    }));
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.grid}>
        {sensors.map(sensor => (
          <Pressable 
            key={sensor.id}
            style={[
              styles.sensorCard,
              sensor.status === 'warning' ? styles.warningCard : null
            ]}
          >
            <View style={styles.cardHeader}>
              <Text style={styles.sensorName}>{sensor.name}</Text>
              <View style={styles.actions}>
                <Pressable 
                  onPress={() => handleCalibrateSensor(sensor.id)}
                  style={styles.iconButton}
                >
                  <MaterialCommunityIcons 
                    name="tune" 
                    size={24} 
                    color="#666" 
                  />
                </Pressable>
                <Pressable 
                  onPress={() => toggleGraph(sensor.id)}
                  style={styles.iconButton}
                >
                  <MaterialCommunityIcons 
                    name={expandedSensors[sensor.id] ? "chart-line" : "chart-line-variant"} 
                    size={24} 
                    color="#666" 
                  />
                </Pressable>
              </View>
            </View>

            <View style={styles.tempDisplay}>
              <MaterialCommunityIcons 
                name="thermometer" 
                size={32} 
                color={sensor.status === 'warning' ? '#FF3B30' : '#007AFF'} 
              />
              <Text style={[
                styles.temperature,
                sensor.status === 'warning' ? styles.warningText : null
              ]}>
                {sensor.currentTemp.toFixed(1)}{sensor.unit}
              </Text>
            </View>

            {sensor.status === 'warning' && (
              <Text style={styles.warningText}>Temperature Alert!</Text>
            )}

            {expandedSensors[sensor.id] && (
              <View style={styles.chartContainer}>
                <LineChart
                  data={{
                    labels: ['60m', '45m', '30m', '15m', 'now'],
                    datasets: [{
                      data: generateTemperatureData(sensor).dataPoints.map(dp => dp.temperature)
                    }]
                  }}
                  width={300}
                  height={200}
                  chartConfig={{
                    backgroundColor: '#ffffff',
                    backgroundGradientFrom: '#ffffff',
                    backgroundGradientTo: '#ffffff',
                    decimalPlaces: 1,
                    color: (opacity = 1) => `rgba(37, 99, 235, ${opacity})`, // More vibrant blue
                    strokeWidth: 2,
                    propsForDots: {
                      r: "4",
                      strokeWidth: "2",
                      stroke: "#2563eb"
                    },
                    propsForBackgroundLines: {
                      strokeDasharray: "3 3",
                      stroke: "#e5e7eb"
                    },
                    style: {
                      borderRadius: 16
                    }
                  }}
                  withDots={true}
                  withShadow={false}
                  withInnerLines={true}
                  withOuterLines={true}
                  withVerticalLines={true}
                  withHorizontalLines={true}
                  bezier
                  style={styles.chart}
                />
                <View style={styles.chartLegend}>
                  <View style={styles.legendItem}>
                    <View style={[styles.legendDot, { backgroundColor: '#ef4444' }]} />
                    <Text style={styles.legendText}>Max: {sensor.maxTemp}°C</Text>
                  </View>
                  <View style={styles.legendItem}>
                    <View style={[styles.legendDot, { backgroundColor: '#3b82f6' }]} />
                    <Text style={styles.legendText}>Min: {sensor.minTemp}°C</Text>
                  </View>
                </View>
              </View>
            )}
          </Pressable>
        ))}

        <Pressable 
          style={styles.addButton}
          onPress={handleAddSensor}
        >
          <Ionicons name="add" size={32} color="#007AFF" />
          <Text style={styles.addButtonText}>Add Sensor</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  grid: {
    padding: 16,
  },
  sensorCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  warningCard: {
    backgroundColor: '#FFF5F5',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sensorName: {
    fontSize: 18,
    fontWeight: '600',
  },
  actions: {
    flexDirection: 'row',
    gap: 12, // Increased gap between icons
  },
  tempDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  temperature: {
    fontSize: 32,
    fontWeight: '500',
  },
  warningText: {
    color: '#FF3B30',
    fontWeight: '600',
    marginTop: 8,
  },
  addButton: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderStyle: 'dashed',
    borderWidth: 1,
    borderColor: '#007AFF',
  },
  addButtonText: {
    color: '#007AFF',
    marginTop: 8,
  },
  chartContainer: {
    marginTop: 16,
    alignItems: 'center',
  },
  chart: {
    marginVertical: 8,
    borderRadius: 16,
  },
  chartLegend: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 8,
    gap: 16,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendText: {
    fontSize: 12,
    color: '#666',
  },
  iconButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: '#f4f4f5', // Light gray background
  },
}); 