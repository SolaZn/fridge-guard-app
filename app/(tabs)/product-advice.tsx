import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, Pressable, ScrollView, Modal } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

// Mock product database
const productDatabase = {
  'milk': 'Store at 1-5°C. Discard if left above 7°C for more than 2 hours.',
  'meat': 'Store below 4°C. Discard if left above 5°C for more than 1 hour.',
  'vegetables': 'Store at 0-5°C. Most vegetables can tolerate brief temperature excursions.',
  'ice cream': 'Store at -18°C. If softened but still cold, refreeze. Discard if melted.',
  'bread': 'Can be stored at room temperature. Refrigeration extends shelf life but affects texture.',
  'eggs': 'Store in refrigerator at 4°C. Discard if left above 7°C for more than 2 hours.',
  'cheese': 'Store at 4°C. Hard cheeses can tolerate brief temperature changes.',
  'yogurt': 'Store at 4°C. Discard if left above 7°C for more than 2 hours.',
  'fish': 'Store at 0-4°C. Discard if left above 5°C for more than 1 hour.',
  'fruits': 'Most fruits can be stored at 4-8°C. Some tropical fruits prefer room temperature.'
};

// Quick access products with icons
const quickAccessProducts = [
  { id: 1, name: 'Milk', icon: 'cup', type: 'milk' },
  { id: 2, name: 'Meat', icon: 'food-steak', type: 'meat' },
  { id: 3, name: 'Vegetables', icon: 'carrot', type: 'vegetables' },
  { id: 4, name: 'Ice Cream', icon: 'ice-cream', type: 'ice cream' },
  { id: 5, name: 'Bread', icon: 'bread-slice', type: 'bread' },
  { id: 6, name: 'Eggs', icon: 'egg', type: 'eggs' },
  { id: 7, name: 'Cheese', icon: 'cheese', type: 'cheese' },
  { id: 8, name: 'Fish', icon: 'fish', type: 'fish' },
];

