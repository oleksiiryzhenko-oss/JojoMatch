import { Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';

import { useApp } from '../context/AppContext';

// Starts a workout, asking first if another one is still in progress
const useStartWorkout = () => {
  const navigation = useNavigation();
  const { activeSession, startSession, discardSession } = useApp();

  return (template = null, plannedDate = null) => {
    const go = () => {
      startSession(template, plannedDate);
      navigation.navigate('Session');
    };

    if (!activeSession) return go();

    Alert.alert('Treino em andamento', `”${activeSession.name}” ainda não terminou.`, [
      { text: 'Continuar', onPress: () => navigation.navigate('Session') },
      {
        text: 'Excluir e iniciar novo',
        style: 'destructive',
        onPress: () => {
          discardSession();
          go();
        },
      },
      { text: 'Cancelar', style: 'cancel' },
    ]);
  };
};

export default useStartWorkout;
