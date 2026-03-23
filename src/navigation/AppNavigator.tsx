import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import LoginScreen from "../screens/auth/LoginScreen";
import ListProjectsScreen from "../screens/project/ListProjectsScreen";
import DetailProjectScreen from "../screens/project/DetailProjectScreen";
import ListTreesScreen from "../screens/tree/ListTreesScreen";
import DetailTreeScreen from "../screens/tree/DetailTreeScreen";
import CreateTreeScreen from "../screens/tree/CreateTreeScreen";

export type RootStackParamList = {
  Login: undefined;
  ListProjects: undefined;
  DetailProject: { idProject: number };
  ListTrees: { idProject: number; projectType: string };
  DetailTree: { idTree: number; idProject: number; projectType: string };
  CreateTree: { idProject: number; idTree: number; projectType: string };
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function AppNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="Login"
        screenOptions={{
          headerStyle: { backgroundColor: "#388E3C" },
          headerTintColor: "#fff",
          headerTitleStyle: { fontWeight: "bold" },
        }}
      >
        <Stack.Screen
          name="Login"
          component={LoginScreen}
          options={{ title: "Inicio de sesion" }}
        />
        <Stack.Screen
          name="ListProjects"
          component={ListProjectsScreen}
          options={{ title: "Proyectos", headerBackVisible: false }}
        />
        <Stack.Screen
          name="DetailProject"
          component={DetailProjectScreen}
          options={{ title: "Detalle del Proyecto" }}
        />
        <Stack.Screen
          name="ListTrees"
          component={ListTreesScreen}
          options={{ title: "Arboles" }}
        />
        <Stack.Screen
          name="DetailTree"
          component={DetailTreeScreen}
          options={{ title: "Detalle del Arbol" }}
        />
        <Stack.Screen
          name="CreateTree"
          component={CreateTreeScreen}
          options={({ route }) => ({
            title:
              route.params.idTree === 0
                ? "Registrar Arbol"
                : `Actualizar Arbol #${route.params.idTree}`,
          })}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
