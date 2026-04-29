import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import HomeScreen from './screens/HomeScreen';
import RoomScreen from './screens/RoomScreen.js';
import MovieSearchScreen from './screens/MovieSearchScreen';
 
const Stack = createNativeStackNavigator();
 
export default function App() {
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
      </Stack.Navigator>
    </NavigationContainer>
  );
}
 
