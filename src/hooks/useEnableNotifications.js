import { Alert, Linking } from 'react-native';

import { useApp } from '../context/AppContext';

// Requests notification permission and explains what to do if it was refused
const useEnableNotifications = () => {
  const { enableNotifications } = useApp();

  return async () => {
    const status = await enableNotifications();
    if (status === 'blocked') {
      Alert.alert(
        'Notificações desativadas',
        'Para receber lembretes, permita as notificações do JojoMatch nas configurações do telefone.',
        [
          { text: 'Cancelar', style: 'cancel' },
          { text: 'Abrir configurações', onPress: () => Linking.openSettings() },
        ]
      );
    } else if (status === 'denied') {
      Alert.alert('Permissão negada', 'Os horários dos lembretes foram salvos, mas as notificações não poderão ser enviadas.');
    }
    return status === 'granted';
  };
};

export default useEnableNotifications;
