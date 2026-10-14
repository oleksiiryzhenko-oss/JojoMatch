import { Alert, Linking } from 'react-native';

import { useApp } from '../context/AppContext';

// Requests notification permission and explains what to do if it was refused
const useEnableNotifications = () => {
  const { enableNotifications } = useApp();

  return async () => {
    const status = await enableNotifications();
    if (status === 'blocked') {
      Alert.alert(
        'Bildirimler kapalı',
        'Hatırlatıcıları alabilmek için telefon ayarlarından JojoMatch bildirimlerine izin ver.',
        [
          { text: 'Vazgeç', style: 'cancel' },
          { text: 'Ayarları aç', onPress: () => Linking.openSettings() },
        ]
      );
    } else if (status === 'denied') {
      Alert.alert('İzin verilmedi', 'Hatırlatıcı saatleri kaydedildi ama bildirim gönderilemeyecek.');
    }
    return status === 'granted';
  };
};

export default useEnableNotifications;