export default function ProductAdvice() {
  const [manualProduct, setManualProduct] = useState('');
  const [showScanner, setShowScanner] = useState(false);
  const [advice, setAdvice] = useState(null);
  const [showModal, setShowModal] = useState(false);

  const handleBarcodeScanned = () => {
    // Mock barcode scanning result
    const randomProducts = [
      { name: 'Milk', advice: productDatabase['milk'] },
      { name: 'Chicken', advice: 'Store below 4°C. Use within 2 days of purchase or freeze.' },
      { name: 'Ice Cream', advice: productDatabase['ice cream'] }
    ];
    
    const product = randomProducts[Math.floor(Math.random() * randomProducts.length)];
    setShowScanner(false);
    setAdvice(product);
  };

  const handleManualProductEntry = () => {
    const lowercaseProduct = manualProduct.toLowerCase().trim();
    const productAdvice = productDatabase[lowercaseProduct];
    
    if (productAdvice) {
      setAdvice({
        name: manualProduct,
        advice: productAdvice
      });
    } else {
      setAdvice({
        name: manualProduct,
        advice: 'No specific advice available. Generally, refrigerated items should be kept below 5°C.'
      });
    }
    
    setManualProduct('');
  };

  const resetAdvice = () => {
    setAdvice(null);
    setShowScanner(false);
    setManualProduct('');
  };

  const handleQuickAccess = (product) => {
    setAdvice({
      name: product.name,
      advice: productDatabase[product.type]
    });
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setAdvice(null);
    setManualProduct('');
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Food Storage Advice</Text>
      
      {!advice ? (
        <View style={styles.inputContainer}>
          {!showScanner ? (
            <>
              <Pressable
                style={styles.scanButton}
                onPress={() => setShowScanner(true)}
              >
                <MaterialCommunityIcons name="barcode-scan" size={32} color="#007AFF" />
                <Text style={styles.scanButtonText}>Scan Product Barcode</Text>
              </Pressable>
              
              <View style={styles.divider}>
                <View style={styles.dividerLine} />
                <Text style={styles.dividerText}>OR</Text>
                <View style={styles.dividerLine} />
              </View>

              <View style={styles.manualInputContainer}>
                <Text style={styles.inputLabel}>Enter product type manually:</Text>
                <View style={styles.inputRow}>
                  <TextInput
                    style={styles.input}
                    value={manualProduct}
                    onChangeText={setManualProduct}
                    placeholder="e.g., milk, meat, vegetables"
                    placeholderTextColor="#666"
                  />
                  <Pressable
                    style={[
                      styles.searchButton,
                      !manualProduct && styles.searchButtonDisabled
                    ]}
                    onPress={handleManualProductEntry}
                    disabled={!manualProduct}
                  >
                    <Text style={[
                      styles.searchButtonText,
                      !manualProduct && styles.searchButtonTextDisabled
                    ]}>
                      Get Advice
                    </Text>
                  </Pressable>
                </View>
              </View>

              <View style={styles.divider}>
                <View style={styles.dividerLine} />
                <Text style={styles.dividerText}>OR</Text>
                <View style={styles.dividerLine} />
              </View>

              <View style={styles.quickAccessContainer}>
                <Text style={styles.sectionTitle}>Quick Access Products</Text>
                <View style={styles.productGrid}>
                  {quickAccessProducts.map((product) => (
                    <Pressable
                      key={product.id}
                      style={styles.productCard}
                      onPress={() => handleQuickAccess(product)}
                    >
                      <MaterialCommunityIcons 
                        name={product.icon} 
                        size={24} 
                        color="#007AFF" 
                      />
                      <Text style={styles.productCardText}>{product.name}</Text>
                    </Pressable>
                  ))}
                </View>
              </View>
            </>
          ) : (
            <View style={styles.scannerContainer}>
              <Text style={styles.scannerText}>Scanning...</Text>
              <Pressable
                style={styles.mockScanButton}
                onPress={handleBarcodeScanned}
              >
                <Text style={styles.mockScanButtonText}>Mock Scan Result</Text>
              </Pressable>
              <Pressable
                style={styles.cancelButton}
                onPress={() => setShowScanner(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </Pressable>
            </View>
          )}
        </View>
      ) : !showModal && (
        <View style={styles.adviceContainer}>
          <View style={styles.adviceHeader}>
            <MaterialCommunityIcons name="fridge" size={24} color="#007AFF" />
            <Text style={styles.productName}>{advice.name}</Text>
          </View>
          <Text style={styles.adviceText}>{advice.advice}</Text>
          <Pressable
            style={styles.newSearchButton}
            onPress={resetAdvice}
          >
            <Text style={styles.newSearchButtonText}>Check Another Product</Text>
          </Pressable>
        </View>
      )}

      <Modal
        animationType="slide"
        transparent={true}
        visible={showModal}
        onRequestClose={handleCloseModal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <MaterialCommunityIcons name="fridge" size={24} color="#007AFF" />
              <Text style={styles.modalTitle}>{advice?.name}</Text>
              <Pressable
                style={styles.closeButton}
                onPress={handleCloseModal}
              >
                <MaterialCommunityIcons name="close" size={24} color="#666" />
              </Pressable>
            </View>
            <Text style={styles.modalAdvice}>{advice?.advice}</Text>
            <View style={styles.temperatureGuide}>
              <MaterialCommunityIcons name="thermometer" size={20} color="#007AFF" />
              <Text style={styles.temperatureText}>
                Recommended Storage Temperature
              </Text>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  title: {
    fontSize: 24,
    fontWeight: '600',
    padding: 16,
    backgroundColor: 'white',
  },
  inputContainer: {
    padding: 16,
  },
  scanButton: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#007AFF',
    borderStyle: 'dashed',
  },
  scanButtonText: {
    color: '#007AFF',
    fontSize: 16,
    marginTop: 8,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 24,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#E5E5EA',
  },
  dividerText: {
    color: '#8E8E93',
    paddingHorizontal: 16,
  },
  manualInputContainer: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
  },
  inputLabel: {
    fontSize: 16,
    marginBottom: 8,
    color: '#000',
  },
  inputRow: {
    flexDirection: 'row',
    gap: 8,
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#E5E5EA',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  searchButton: {
    backgroundColor: '#007AFF',
    borderRadius: 8,
    paddingHorizontal: 16,
    justifyContent: 'center',
  },
  searchButtonDisabled: {
    backgroundColor: '#E5E5EA',
  },
  searchButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '500',
  },
  searchButtonTextDisabled: {
    color: '#8E8E93',
  },
  scannerContainer: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
  },
  scannerText: {
    fontSize: 18,
    marginBottom: 16,
  },
  mockScanButton: {
    backgroundColor: '#007AFF',
    borderRadius: 8,
    padding: 12,
    width: '100%',
    alignItems: 'center',
    marginBottom: 8,
  },
  mockScanButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '500',
  },
  cancelButton: {
    padding: 12,
    width: '100%',
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#007AFF',
    fontSize: 16,
  },
  adviceContainer: {
    margin: 16,
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
  },
  adviceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  productName: {
    fontSize: 20,
    fontWeight: '600',
  },
  adviceText: {
    fontSize: 16,
    color: '#333',
    lineHeight: 24,
  },
  newSearchButton: {
    marginTop: 16,
    padding: 12,
    alignItems: 'center',
  },
  newSearchButtonText: {
    color: '#007AFF',
    fontSize: 16,
    fontWeight: '500',
  },
  quickAccessContainer: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginTop: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 16,
    color: '#000',
  },
  productGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    justifyContent: 'space-between',
  },
  productCard: {
    width: '23%', // Approximately 4 cards per row with gap
    aspectRatio: 1,
    backgroundColor: '#F2F2F7',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  productCardText: {
    fontSize: 12,
    marginTop: 8,
    textAlign: 'center',
    color: '#333',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 20,
    width: '90%',
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    flex: 1,
    marginLeft: 12,
  },
  closeButton: {
    padding: 4,
  },
  modalAdvice: {
    fontSize: 16,
    lineHeight: 24,
    color: '#333',
    marginBottom: 16,
  },
  temperatureGuide: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F2F2F7',
    padding: 12,
    borderRadius: 8,
    gap: 8,
  },
  temperatureText: {
    fontSize: 14,
    color: '#666',
  },
});