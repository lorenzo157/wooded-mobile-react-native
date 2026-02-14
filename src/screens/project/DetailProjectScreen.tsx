import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/AppNavigator';
import { projectService } from '../../services/project.service';
import { ProjectDto } from '../../types/project.types';

type Props = NativeStackScreenProps<RootStackParamList, 'DetailProject'>;

export default function DetailProjectScreen({ route, navigation }: Props) {
  const { idProject } = route.params;
  const [project, setProject] = useState<ProjectDto | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProject();
  }, [idProject]);

  const loadProject = async () => {
    try {
      const data = await projectService.findProjectById(idProject);
      setProject(data);
    } catch {
      Alert.alert('Error', 'No se pudo cargar el proyecto.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <ActivityIndicator size="large" color="#388E3C" style={styles.loader} />;
  }

  if (!project) {
    return <Text style={styles.errorText}>Proyecto no encontrado.</Text>;
  }

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.title}>{project.projectName}</Text>
        <Text style={styles.description}>{project.projectDescription}</Text>

        <View style={styles.infoRow}>
          <Text style={styles.label}>Tipo:</Text>
          <Text style={styles.value}>{project.projectType}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.label}>Ubicación:</Text>
          <Text style={styles.value}>{project.cityName}, {project.provinceName}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.label}>Inicio:</Text>
          <Text style={styles.value}>{project.startDate}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.label}>Fin:</Text>
          <Text style={styles.value}>{project.endDate}</Text>
        </View>
      </View>

      <View style={styles.actions}>
        <TouchableOpacity
          style={styles.registerButton}
          onPress={() =>
            navigation.navigate('CreateTree', {
              idProject,
              idTree: 0,
              projectType: project.projectType,
            })
          }
        >
          <Text style={styles.actionText}>Registrar Arbol</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() =>
            navigation.navigate('ListTrees', {
              idProject,
              projectType: project.projectType,
            })
          }
        >
          <Text style={styles.actionText}>Ver Arboles del Proyecto</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5', padding: 16 },
  loader: { flex: 1, justifyContent: 'center' },
  errorText: { textAlign: 'center', marginTop: 40, color: '#888', fontSize: 16 },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    elevation: 3,
  },
  title: { fontSize: 22, fontWeight: 'bold', color: '#333', marginBottom: 8 },
  description: { fontSize: 15, color: '#666', marginBottom: 16 },
  infoRow: { flexDirection: 'row', marginBottom: 6 },
  label: { fontWeight: 'bold', color: '#555', width: 90 },
  value: { color: '#333', flex: 1 },
  actions: { marginTop: 20, gap: 12 },
  registerButton: {
    backgroundColor: '#1976D2',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  actionButton: {
    backgroundColor: '#388E3C',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  actionText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
});
