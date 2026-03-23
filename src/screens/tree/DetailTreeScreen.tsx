import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Image,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/AppNavigator';
import { treeService } from '../../services/tree.service';
import { ReadTreeDto, ReadDefectTreeDto } from '../../types/tree.types';
import { API } from '../../constants/API';

type Props = NativeStackScreenProps<RootStackParamList, 'DetailTree'>;

function InfoRow({ label, value }: { label: string; value: string | number | null | undefined }) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value ?? 'N/A'}</Text>
    </View>
  );
}

function SectionHeader({ title, color }: { title: string; color: string }) {
  return (
    <View style={[styles.sectionHeader, { backgroundColor: color }]}>
      <Text style={styles.sectionHeaderText}>{title}</Text>
    </View>
  );
}

function DefectList({ defects, zone }: { defects: ReadDefectTreeDto[]; zone: string }) {
  if (defects.length === 0) return null;
  return (
    <View style={styles.defectList}>
      {defects.map((defect, index) => (
        <View key={index} style={styles.defectItem}>
          <Text style={styles.defectName}>{defect.defectName}</Text>
          <Text style={styles.defectDesc}>{defect.textDefectValue}</Text>
          <Text style={styles.defectSeverity}>Severidad: {defect.defectValue}</Text>
          {defect.branches != null && (
            <Text style={styles.defectBranches}>
              {zone === 'tronco' &&
              (defect.defectName === 'pudricion de madera en tronco' ||
                defect.defectName === 'cavidades en tronco')
                ? `Valor de t medido: ${defect.branches}cm`
                : zone === 'tronco'
                ? `Perimetro afectado medido: ${defect.branches}cm`
                : `Ramas afectadas: ${defect.branches}`}
            </Text>
          )}
        </View>
      ))}
    </View>
  );
}

function ListItems({ label, items }: { label: string; items: string[] }) {
  if (!items || items.length === 0) return null;
  return (
    <View style={styles.listContainer}>
      <Text style={styles.infoLabel}>{label}</Text>
      {items.map((item, i) => (
        <Text key={i} style={styles.listItem}>- {item}</Text>
      ))}
    </View>
  );
}

function fixPhotoUrl(url: string): string {
  return url.replace(/http:\/\/localhost:\d+/, API);
}

