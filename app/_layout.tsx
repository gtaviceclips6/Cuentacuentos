import { Andika_400Regular, Andika_700Bold } from "@expo-google-fonts/andika";
import { Grandstander_800ExtraBold } from "@expo-google-fonts/grandstander";
import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { CastProvider } from "../src/state/cast";
import { ProgressProvider } from "../src/state/progress";
import { color } from "../src/theme";

SplashScreen.preventAutoHideAsync().catch(() => {});

export default function RootLayout() {
  const [loaded, error] = useFonts({ Andika_400Regular, Andika_700Bold, Grandstander_800ExtraBold });

  useEffect(() => {
    if (loaded || error) SplashScreen.hideAsync().catch(() => {});
  }, [loaded, error]);

  if (!loaded && !error) return null;

  return (
    <SafeAreaProvider>
      <CastProvider>
        <ProgressProvider>
        <StatusBar style="dark" />
        <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: color.bg } }}>
          <Stack.Screen name="index" />
          <Stack.Screen name="reparto/[slug]" />
          <Stack.Screen name="leer/[slug]" options={{ gestureEnabled: false, animation: "fade" }} />
        </Stack>
        </ProgressProvider>
      </CastProvider>
    </SafeAreaProvider>
  );
}
