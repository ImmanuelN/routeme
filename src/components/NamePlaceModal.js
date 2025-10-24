import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import AppButton from './AppButton';

const NamePlaceModal = ({ visible, coords, defaultName = '', onSave, onClose }) => {
  const [name, setName] = useState(defaultName || '');

  useEffect(() => {
    if (visible) setName(defaultName || '');
  }, [visible, defaultName]);

  const handleSave = () => {
    const trimmed = (name || '').trim();
    if (!trimmed) return; // simple guard; parent may show feedback
    if (onSave) onSave({ latitude: coords.latitude, longitude: coords.longitude, name: trimmed });
  };

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.backdrop}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.container}
        >
          <View style={styles.card}>
            <Text style={styles.title}>Name this place</Text>
            <Text style={styles.hint}>Give the selected location a friendly name</Text>
            <TextInput
              value={name}
              onChangeText={setName}
              placeholder="e.g. Grandma's House, Work"
              style={styles.input}
              returnKeyType="done"
            />

            <View style={styles.row}>
              <AppButton title="Cancel" variant="secondary" style={styles.btn} onPress={onClose} />
              <AppButton title="Save" variant="primary" style={styles.btn} onPress={handleSave} />
            </View>
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  container: {
    width: '100%',
    maxWidth: 500,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 18,
    elevation: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 6,
  },
  hint: {
    fontSize: 13,
    color: '#666',
    marginBottom: 12,
  },
  input: {
    borderWidth: 1,
    borderColor: '#E6E6E6',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    marginBottom: 14,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  btn: {
    minWidth: 100,
    marginLeft: 8,
  },
});

export default NamePlaceModal;
