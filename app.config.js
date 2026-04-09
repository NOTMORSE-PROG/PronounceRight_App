const isAdmin = process.env.EXPO_PUBLIC_IS_ADMIN === 'true';

module.exports = ({ config }) => ({
  ...config,
  name: isAdmin ? 'SpeakRight Admin' : config.name,
  android: {
    ...config.android,
    package: isAdmin ? 'com.speakright.app.admin' : config.android.package,
  },
});
