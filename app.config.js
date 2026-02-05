module.exports = {
    name: 'couple-game',
    slug: 'couple-game',
    version: '1.0.0',
    platforms: ['ios', 'android', 'web'],
    // No plugins needed - react-native-webrtc doesn't have an Expo config plugin
    // For web, we use browser WebRTC APIs directly (see videoCall.web.ts)
    // For native, you would need expo-dev-client and prebuild
};
