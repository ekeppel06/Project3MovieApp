import { useEffect, useState } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { ensureAuth } from './config/firebase';

import HomeScreen from './screens/HomeScreen';
import RoomScreen from './screens/RoomScreen';
import MovieSearchScreen from './screens/MovieSearchScreen';
import VotingScreen from './screens/VotingScreen';


const Stack = createNativeStackNavigator();
 
export default function App() {
  //Firestore Authentication
  //Waits until user is authenticated through Firestore before attempting to render app to avoid errors
  const [ready, setReady] = useState(false);

  useEffect(() => {
    ensureAuth().then(() => setReady(true));
  }, []);
  
  if (!ready) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#121212' }}>
        <ActivityIndicator color="#e50914" size="large" />
      </View>
    );
  }


  //App rendering
  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          headerStyle: { backgroundColor: '#0d0d0d' },
          headerTintColor: '#e50914',
          headerTitleStyle: { color: '#fff', fontWeight: '700' },
          contentStyle: { backgroundColor: '#121212' },
        }}
      >
        <Stack.Screen name="Home" component={HomeScreen} options={{ title: '🎬 Movie Rooms' }} />
        <Stack.Screen name="Room" component={RoomScreen} options={{ title: 'Room' }} />
        <Stack.Screen
          name="MovieSearch"
          component={MovieSearchScreen}
          options={({ route }) => ({ title: `Add to ${route.params.roomName}` })}
        />
        <Stack.Screen name="Voting" component={VotingScreen} options={{ title: 'Vote 🗳' }}/>
      </Stack.Navigator>
    </NavigationContainer>
  );
}
 
