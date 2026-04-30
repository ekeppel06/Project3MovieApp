import { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  Modal,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { createRoom, joinRoomByCode, getUserRooms } from '../services/roomService';
 
export default function HomeScreen({ navigation }) {
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [modalMode, setModalMode] = useState('create'); // 'create' | 'join'
  const [roomName, setRoomName] = useState('');
  const [roomDesc, setRoomDesc] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [submitting, setSubmitting] = useState(false);
 
  useEffect(() => {
    loadRooms();
  }, []);
 
  // Also reload when the screen is focused (e.g. after leaving a room)
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', loadRooms);
    return unsubscribe;
  }, [navigation]);
 
  async function loadRooms() {
    try {
      const data = await getUserRooms();
      setRooms(data);
    } catch (err) {
      Alert.alert('Error', err.message);
    } finally {
      setLoading(false);
    }
  }
 
  const openCreate = () => {
    setModalMode('create');
    setRoomName('');
    setRoomDesc('');
    setModalVisible(true);
  };
 
  const openJoin = () => {
    setModalMode('join');
    setInviteCode('');
    setModalVisible(true);
  };
 
  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      if (modalMode === 'create') {
        if (!roomName.trim()) throw new Error('Room name is required.');
        const roomId = await createRoom({ name: roomName.trim(), description: roomDesc.trim() });
        setModalVisible(false);
        navigation.navigate('Room', { roomId });
      } else {
        if (!inviteCode.trim()) throw new Error('Enter an invite code.');
        const roomId = await joinRoomByCode(inviteCode.trim());
        setModalVisible(false);
        navigation.navigate('Room', { roomId });
      }
      loadRooms();
    } catch (err) {
      Alert.alert('Error', err.message);
    } finally {
      setSubmitting(false);
    }
  };
 
  const renderRoom = ({ item }) => (
    <TouchableOpacity
      style={styles.roomCard}
      onPress={() => navigation.navigate('Room', { roomId: item.id })}
      activeOpacity={0.75}
    >
      <Text style={styles.roomName}>{item.name}</Text>
      {item.description ? (
        <Text style={styles.roomDesc} numberOfLines={2}>{item.description}</Text>
      ) : null}
      <View style={styles.roomMeta}>
        <Text style={styles.metaText}>👥 {item.memberIds.length} members</Text>
        <Text style={styles.inviteCodeBadge}>{item.inviteCode}</Text>
      </View>
    </TouchableOpacity>
  );
 
  return (
    <View style={styles.container}>
      {loading ? (
        <ActivityIndicator color="#e50914" size="large" style={{ marginTop: 80 }} />
      ) : (
        <FlatList
          data={rooms}
          keyExtractor={(item) => item.id}
          renderItem={renderRoom}
          contentContainerStyle={styles.list}
          ListHeaderComponent={<Text style={styles.sectionLabel}>Your Rooms</Text>}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Text style={styles.emptyEmoji}>🍿</Text>
              <Text style={styles.emptyTitle}>No rooms yet</Text>
              <Text style={styles.emptySubtitle}>Create or join a room to get started</Text>
            </View>
          }
        />
      )}

      {/* Action Buttons */}
      <View style={styles.actions}>
        <TouchableOpacity style={styles.joinBtn} onPress={openJoin}>
          <Text style={styles.joinBtnText}>Join Room</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.createBtn} onPress={openCreate}>
          <Text style={styles.createBtnText}>Create Room</Text>
        </TouchableOpacity>
      </View>
 
      {/* Create / Join modal */}
      <Modal visible={modalVisible} transparent animationType="slide" onRequestClose={() => setModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modal}>
            <Text style={styles.modalTitle}>
              {modalMode === 'create' ? 'Create a Room' : 'Join a Room'}
            </Text>
 
            {modalMode === 'create' ? (
              <>
                <TextInput
                  style={styles.modalInput}
                  placeholder="Room name *"
                  placeholderTextColor="#555"
                  value={roomName}
                  onChangeText={setRoomName}
                  maxLength={40}
                />
                <TextInput
                  style={styles.modalInput}
                  placeholder="Description (optional)"
                  placeholderTextColor="#555"
                  value={roomDesc}
                  onChangeText={setRoomDesc}
                  maxLength={120}
                />
              </>
            ) : (
              <TextInput
                style={[styles.modalInput, styles.codeInput]}
                placeholder="Enter invite code"
                placeholderTextColor="#555"
                value={inviteCode}
                onChangeText={(t) => setInviteCode(t.toUpperCase())}
                autoCapitalize="characters"
                maxLength={6}
              />
            )}
 
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.modalCancel}
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalConfirm, submitting && { opacity: 0.6 }]}
                onPress={handleSubmit}
                disabled={submitting}
              >
                {submitting ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Text style={styles.modalConfirmText}>
                    {modalMode === 'create' ? 'Create' : 'Join'}
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

//HomeScreen StyleSheet
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#121212' },
  list: { padding: 16, paddingBottom: 100 },
  sectionLabel: { color: '#555', fontSize: 12, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12 },
  roomCard: {
    backgroundColor: '#1e1e1e',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  roomName: { color: '#fff', fontSize: 17, fontWeight: '700' },
  roomDesc: { color: '#888', fontSize: 13, marginTop: 4 },
  roomMeta: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 10 },
  metaText: { color: '#666', fontSize: 13 },
  inviteCodeBadge: { color: '#e50914', fontWeight: '700', letterSpacing: 2, fontSize: 13 },
  emptyState: { alignItems: 'center', paddingTop: 60 },
  emptyEmoji: { fontSize: 48, marginBottom: 12 },
  emptyTitle: { color: '#fff', fontSize: 18, fontWeight: '700' },
  emptySubtitle: { color: '#666', fontSize: 14, marginTop: 4 },
  actions: {
    position: 'absolute', bottom: 20, left: 16, right: 16,
    flexDirection: 'row', gap: 10,
  },
  joinBtn: {
    flex: 1, borderRadius: 12, borderWidth: 1, borderColor: '#e50914',
    paddingVertical: 14, alignItems: 'center',
  },
  joinBtnText: { color: '#e50914', fontWeight: '700', fontSize: 15 },
  createBtn: {
    flex: 1, borderRadius: 12, backgroundColor: '#e50914',
    paddingVertical: 14, alignItems: 'center',
  },
  createBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'flex-end' },
  modal: { backgroundColor: '#1e1e1e', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 24, gap: 12 },
  modalTitle: { color: '#fff', fontSize: 18, fontWeight: '700', marginBottom: 4 },
  modalInput: {
    backgroundColor: '#2a2a2a', borderRadius: 10, color: '#fff',
    paddingHorizontal: 14, paddingVertical: 12, fontSize: 15,
  },
  codeInput: { letterSpacing: 4, textAlign: 'center', fontSize: 22, fontWeight: '700' },
  modalActions: { flexDirection: 'row', gap: 10, marginTop: 4 },
  modalCancel: {
    flex: 1, borderRadius: 10, borderWidth: 1, borderColor: '#333',
    paddingVertical: 13, alignItems: 'center',
  },
  modalCancelText: { color: '#888', fontWeight: '600' },
  modalConfirm: {
    flex: 2, borderRadius: 10, backgroundColor: '#e50914',
    paddingVertical: 13, alignItems: 'center',
  },
  modalConfirmText: { color: '#fff', fontWeight: '700', fontSize: 15 },
});