export default function DetailTreeScreen({ route, navigation }: Props) {
  const { idTree, idProject, projectType } = route.params;
  const [tree, setTree] = useState<ReadTreeDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [photoError, setPhotoError] = useState(false);

  useEffect(() => {
    setPhotoError(false);
    loadTree();
  }, [idTree]);

  const loadTree = async () => {
    try {
      const data = await treeService.getTreeById(idTree);
      data.perimeter = Number(Number(data.perimeter).toFixed(2));
      data.height = Number(Number(data.height).toFixed(2));
      data.incline = Number(Number(data.incline).toFixed(2));
      setTree(data);
    } catch {
      Alert.alert('Error', 'No se pudo cargar el arbol.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <ActivityIndicator size="large" color="#388E3C" style={{ flex: 1 }} />;
  if (!tree) return <Text style={{ textAlign: 'center', marginTop: 40 }}>Arbol no encontrado.</Text>;

  const defectRoots = tree.readDefectDto.filter((d) => d.defectZone === 'raiz');
  const defectTrunk = tree.readDefectDto.filter((d) => d.defectZone === 'tronco');
  const defectBranches = tree.readDefectDto.filter((d) => d.defectZone === 'rama');

  return (
    <ScrollView style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.title}>ID: {tree.idTree}</Text>
        <Text style={styles.subtitle}>{tree.address}</Text>

        {tree.pathPhoto && !photoError ? (
          <Image
            source={{ uri: fixPhotoUrl(tree.pathPhoto) }}
            style={styles.photo}
            resizeMode="contain"
            onError={() => setPhotoError(true)}
          />
        ) : (
          <View style={styles.noPhoto}>
            <Text style={styles.noPhotoText}>Sin foto</Text>
          </View>
        )}

        <InfoRow label="Nivel de riesgo:" value={tree.risk || 'N/A'} />
        <InfoRow label="Fecha de relevo:" value={tree.datetime ? new Date(tree.datetime).toLocaleDateString('es-AR') : 'N/A'} />
        <InfoRow label="Tiempo de relevo:" value={tree.treeInfoCollectionTime || 'N/A'} />

        {/* Ubicacion */}
        <SectionHeader title="Ubicacion" color="#1976D2" />
        {projectType?.toLowerCase() === 'muestreo' && !tree.neighborhoodName ? (
          <View style={styles.neighborhoodWarning}>
            <Text style={styles.neighborhoodWarningText}>⚠️ Sin barrio asignado</Text>
          </View>
        ) : (
          <InfoRow label="Barrio:" value={tree.neighborhoodName || 'N/A'} />
        )}
        {tree.cityBlock ? <InfoRow label="Manzana:" value={tree.cityBlock} /> : null}
        <InfoRow label="Latitud:" value={tree.latitude || 'N/A'} />
        <InfoRow label="Longitud:" value={tree.longitude || 'N/A'} />
        {tree.treesInTheBlock ? <InfoRow label="Arboles en la cuadra:" value={tree.treesInTheBlock} /> : null}

        {/* Caracteristicas */}
        <SectionHeader title="Caracteristicas del arbol" color="#388E3C" />
        {tree.isMissing && <InfoRow label="Es arbol faltante?" value="Si" />}
        {tree.isDead && <InfoRow label="Esta muerto?" value="Si" />}

        {!tree.isMissing && !tree.isDead && (
          <>
            <InfoRow label="Tipo de arbol:" value={tree.treeTypeName || 'N/A'} />
            {tree.gender && <InfoRow label="Genero:" value={tree.gender} />}
            {tree.species && <InfoRow label="Especie:" value={tree.species} />}
            {tree.scientificName && <InfoRow label="Nombre cientifico:" value={tree.scientificName} />}
            <InfoRow label="Perimetro:" value={`${tree.perimeter || 'N/A'} cm`} />
            <InfoRow label="Altura:" value={`${tree.height || 'N/A'} m`} />
            <InfoRow label="Inclinacion:" value={`${tree.incline || 'N/A'} grados`} />

            <ListItems label="Enfermedades:" items={tree.diseasesNames} />
            <ListItems label="Plagas:" items={tree.pestsNames} />
            <InfoRow label="Valor del arbol:" value={tree.treeValue || 'N/A'} />

            {/* Factores de carga */}
            <SectionHeader title="Factores de carga" color="#F9A825" />
            <InfoRow label="Exposicion al viento:" value={tree.windExposure || 'N/A'} />
            <InfoRow label="Vigor:" value={tree.vigor || 'N/A'} />
            <InfoRow label="Densidad de copa:" value={tree.canopyDensity || 'N/A'} />

            {/* Condiciones del sitio */}
            <SectionHeader title="Condiciones del sitio" color="#7B1FA2" />
            <ListItems label="Conflictos:" items={tree.conflictsNames} />
            <InfoRow label="Raices expuestas:" value={tree.exposedRoots ? 'Si' : 'No'} />
            <InfoRow label="Espacio de crecimiento:" value={tree.growthSpace || 'N/A'} />

            {/* Blanco debajo del arbol */}
            <SectionHeader title="Blanco debajo del arbol" color="#D32F2F" />
            <InfoRow label="Que hay bajo el arbol:" value={tree.useUnderTheTree || 'N/A'} />
            {tree.useUnderTheTree && (
              <>
                <InfoRow label="Frecuencia:" value={tree.frequencyUse || 'N/A'} />
                <InfoRow label="Se puede mover:" value={tree.isMovable ? 'Si' : 'No'} />
                <InfoRow label="Se puede restringir:" value={tree.isRestrictable ? 'Si' : 'No'} />
              </>
            )}

            {/* Defectos */}
            <SectionHeader title="Defectos en raices" color="#E65100" />
            <DefectList defects={defectRoots} zone="raiz" />

            <SectionHeader title="Defectos en tronco o cuello" color="#E65100" />
            <DefectList defects={defectTrunk} zone="tronco" />

            <SectionHeader title="Defectos en ramas" color="#E65100" />
            <DefectList defects={defectBranches} zone="rama" />
          </>
        )}

        {/* Intervenciones */}
        <SectionHeader title="Intervenciones" color="#616161" />
        <InfoRow label="Potencial de dano:" value={tree.potentialDamage || 'N/A'} />
        <ListItems label="Intervenciones a aplicar:" items={tree.interventionsNames} />
      </View>

      {/* Action buttons */}
      <View style={styles.actions}>
        <TouchableOpacity
          style={styles.updateButton}
          onPress={() => navigation.navigate('CreateTree', { idProject, idTree, projectType })}
        >
          <Text style={styles.buttonText}>Actualizar arbol</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.createButton}
          onPress={() => navigation.navigate('CreateTree', { idProject, idTree: 0, projectType })}
        >
          <Text style={styles.buttonText}>Registrar nuevo arbol</Text>
        </TouchableOpacity>
      </View>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  card: { backgroundColor: '#fff', margin: 12, borderRadius: 12, padding: 16, elevation: 3 },
  title: { fontSize: 22, fontWeight: 'bold', color: '#333' },
  subtitle: { fontSize: 15, color: '#666', marginBottom: 12 },
  photo: { width: '100%', height: 300, borderRadius: 8, marginBottom: 12 },
  noPhoto: { width: '100%', height: 200, borderRadius: 8, marginBottom: 12, backgroundColor: '#f0f0f0', alignItems: 'center', justifyContent: 'center' },
  noPhotoText: { color: '#999', fontSize: 16, fontStyle: 'italic' },
  infoRow: { flexDirection: 'row', paddingVertical: 6, borderBottomWidth: 0.5, borderBottomColor: '#eee' },
  infoLabel: { fontWeight: 'bold', color: '#555', width: 140 },
  infoValue: { color: '#333', flex: 1 },
  sectionHeader: { paddingVertical: 8, paddingHorizontal: 12, borderRadius: 6, marginTop: 16, marginBottom: 8 },
  sectionHeaderText: { color: '#fff', fontWeight: 'bold', fontSize: 15 },
  defectList: { marginLeft: 8 },
  defectItem: { marginBottom: 10, paddingLeft: 8, borderLeftWidth: 3, borderLeftColor: '#E65100' },
  defectName: { fontWeight: 'bold', color: '#333' },
  defectDesc: { color: '#666', fontSize: 13 },
  defectSeverity: { color: '#888', fontSize: 12 },
  defectBranches: { color: '#888', fontSize: 12 },
  listContainer: { paddingVertical: 6 },
  listItem: { color: '#555', marginLeft: 12, fontSize: 14 },
  actions: { padding: 12, gap: 10 },
  updateButton: { backgroundColor: '#1976D2', paddingVertical: 14, borderRadius: 10, alignItems: 'center' },
  createButton: { backgroundColor: '#388E3C', paddingVertical: 14, borderRadius: 10, alignItems: 'center' },
  buttonText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  neighborhoodWarning: { paddingVertical: 8, paddingHorizontal: 4, marginBottom: 4 },
  neighborhoodWarningText: { fontSize: 14, color: '#E65100', fontWeight: 'bold' },
});
