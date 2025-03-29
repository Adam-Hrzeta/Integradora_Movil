import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, TextInput, KeyboardAvoidingView, Platform } from 'react-native';
import { collection, query, where, onSnapshot, addDoc, serverTimestamp } from 'firebase/firestore';
import { db, auth } from '../../lib/firebase';
import { MaterialIcons } from '@expo/vector-icons';

interface Message {
  id: string;
  message: string;
  timestamp: any;
  fromAdmin: boolean;
  userId: string;
  userEmail: string;
  response?: string;
  responseTimestamp?: any;
}

export default function MessagesScreen() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [newMessage, setNewMessage] = useState('');

  useEffect(() => {
    const user = auth.currentUser;
    if (!user) return;

    const messagesRef = collection(db, 'messages');
    const q = query(messagesRef, where('userId', '==', user.uid));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const messageList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      })) as Message[];

      messageList.sort((a, b) => {
        const aTime = a.timestamp?.toDate?.()?.getTime() || 0;
        const bTime = b.timestamp?.toDate?.()?.getTime() || 0;
        return aTime - bTime;
      });
      
      setMessages(messageList);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const sendMessage = async () => {
    if (!newMessage.trim()) return;

    const user = auth.currentUser;
    if (!user) return;

    try {
      await addDoc(collection(db, 'messages'), {
        message: newMessage.trim(),
        timestamp: serverTimestamp(),
        fromAdmin: false,
        userId: user.uid,
        userEmail: user.email
      });
      setNewMessage('');
    } catch (error) {
      console.error('Error al enviar mensaje:', error);
    }
  };

  const renderMessage = ({ item }: { item: Message }) => (
    <View style={[
      styles.messageContainer,
      item.fromAdmin ? styles.adminMessageContainer : styles.userMessageContainer
    ]}>
      <View style={[
        styles.messageBubble,
        item.fromAdmin ? styles.adminBubble : styles.userBubble
      ]}>
        <View style={styles.messageContent}>
          <Text style={item.fromAdmin ? styles.adminMessageText : styles.messageText}>{item.message}</Text>
          <Text style={[
            styles.timestamp,
            item.fromAdmin ? { color: '#666' } : { color: '#fff' }
          ]}>
            {item.timestamp?.toDate?.()?.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) || 'Sin fecha'}
          </Text>
        </View>
      </View>
      {item.response && (
        <View style={styles.responseContainer}>
          <View style={styles.adminBubble}>
            <View style={styles.messageContent}>
              <Text style={styles.adminMessageText}>{item.response}</Text>
              <Text style={[styles.timestamp, { color: '#666' }]}>
                {item.responseTimestamp?.toDate?.()?.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) || 'Sin fecha'}
              </Text>
            </View>
          </View>
        </View>
      )}
    </View>
  );

  if (loading) {
    return (
      <View style={styles.container}>
        <Text style={styles.loadingText}>Cargando mensajes...</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.container}
    >
      <FlatList
        data={messages}
        renderItem={renderMessage}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContainer}
        inverted={false}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <MaterialIcons name="message" size={48} color="#4CAF50" />
            <Text style={styles.emptyText}>No hay mensajes</Text>
            <Text style={styles.emptySubText}>Envía un mensaje y te responderemos pronto</Text>
          </View>
        }
      />
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          value={newMessage}
          onChangeText={setNewMessage}
          placeholder="Escribe tu mensaje..."
          placeholderTextColor="#666"
          multiline
        />
        <TouchableOpacity 
          style={[
            styles.sendButton,
            !newMessage.trim() && styles.sendButtonDisabled
          ]}
          onPress={sendMessage}
          disabled={!newMessage.trim()}
        >
          <MaterialIcons 
            name="send" 
            size={24} 
            color={newMessage.trim() ? "#4CAF50" : "#ccc"} 
          />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginTop: 20,
  },
  listContainer: {
    padding: 16,
    paddingBottom: 80,
  },
  messageContainer: {
    marginVertical: 4,
    paddingHorizontal: 16,
    width: '100%',
  },
  userMessageContainer: {
    alignItems: 'flex-end',
  },
  adminMessageContainer: {
    alignItems: 'flex-start',
  },
  messageBubble: {
    maxWidth: '80%',
    padding: 12,
    borderRadius: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  userBubble: {
    backgroundColor: '#4CAF50',
    borderBottomRightRadius: 4,
  },
  adminBubble: {
    backgroundColor: '#e0e0e0',
    borderBottomLeftRadius: 4,
  },
  messageContent: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
  },
  messageText: {
    fontSize: 16,
    color: '#fff',
    lineHeight: 20,
    marginRight: 8,
  },
  adminMessageText: {
    fontSize: 16,
    color: '#333',
    lineHeight: 20,
    marginRight: 8,
  },
  timestamp: {
    fontSize: 12,
    marginTop: 0,
    marginLeft: 4,
  },
  responseContainer: {
    marginTop: 8,
    width: '100%',
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  emptyText: {
    marginTop: 16,
    fontSize: 18,
    color: '#333',
    fontWeight: 'bold',
  },
  emptySubText: {
    marginTop: 8,
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  input: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 8,
    maxHeight: 100,
    color: '#333',
  },
  sendButton: {
    justifyContent: 'center',
    alignItems: 'center',
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f5f5f5',
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
}); 