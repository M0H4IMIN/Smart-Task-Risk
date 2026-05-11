import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { AuthProvider, useAuth } from "./src/context/AuthContext";
import LoginScreen      from "./src/screens/LoginScreen";
import DashboardScreen  from "./src/screens/DashboardScreen";
import CreateTaskScreen from "./src/screens/CreateTaskScreen";
import TaskDetailScreen from "./src/screens/TaskDetailScreen";
import PredictScreen    from "./src/screens/PredictScreen";
import StatsScreen      from "./src/screens/StatsScreen";
import ChatScreen       from "./src/screens/ChatScreen";
import { View, ActivityIndicator } from "react-native";

const Stack = createNativeStackNavigator();

function RootNavigator() {
  const { user, loading } = useAuth();

  if (loading) return (
    <View style={{ flex: 1, backgroundColor: "#0f172a", justifyContent: "center", alignItems: "center" }}>
      <ActivityIndicator size="large" color="#6366f1" />
    </View>
  );

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {user ? (
        <>
          <Stack.Screen name="Dashboard"  component={DashboardScreen} />
          <Stack.Screen name="CreateTask" component={CreateTaskScreen} />
          <Stack.Screen name="TaskDetail" component={TaskDetailScreen} />
          <Stack.Screen name="Predict"    component={PredictScreen} />
          <Stack.Screen name="Stats"      component={StatsScreen} />
          <Stack.Screen name="Chat"       component={ChatScreen} />
        </>
      ) : (
        <Stack.Screen name="Login" component={LoginScreen} />
      )}
    </Stack.Navigator>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <NavigationContainer>
        <RootNavigator />
      </NavigationContainer>
    </AuthProvider>
  );
}
