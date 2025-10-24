import React, { useEffect, useState } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  Pressable,
  Animated,
  Dimensions,
} from 'react-native';
import AppButton from './AppButton';
import NamePlaceModal from './NamePlaceModal';
import { loadSearchHistory, removeSearchEntry, saveSearchEntry, clearSearchHistory, toggleFavorite } from '../utils/storage';
import { Ionicons } from '@expo/vector-icons';
import { on as onEvent, off as offEvent } from '../utils/eventBus';

const { height } = Dimensions.get('window');

const SearchHistoryModal = ({ visible, onClose, onSelect }) => {
  const [items, setItems] = useState([]);
  const [editing, setEditing] = useState(null);
  const [slideAnim] = useState(new Animated.Value(height));
  const [showFavorites, setShowFavorites] = useState(false);

  const refresh = async () => {
    const list = await loadSearchHistory();
    setItems(list || []);
  };

  useEffect(() => {
    let mounted = true;
    if (visible) {
      refresh();
      Animated.spring(slideAnim, { toValue: 0, useNativeDriver: true }).start();
    } else {
      Animated.timing(slideAnim, { toValue: height, duration: 180, useNativeDriver: true }).start();
    }

    const unsub = onEvent('searchHistoryChanged', async () => {
      if (!mounted) return;
      await refresh();
    });

    return () => {
      mounted = false;
      try { unsub(); } catch (e) {}
    };
  }, [visible]);

  const handleDelete = (entry) => {
    Alert.alert('Delete', 'Remove this saved place?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          await removeSearchEntry({ timestamp: entry.timestamp });
          await refresh();
        },
      },
    ]);
  };

  const handleEdit = (entry) => {
    setEditing(entry);
  };

  const handleSaveEdit = async (updated) => {
    await saveSearchEntry({
      placeId: editing.placeId,
      name: updated.name,
      address: updated.address || editing.address,
      latitude: updated.latitude || editing.latitude,
      longitude: updated.longitude || editing.longitude,
    });
    setEditing(null);
    await refresh();
  };

  const handleClearAll = () => {
    Alert.alert('Clear all', 'Remove all saved searches?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Clear All',
        style: 'destructive',
        onPress: async () => {
          await clearSearchHistory();
          await refresh();
        },
      },
    ]);
  };

  const renderItem = ({ item }) => (
    <View style={styles.row}>
      <TouchableOpacity
        style={styles.itemLeft}
        onPress={() => {
          onSelect && onSelect({ latitude: item.latitude, longitude: item.longitude, name: item.name, address: item.address });
          onClose && onClose();
        }}
      >
        <Text style={styles.title} numberOfLines={1}>{item.name || item.address}</Text>
        <Text style={styles.sub} numberOfLines={2}>{item.address}</Text>
      </TouchableOpacity>

      <View style={styles.actions}>
        <TouchableOpacity onPress={async () => { await toggleFavorite({ timestamp: item.timestamp }); await refresh(); }} style={styles.iconBtn}>
          <Ionicons name={item.favorite ? 'star' : 'star-outline'} size={18} color={item.favorite ? '#F6C90E' : '#9CA3AF'} />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => handleEdit(item)} style={styles.iconBtn}>
          <Ionicons name="pencil" size={18} color="#4A90E2" />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => handleDelete(item)} style={styles.iconBtn}>
          <Ionicons name="trash" size={18} color="#E53E3E" />
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <Modal visible={visible} transparent animationType="none">
      <View style={styles.overlay}>
        <Pressable style={styles.backdrop} onPress={() => onClose && onClose()} />
        <Animated.View style={[styles.modalContainer, { transform: [{ translateY: slideAnim }] }]}>
          <View style={styles.handleBar} />
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <Ionicons name="book" size={26} color="#4A90E2" style={{ marginRight: 12 }} />
              <Text style={styles.headerTitle}>Saved Searches</Text>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <TouchableOpacity
                    onPress={() => setShowFavorites(!showFavorites)}
                    style={{ marginRight: 8, padding: 6 }}
                    accessibilityLabel={showFavorites ? 'Show all saved searches' : 'Show favorites only'}
                >
                    <Ionicons name={showFavorites ? 'star' : 'star-outline'} size={22} color={showFavorites ? '#F6C90E' : '#9CA3AF'} />
                </TouchableOpacity>
             
              <AppButton title="Clear All" variant="danger" style={{ marginRight: 8 }} onPress={handleClearAll} />
              <TouchableOpacity style={styles.closeButton} onPress={() => onClose && onClose()}>
                <Ionicons name="close" size={18} color="#6B7280" />
              </TouchableOpacity>
            </View>
          </View>

          <FlatList
            data={showFavorites ? items.filter(i => i.favorite) : items}
            keyExtractor={(i) => `${i.timestamp}-${i.latitude}-${i.longitude}`}
            renderItem={renderItem}
            ItemSeparatorComponent={() => <View style={styles.sep} />}
            contentContainerStyle={{ paddingBottom: 20 }}
          />
        </Animated.View>

        {editing && (
          <NamePlaceModal
            visible={!!editing}
            coords={{ latitude: editing.latitude, longitude: editing.longitude }}
            defaultName={editing.name || ''}
            onClose={() => setEditing(null)}
            onSave={(entry) => handleSaveEdit({ ...entry, address: editing.address })}
          />
        )}
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  backdrop: { flex: 1 },
  modalContainer: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 20,
    paddingTop: 12,
    maxHeight: height * 0.75,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 10,
  },
  handleBar: {
    width: 40,
    height: 4,
    backgroundColor: '#D1D5DB',
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 12,
  },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  headerLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  headerTitle: { fontSize: 18, fontWeight: '700' },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12 },
  itemLeft: { flex: 1, paddingRight: 8 },
  title: { fontSize: 16, fontWeight: '600' },
  sub: { fontSize: 13, color: '#6B7280' },
  actions: { flexDirection: 'row', marginLeft: 8 },
  iconBtn: { marginLeft: 8, padding: 6 },
  sep: { height: 1, backgroundColor: '#EEE', marginVertical: 6 },
});

export default SearchHistoryModal;
