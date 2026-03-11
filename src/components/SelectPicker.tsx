import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Modal, FlatList, StyleSheet } from 'react-native';

interface Option {
  label: string;
  value: any;
}

interface SelectPickerProps {
  label: string;
  options: Option[];
  value: any;
  onChange: (value: any) => void;
  multiple?: boolean;
}

export default function SelectPicker({ label, options, value, onChange, multiple }: SelectPickerProps) {
  const [visible, setVisible] = useState(false);

  const getDisplayText = () => {
    if (multiple) {
      if (!value || value.length === 0) return 'Seleccionar...';
      return `${value.length} seleccionado(s)`;
    }
    const selected = options.find((o) => o.value === value);
    return selected?.label || 'Seleccionar...';
  };

  const handleSelect = (optionValue: any) => {
    if (multiple) {
      const current = value || [];
      const exists = current.includes(optionValue);
      onChange(exists ? current.filter((v: any) => v !== optionValue) : [...current, optionValue]);
    } else {
      onChange(optionValue);
      setVisible(false);
    }
  };

  const isSelected = (optionValue: any) => {
    if (multiple) return (value || []).includes(optionValue);
    return value === optionValue;
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      <TouchableOpacity style={styles.selector} onPress={() => setVisible(true)}>
        <Text style={[styles.selectorText, !value && styles.placeholder]}>{getDisplayText()}</Text>
      </TouchableOpacity>

      <Modal visible={visible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{label}</Text>
            <FlatList
              data={options}
              keyExtractor={(item, i) => String(i)}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[styles.option, isSelected(item.value) && styles.optionSelected]}
                  onPress={() => handleSelect(item.value)}
                >
                  <Text style={[styles.optionText, isSelected(item.value) && styles.optionTextSelected]}>
                    {item.label}
                  </Text>
                </TouchableOpacity>
              )}
            />
            {multiple && (
              <TouchableOpacity style={styles.closeButton} onPress={() => setVisible(false)}>
                <Text style={styles.closeButtonText}>OK</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginBottom: 8 },
  label: { color: '#555', fontSize: 13, marginBottom: 4 },
  selector: { borderBottomWidth: 1, borderBottomColor: '#ddd', paddingVertical: 10 },
  selectorText: { fontSize: 16, color: '#333' },
  placeholder: { color: '#999' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 20 },
  modalContent: { backgroundColor: '#fff', borderRadius: 12, maxHeight: '70%', padding: 16 },
  modalTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 12, color: '#333' },
  option: { paddingVertical: 12, paddingHorizontal: 8, borderBottomWidth: 0.5, borderBottomColor: '#eee' },
  optionSelected: { backgroundColor: '#E8F5E9' },
  optionText: { fontSize: 15, color: '#333' },
  optionTextSelected: { color: '#388E3C', fontWeight: 'bold' },
  closeButton: { backgroundColor: '#388E3C', padding: 14, borderRadius: 8, alignItems: 'center', marginTop: 12 },
  closeButtonText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
});
