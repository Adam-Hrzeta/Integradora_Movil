import { Tabs } from 'expo-router';
import React from 'react';
import { Platform } from 'react-native';
import { HapticTab } from '@/components/HapticTab';
import TabBarBackground from '@/components/ui/TabBarBackground';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { AntDesign, Fontisto, Octicons, SimpleLineIcons } from '@expo/vector-icons';

export default function TabLayout() {
  const colorScheme = useColorScheme();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors[colorScheme ?? 'light'].tint,
        headerShown: false,
        tabBarButton: HapticTab,
        tabBarBackground: TabBarBackground,
        tabBarStyle: {
          display: 'none', // Oculta la barra de pestañas en todas las pantallas
        },
      }}>
      <Tabs.Screen
        name="register"
        options={{
          title: 'Registro',
          tabBarIcon: ({ color }) => <AntDesign name="addusergroup" size={24} color="black" />,
        }}
      />
      <Tabs.Screen
        name="registerVehicle"
        options={{
          title: 'Registro de vehiculo',
          tabBarIcon: ({ color }) => <Fontisto name="car" size={24} color="black" />,
        }}
      />
    </Tabs>
  );
}