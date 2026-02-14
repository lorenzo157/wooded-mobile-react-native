import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TextInput,
  StyleSheet,
  ActivityIndicator,
  Alert,
  TouchableOpacity,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/AppNavigator';
import { treeService } from '../../services/tree.service';
import { SimplyReadTreeDto } from '../../types/tree.types';

type Props = NativeStackScreenProps<RootStackParamList, 'ListTrees'>;

export default function ListTreesScreen({ route, navigation }: Props) {
  const { idProject, projectType } = route.params;
  const [trees, setTrees] = useState<SimplyReadTreeDto[]>([]);
  const [filter, setFilter] = useState('');
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      loadTrees();
    }, [idProject])
  );

  const loadTrees = async () => {
    setLoading(true);
    try {
      const data = await treeService.getTreesByProjectId(idProject);
      setTrees(data);
    } catch {
      Alert.alert('Error', 'No se pudieron cargar los árboles.');
    } finally {
      setLoading(false);
    }
  };

  const filteredTrees = trees.filter((t) =>
    t.idTree.toString().includes(filter)
  );

  const getRiskColor = (risk: number | null) => {
    if (risk === null) return '#888';
    if (risk <= 1) return '#4CAF50';
    if (risk <= 2) return '#FFC107';
    if (risk <= 3) return '#FF9800';
    return '#f44336';
  };

  const renderTree = ({ item }: { item: SimplyReadTreeDto }) => (
    <TouchableOpacity
      style={styles.treeCard}
      onPress={() => navigation.navigate('DetailTree', { idTree: item.idTree, idProject, projectType })}
    >
      <View style={styles.treeHeader}>
        <Text style={styles.treeId}>#{item.idTree}</Text>
        <View style={[styles.riskBadge, { backgroundColor: getRiskColor(item.risk) }]}>
          <Text style={styles.riskText}>Riesgo: {item.risk ?? '-'}</Text>
        </View>
      </View>
      <Text style={styles.treeAddress}>{item.address}</Text>
      {item.treeValue && (
        <Text style={styles.treeValue}>Valor: {item.treeValue}</Text>
      )}
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <TextInput
        style={styles.searchInput}
        placeholder="Filtrar por ID..."
        keyboardType="numeric"
        value={filter}
        onChangeText={setFilter}
      />

      {loading ? (
        <ActivityIndicator size="large" color="#388E3C" style={styles.loader} />
      ) : (
        <FlatList
          data={filteredTrees}
          keyExtractor={(item) => item.idTree.toString()}
          renderItem={renderTree}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <Text style={styles.emptyText}>No se encontraron árboles.</Text>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  searchInput: {
    backgroundColor: '#fff',
    margin: 12,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    elevation: 2,
  },
  loader: { marginTop: 40 },
  list: { padding: 12 },
  treeCard: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 14,
    marginBottom: 10,
    elevation: 2,
  },
  treeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  treeId: { fontSize: 16, fontWeight: 'bold', color: '#333' },
  riskBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  riskText: { color: '#fff', fontSize: 12, fontWeight: 'bold' },
  treeAddress: { fontSize: 14, color: '#555' },
  treeValue: { fontSize: 13, color: '#888', marginTop: 4 },
  emptyText: { textAlign: 'center', color: '#888', marginTop: 40, fontSize: 15 },
});
