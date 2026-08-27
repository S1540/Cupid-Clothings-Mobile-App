export default {
  expo: {
    name: "Cupid Clothing",
    slug: "cupid-clothing",
    version: "1.0.0",
    orientation: "portrait",

    icon: "./assets/images/icon.png",

    scheme: "cupidclothing",

    userInterfaceStyle: "automatic",

    newArchEnabled: true,

    ios: {
      supportsTablet: true,

      infoPlist: {
        NSSpeechRecognitionUsageDescription:
          "Allow $(PRODUCT_NAME) to use speech recognition.",

        NSMicrophoneUsageDescription:
          "Allow $(PRODUCT_NAME) to use the microphone.",
      },
    },

    android: {
      adaptiveIcon: {
        backgroundColor: "#E6F4FE",
        foregroundImage: "./assets/images/icon.png",
        backgroundImage: "./assets/images/icon.png",
        monochromeImage: "./assets/images/icon.png",
      },

      edgeToEdgeEnabled: true,

      predictiveBackGestureEnabled: false,

      permissions: [
        "android.permission.RECORD_AUDIO",
        "android.permission.ACCESS_COARSE_LOCATION",
        "android.permission.ACCESS_FINE_LOCATION",
      ],

      package: "com.cupid.clothing",

      googleServicesFile: "./google-services.json",
    },

    web: {
      bundler: "metro",
      output: "static",
      favicon: "./assets/images/favicon.png",
    },

    plugins: [
      "expo-router",

      [
        "expo-location",
        {
          locationWhenInUsePermission:
            "Allow Cupid to access your location for faster delivery experience.",
        },
      ],

      [
        "expo-splash-screen",
        {
          image: "./assets/images/splash-icon.png",
          imageWidth: 200,
          resizeMode: "contain",
          backgroundColor: "#ffffff",

          dark: {
            backgroundColor: "#000000",
          },
        },
      ],

      [
        "onesignal-expo-plugin",
        {
          mode: "development",
          smallIcons: ["./assets/images/notification-icon.png"],
        },
      ],

      "expo-video",

      "expo-speech-recognition",

      "@react-native-firebase/app",

      [
        "@rnmapbox/maps",
        {
          RNMapboxMapsDownloadToken: process.env.MAPBOX_DOWNLOADS_TOKEN,
        },
      ],
    ],

    experiments: {
      typedRoutes: true,
      reactCompiler: true,
    },

    extra: {
      router: {},

      eas: {
        projectId: "babad26a-aa59-4449-bece-34225870471f",
      },
    },
  },
};
