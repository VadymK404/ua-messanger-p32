import { ExpoConfig, ConfigContext } from 'expo/config';

module.exports = ({ config }: ConfigContext): ExpoConfig => {
  // Визначаємо поточне середовище (за замовчуванням production)
  const appEnv = process.env.APP_ENV || 'production';

  // Логіка вибору іконки
  let icon = './assets/icon.png'; // стандартна для production
  if (appEnv === 'development') {
    icon = './assets/images/icons/icon-dev.png';
  } else if (appEnv === 'preview') {
    icon = './assets/images/icons/icon-preview.png';
  }

  return {
    ...config,
    name: appEnv === 'production' ? "X-Clone" : `X-Clone (${appEnv})`,
    slug: "ua-messanger-p32",
    version: "1.0.0",
    owner: "vadym4iks-team",
    icon: icon, // Ось тут ми підставляємо вибрану іконку
    extra: {
      eas: {
        projectId: "45991838-dcc1-4f53-a355-58b7e62a2581"
      }
    },
    android: {
      package: appEnv === 'production' ? "com.vadym4ik.xclone" : `com.vadym4ik.xclone.${appEnv}`
    }
  };
};