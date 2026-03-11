import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/AppNavigator';
import { projectService } from '../../services/project.service';
import { authService } from '../../services/auth.service';
import { ProjectDto } from '../../types/project.types';
import { User } from '../../types/auth.types';

type Props = NativeStackScreenProps<RootStackParamList, 'ListProjects'>;

export default function ListProjectsScreen({ navigation }: Props) {
  const [projects, setProjects] = useState<ProjectDto[]>([]);
  const [filter, setFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    authService.getUser().then(setUser);
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadProjects();
    }, [])
  );

  const loadProjects = async () => {
    setLoading(true);
    try {
      const data = await projectService.getAssignedProjects();
      setProjects(data);
    } catch (error) {
      Alert.alert('Error', 'No se pudieron cargar los proyectos.');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await authService.logout();
    navigation.replace('Login');
  };

  const filteredProjects = projects.filter((p) =>
    p.projectName.toLowerCase().includes(filter.toLowerCase())
  );

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '—';
    const d = new Date(dateStr);
    return d.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' });
  };

  const renderProject = ({ item }: { item: ProjectDto }) => (
    <TouchableOpacity
      style={styles.projectCard}
      onPress={() => navigation.navigate('DetailProject', { idProject: item.idProject })}
    >
      <Text style={styles.projectName}>{item.projectName}</Text>
      {item.projectDescription ? (
        <Text style={styles.projectDescription}>{item.projectDescription}</Text>
      ) : null}
      <View style={styles.projectMeta}>
        <View style={styles.projectMetaRow}>
          <Text style={styles.metaLabel}>Tipo</Text>
          <Text style={styles.metaValue}>{item.projectType || '—'}</Text>
        </View>
        <View style={styles.projectMetaRow}>
          <Text style={styles.metaLabel}>Ubicación</Text>
          <Text style={styles.metaValue}>{item.cityName}, {item.provinceName}</Text>
        </View>
        <View style={styles.projectMetaRow}>
          <Text style={styles.metaLabel}>Inicio</Text>
          <Text style={styles.metaValue}>{formatDate(item.startDate)}</Text>
        </View>
        <View style={styles.projectMetaRow}>
          <Text style={styles.metaLabel}>Fin</Text>
          <Text style={styles.metaValue}>{formatDate(item.endDate)}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {user && (
        <View style={styles.welcomeBar}>
          <Text style={styles.welcomeText}>Hola, {user.firstName || user.email}</Text>
        </View>
      )}
      <View style={styles.header}>
        <TextInput
          style={styles.searchInput}
          placeholder="Buscar proyecto..."
          value={filter}
          onChangeText={setFilter}
        />
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Text style={styles.logoutText}>Salir</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#388E3C" style={styles.loader} />
      ) : (
        <FlatList
          data={filteredProjects}
          keyExtractor={(item) => item.idProject.toString()}
          renderItem={renderProject}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <Text style={styles.emptyText}>No se encontraron proyectos.</Text>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  welcomeBar: { backgroundColor: '#388E3C', paddingVertical: 10, paddingHorizontal: 16 },
  welcomeText: { color: '#fff', fontSize: 15, fontWeight: '600' },
  header: {
    flexDirection: 'row',
    padding: 12,
    gap: 8,
    alignItems: 'center',
  },
  searchInput: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    elevation: 2,
  },
  logoutButton: {
    backgroundColor: '#d32f2f',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
  },
  logoutText: { color: '#fff', fontWeight: 'bold' },
  loader: { marginTop: 40 },
  list: { padding: 12 },
  projectCard: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
  },
  projectName: { fontSize: 17, fontWeight: 'bold', color: '#333' },
  projectDescription: { fontSize: 14, color: '#666', marginTop: 4, marginBottom: 8 },
  projectMeta: { marginTop: 8, gap: 4 },
  projectMetaRow: { flexDirection: 'row', justifyContent: 'space-between' },
  metaLabel: { fontSize: 13, color: '#888', flex: 1 },
  metaValue: { fontSize: 13, color: '#444', fontWeight: '500', flex: 2, textAlign: 'right' },
  emptyText: { textAlign: 'center', color: '#888', marginTop: 40, fontSize: 15 },
});
