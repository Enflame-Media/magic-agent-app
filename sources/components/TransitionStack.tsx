import "react-native-reanimated";
import { createNativeStackNavigator } from "react-native-screen-transitions";
import type { ParamListBase, StackNavigationState } from "@react-navigation/native";
import type { NativeStackNavigationEventMap, NativeStackNavigationOptions } from "react-native-screen-transitions/lib/typescript/types/navigator";
import { withLayoutContext } from "expo-router";

const TransitionableStack = createNativeStackNavigator();

export const Stack = withLayoutContext<
	NativeStackNavigationOptions,
	typeof TransitionableStack.Navigator,
	StackNavigationState<ParamListBase>,
	NativeStackNavigationEventMap
>(TransitionableStack.Navigator);