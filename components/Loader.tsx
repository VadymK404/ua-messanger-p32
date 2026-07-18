import { ActivityIndicator, View } from "react-native"
import { COLORS } from "@/constants/theme"
 
export function Loader(){
    return <View style={{
        flex: 1,
        justifyContent: "center",
        alignItems: "center"
    }}>
        <ActivityIndicator size="large" color={COLORS.primary} />
    </View>
}