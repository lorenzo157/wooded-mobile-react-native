import React, {
  useState,
  useEffect,
  useCallback,
  useRef,
  useMemo,
} from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Switch,
  StyleSheet,
  Alert,
  ActivityIndicator,
  Image,
  FlatList,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import * as Location from "expo-location";
import * as ImagePicker from "expo-image-picker";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { RootStackParamList } from "../../navigation/AppNavigator";
import { treeService } from "../../services/tree.service";
import { CreateTreeDto, ReadDefectTreeDto } from "../../types/tree.types";
import {
  windExposureOptions,
  vigorOptions,
  canopyDensityOptions,
  growthSpaceOptions,
  treeValueOptions,
  frequencyUseOptions,
  potentialDamageOptions,
  conflictOptions,
  interventionOptions,
} from "../../constants/options-list";
import * as Defects from "../../constants/defects-text-level-list";
import SelectPicker from "../../components/SelectPicker";
import TiltMeasure from "../../components/TiltMeasure";
import HeightMeasure from "../../components/HeightMeasure";
import treeTypesData from "../../../assets/tree-types.json";

interface TreeType {
  name: string;
  genus: string;
}

type Props = NativeStackScreenProps<RootStackParamList, "CreateTree">;

// Helper to build options from defect map
function defectOptions(map: Defects.NumberToStringMap, nullLabel: string) {
  return [
    ...Object.entries(map).map(([k, v]) => ({ label: v, value: k })),
    { label: nullLabel, value: null },
  ];
}

function SectionHeader({
  title,
  icon,
  color,
}: {
  title: string;
  icon: string;
  color: string;
}) {
  return (
    <View style={[styles.sectionHeader, { backgroundColor: color }]}>
      <Text style={styles.sectionHeaderIcon}>{icon}</Text>
      <Text style={styles.sectionHeaderText}>{title}</Text>
    </View>
  );
}

function StyledSwitch({
  value,
  onValueChange,
}: {
  value: boolean;
  onValueChange: (v: boolean) => void;
}) {
  return (
    <Switch
      value={value}
      onValueChange={onValueChange}
      trackColor={{ false: "#ccc", true: "#81C784" }}
      thumbColor={value ? "#388E3C" : "#f4f3f4"}
    />
  );
}

function NestedGroup({ children }: { children: React.ReactNode }) {
  return <View style={styles.nestedGroup}>{children}</View>;
}

function FormField({
  label,
  children,
  row,
}: {
  label?: string;
  children: React.ReactNode;
  row?: boolean;
}) {
  if (row) {
    return (
      <View style={styles.formFieldRow}>
        {label ? <Text style={styles.fieldLabelRow}>{label}</Text> : null}
        {children}
      </View>
    );
  }
  return (
    <View style={styles.formField}>
      {label ? <Text style={styles.fieldLabel}>{label}</Text> : null}
      {children}
    </View>
  );
}

export default function CreateTreeScreen({ route, navigation }: Props) {
  const {
    idProject,
    idTree: routeIdTree,
    projectType: rawProjectType,
  } = route.params;
  const projectType = rawProjectType?.toLowerCase() ?? "";
  const idTree = routeIdTree === 0 ? null : routeIdTree;
  const isUpdate = idTree !== null;
  const operation = isUpdate ? "Actualizacion" : "Registracion";
  const treeInfoCollectionStartTime = useRef(new Date());

  const treeTypes: TreeType[] = treeTypesData as TreeType[];

  // Form state
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [currentPhoto, setCurrentPhoto] = useState<string | null>(null);

  // Location
  const [useGPS, setUseGPS] = useState(false);
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [address, setAddress] = useState("");
  const [cityBlock, setCityBlock] = useState("");

  // Tree characteristics
  const [isMissing, setIsMissing] = useState(false);
  const [isDead, setIsDead] = useState(false);
  const [treeTypeName, setTreeTypeName] = useState("");
  const [selectedTreeType, setSelectedTreeType] = useState<TreeType | null>(
    null,
  );
  const [filteredTreeTypes, setFilteredTreeTypes] = useState<TreeType[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [perimeter, setPerimeter] = useState("");
  const [height, setHeight] = useState("");
  const [incline, setIncline] = useState("");
  const [treeValue, setTreeValue] = useState<string | null>(null);
  const [treesInTheBlock, setTreesInTheBlock] = useState("");

  // Pests & diseases
  const [pestsNames, setPestsNames] = useState<string[]>([]);
  const [diseasesNames, setDiseasesNames] = useState<string[]>([]);

  // Load factors
  const [windExposure, setWindExposure] = useState<string | null>(null);
  const [vigor, setVigor] = useState<string | null>(null);
  const [canopyDensity, setCanopyDensity] = useState<string | null>(null);

  // Site conditions
  const [growthSpace, setGrowthSpace] = useState<string | null>(null);
  const [exposedRoots, setExposedRoots] = useState(false);
  const [conflictsNames, setConflictsNames] = useState<string[]>([]);

  // Target under tree
  const [nothingUnderTree, setNothingUnderTree] = useState(false);
  const [useUnderTheTree, setUseUnderTheTree] = useState("");
  const [frequencyUse, setFrequencyUse] = useState<number | null>(null);
  const [isMovable, setIsMovable] = useState(false);
  const [isRestrictable, setIsRestrictable] = useState(false);

  // Defects - roots
  const [fruitingBodiesRoots, setFruitingBodiesRoots] = useState<string | null>(
    null,
  );
  const [mechanicalDamageRoots, setMechanicalDamageRoots] = useState<
    string | null
  >(null);
  const [stranglingRoots, setStranglingRoots] = useState<string | null>(null);
  const [deadRoots, setDeadRoots] = useState<string | null>(null);
  const [symptomsDiseaseRoots, setSymptomsDiseaseRoots] = useState<
    string | null
  >(null);

  // Defects - trunk
  const [gallsTermites, setGallsTermites] = useState<string | null>(null);
  const [cankersTrunk, setCankersTrunk] = useState<string | null>(null);
  const [isCavitiesTrunk, setIsCavitiesTrunk] = useState(false);
  const [cavitiesTrunkT, setCavitiesTrunkT] = useState("");
  const [isLostOrDeadBark, setIsLostOrDeadBark] = useState(false);
  const [lostOrDeadBarkWidth, setLostOrDeadBarkWidth] = useState("");
  const [multipleTrunks, setMultipleTrunks] = useState<string | null>(null);
  const [isWounds, setIsWounds] = useState(false);
  const [woundsWidth, setWoundsWidth] = useState("");
  const [forkTrunk, setForkTrunk] = useState<string | null>(null);
  const [isWoodRot, setIsWoodRot] = useState(false);
  const [isWoodRotFruitingBodies, setIsWoodRotFruitingBodies] = useState(false);
  const [woodRotT, setWoodRotT] = useState("");
  const [fissuresTrunk, setFissuresTrunk] = useState<string | null>(null);

  // Defects - branches
  const [cankersBranch, setCankersBranch] = useState<string | null>(null);
  const [cavitiesBranches, setCavitiesBranches] = useState<string | null>(null);
  const [fruitingBodiesBranch, setFruitingBodiesBranch] = useState<
    string | null
  >(null);
  const [forkBranch, setForkBranch] = useState<string | null>(null);
  const [hangingBranches, setHangingBranches] = useState<string | null>(null);
  const [hangingBranchesCount, setHangingBranchesCount] = useState("");
  const [deadBranches, setDeadBranches] = useState<string | null>(null);
  const [deadBranchesCount, setDeadBranchesCount] = useState("");
  const [overExtendedBranches, setOverExtendedBranches] = useState<
    string | null
  >(null);
  const [fissuresBranches, setFissuresBranches] = useState<string | null>(null);
  const [woodRotBranch, setWoodRotBranch] = useState<string | null>(null);
  const [electricalGrid, setElectricalGrid] = useState<string | null>(null);

  // Interventions
  const [potentialDamage, setPotentialDamage] = useState<number | null>(null);
  const [interventionsNames, setInterventionsNames] = useState<string[]>([]);

  // Warn before leaving with unsaved data
  useEffect(() => {
    const unsubscribe = navigation.addListener("beforeRemove", (e) => {
      if (submitting) return;
      e.preventDefault();
      Alert.alert(
        "Descartar cambios",
        "Si volvés atrás perderás toda la información cargada hasta el momento. ¿Deseás continuar?",
        [
          { text: "Cancelar", style: "cancel" },
          {
            text: "Salir",
            style: "destructive",
            onPress: () => navigation.dispatch(e.data.action),
          },
        ],
      );
    });
    return unsubscribe;
  }, [navigation, submitting]);

  // Load existing tree data if editing
  useEffect(() => {
    if (idTree) {
      loadExistingTree();
    }
  }, [idTree]);

  const loadExistingTree = async () => {
    if (!idTree) return;
    setLoading(true);
    try {
      const tree = await treeService.getTreeById(idTree);
      setAddress(tree.address);
      setLatitude(tree.latitude ? +tree.latitude : null);
      setLongitude(tree.longitude ? +tree.longitude : null);
      setUseGPS(!!(tree.latitude && tree.longitude));
      setCityBlock(tree.cityBlock ? String(tree.cityBlock) : "");
      setIsMissing(tree.isMissing);
      setIsDead(tree.isDead);
      setTreeTypeName(tree.treeTypeName || "");
      setPerimeter(tree.perimeter ? String(+tree.perimeter) : "");
      setHeight(tree.height ? String(+tree.height) : "");
      setIncline(tree.incline ? String(+tree.incline) : "");
      setTreeValue(tree.treeValue || null);
      setTreesInTheBlock(
        tree.treesInTheBlock ? String(tree.treesInTheBlock) : "",
      );
      setWindExposure(tree.windExposure || null);
      setVigor(tree.vigor || null);
      setCanopyDensity(tree.canopyDensity || null);
      setGrowthSpace(tree.growthSpace || null);
      setExposedRoots(tree.exposedRoots);
      setConflictsNames(tree.conflictsNames || []);
      setNothingUnderTree(!tree.useUnderTheTree);
      setUseUnderTheTree(tree.useUnderTheTree || "");
      setFrequencyUse(tree.frequencyUse ? +tree.frequencyUse : null);
      setPotentialDamage(tree.potentialDamage ? +tree.potentialDamage : null);
      setIsMovable(tree.isMovable);
      setIsRestrictable(tree.isRestrictable);
      setDiseasesNames(tree.diseasesNames || []);
      setPestsNames(tree.pestsNames || []);
      setInterventionsNames(tree.interventionsNames || []);
      setCurrentPhoto(tree.pathPhoto || null);

      if (tree.treeTypeName) {
        const found = treeTypes.find(
          (t) => t.name.toLowerCase() === tree.treeTypeName?.toLowerCase(),
        );
        if (found) setSelectedTreeType(found);
      }

      // Populate defects
      populateDefects(tree.readDefectDto);
    } catch {
      Alert.alert("Error", "No se pudo cargar los datos del arbol.");
    } finally {
      setLoading(false);
    }
  };

  const populateDefects = (defects: ReadDefectTreeDto[]) => {
    const defectMappings: Record<
      string,
      (val: string, branches?: number) => void
    > = {
      "cuerpos fructiferos de hongos en raices": (v) =>
        setFruitingBodiesRoots(v),
      "daño mecanico a raices": (v) => setMechanicalDamageRoots(v),
      "raices estrangulantes": (v) => setStranglingRoots(v),
      "raices muertas": (v) => setDeadRoots(v),
      "sintomas de enfermedad radicular en copa": (v) =>
        setSymptomsDiseaseRoots(v),
      "agallas, termiteros, hormigueros": (v) => setGallsTermites(v),
      "cancros de tronco": (v) => setCankersTrunk(v),
      "fustes miltiples": (v) => setMultipleTrunks(v),
      "horqueta de tronco": (v) => setForkTrunk(v),
      "rajaduras de tronco": (v) => setFissuresTrunk(v),
      "cancros de rama": (v) => setCankersBranch(v),
      "cavidades de rama": (v) => setCavitiesBranches(v),
      "cuerpos fructiferos de hongos en rama": (v) =>
        setFruitingBodiesBranch(v),
      "horqueta de rama": (v) => setForkBranch(v),
      "ramas colgantes o quebradas": (v, b) => {
        setHangingBranches(v);
        if (b) setHangingBranchesCount(String(b));
      },
      "ramas muertas": (v, b) => {
        setDeadBranches(v);
        if (b) setDeadBranchesCount(String(b));
      },
      "ramas sobre extendidas": (v) => setOverExtendedBranches(v),
      "rajaduras de rama": (v) => setFissuresBranches(v),
      "pudricion de madera en rama": (v) => setWoodRotBranch(v),
      "interferencia con red electrica": (v) => setElectricalGrid(v),
    };

    defects.forEach((defect) => {
      const setter = defectMappings[defect.defectName];
      if (setter) setter(String(defect.defectValue), defect.branches);

      if (defect.defectName === "cavidades en tronco") {
        setIsCavitiesTrunk(true);
        if (defect.branches) setCavitiesTrunkT(String(defect.branches));
      }
      if (defect.defectName === "corteza perdida o muerta") {
        setIsLostOrDeadBark(true);
        if (defect.branches) setLostOrDeadBarkWidth(String(defect.branches));
      }
      if (defect.defectName === "heridas de tronco") {
        setIsWounds(true);
        if (defect.branches) setWoundsWidth(String(defect.branches));
      }
      if (defect.defectName === "pudricion de madera en tronco") {
        setIsWoodRot(true);
        if (defect.textDefectValue === "presencia de cuerpos fructiferos") {
          setIsWoodRotFruitingBodies(true);
        } else if (defect.branches) {
          setWoodRotT(String(defect.branches));
        }
      }
    });
  };

  // Tree type autocomplete
  const onTreeTypeChange = (text: string) => {
    setTreeTypeName(text);
    setSelectedTreeType(null);
    if (text.trim().length > 0) {
      const filter = text.toLowerCase();
      const exact = treeTypes.find((t) => t.name.toLowerCase() === filter);
      if (exact) {
        setFilteredTreeTypes([]);
        setShowSuggestions(false);
      } else {
        const filtered = treeTypes
          .filter((t) => t.name.toLowerCase().includes(filter))
          .slice(0, 10);
        setFilteredTreeTypes(filtered);
        setShowSuggestions(filtered.length > 0);
      }
    } else {
      setFilteredTreeTypes([]);
      setShowSuggestions(false);
    }
  };

  const onSelectTreeType = (tt: TreeType) => {
    setTreeTypeName(tt.name);
    setSelectedTreeType(tt);
    setShowSuggestions(false);
    setFilteredTreeTypes([]);
  };

  // GPS
  const getLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Error", "Permiso de ubicacion denegado");
        return;
      }
      const pos = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });
      setLatitude(pos.coords.latitude);
      setLongitude(pos.coords.longitude);

      // Reverse geocode
      const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${pos.coords.latitude}&lon=${pos.coords.longitude}&addressdetails=1`;
      try {
        const resp = await fetch(url, {
          headers: { "User-Agent": "YviraApp/1.0" },
        });
        const data = await resp.json();
        if (data?.display_name) setAddress(data.display_name);
      } catch (e) {
        console.warn("Reverse geocoding failed:", e);
      }
    } catch (error: any) {
      Alert.alert("Error", error?.message || "Error de geolocalizacion");
    }
  };

  const onToggleGPS = (val: boolean) => {
    setUseGPS(val);
    if (val) {
      getLocation();
    } else {
      setLatitude(null);
      setLongitude(null);
    }
  };

  // Camera
  const takePhoto = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Error", "Permiso de camara denegado");
        return;
      }
      const result = await ImagePicker.launchCameraAsync({
        quality: 0.5,
        base64: true,
        allowsEditing: false,
      });
      if (!result.canceled && result.assets[0]) {
        setImageUri(result.assets[0].uri);
      }
    } catch {}
  };

  // Dynamic lists
  const addPest = () => setPestsNames([...pestsNames, ""]);
  const removePest = (i: number) =>
    setPestsNames(pestsNames.filter((_, idx) => idx !== i));
  const updatePest = (i: number, v: string) => {
    const copy = [...pestsNames];
    copy[i] = v;
    setPestsNames(copy);
  };

  const addDisease = () => setDiseasesNames([...diseasesNames, ""]);
  const removeDisease = (i: number) =>
    setDiseasesNames(diseasesNames.filter((_, idx) => idx !== i));
  const updateDisease = (i: number, v: string) => {
    const copy = [...diseasesNames];
    copy[i] = v;
    setDiseasesNames(copy);
  };

  // Validation
  const getMissingFields = (): string[] => {
    const missing: string[] = [];
    if (!address) missing.push("Dirección");
    if (latitude == null || longitude == null) missing.push("Ubicación (GPS)");
    if (projectType === "muestreo" && !treesInTheBlock)
      missing.push("Árboles en la cuadra");
    if (isMissing || isDead) return missing;

    if (!perimeter) missing.push("Perímetro");
    if (!height) missing.push("Altura");
    if (!incline) missing.push("Inclinación");
    if (!windExposure) missing.push("Exposición al viento");
    if (!vigor) missing.push("Vigor");
    if (!canopyDensity) missing.push("Densidad de copa");
    if (!growthSpace) missing.push("Espacio de crecimiento");
    if (!treeTypeName) missing.push("Tipo de árbol");
    if (potentialDamage == null) missing.push("Potencial de daño al caerse");
    if (!nothingUnderTree && !useUnderTheTree)
      missing.push("Uso debajo del árbol");
    if (!nothingUnderTree && frequencyUse == null)
      missing.push("Frecuencia de uso");
    if (projectType !== "muestreo" && !treeValue)
      missing.push("Valor del árbol");

    return missing;
  };

  // Submit
  const onSubmit = async () => {
    const missing = getMissingFields();
    if (missing.length > 0) {
      Alert.alert(
        "Campos incompletos",
        `Falta completar:\n• ${missing.join("\n• ")}`,
      );
      return;
    }

    const showInterventionWarning =
      interventionsNames.length === 0 && !isMissing && !isDead;
    const message = showInterventionWarning
      ? `Desea finalizar la ${operation} del arbol?\n\n⚠️ No se han seleccionado intervenciones.`
      : `Desea finalizar la ${operation} del arbol?`;

    Alert.alert(operation, message, [
      { text: "Cancelar", style: "cancel" },
      { text: "Confirmar", onPress: submitTree },
    ]);
  };

  const submitTree = async () => {
    setSubmitting(true);
    try {
      const newTree: CreateTreeDto = {
        isMissing,
        isDead,
        projectId: idProject,
        cityBlock: cityBlock ? Number(cityBlock) : null,
        address,
        latitude: latitude!,
        longitude: longitude!,
        treesInTheBlock: treesInTheBlock ? Number(treesInTheBlock) : null,
        treeInfoCollectionStartTime: treeInfoCollectionStartTime.current,
        createDefectsDtos: [],
      };

      if (isMissing || isDead) {
        newTree.interventionsNames = isMissing
          ? ["plantacion de arbol faltante"]
          : ["extraccion del arbol"];
      } else {
        newTree.risk = 0;
        const perimeterNum = Number(perimeter);
        const heightNum = Number(height);
        const inclineNum = Number(incline);
        const dch = perimeterNum / Math.PI / 100;

        newTree.perimeter = perimeterNum;
        newTree.dch = dch || null;
        newTree.height = heightNum;
        newTree.incline = inclineNum;
        newTree.useUnderTheTree = nothingUnderTree ? null : useUnderTheTree;
        newTree.frequencyUse = frequencyUse;
        newTree.potentialDamage = potentialDamage;
        newTree.isMovable = isMovable;
        newTree.isRestrictable = isRestrictable;
        newTree.exposedRoots = exposedRoots;
        newTree.windExposure = windExposure;
        newTree.vigor = vigor;
        newTree.canopyDensity = canopyDensity;
        newTree.growthSpace = growthSpace;
        newTree.treeValue = treeValue;
        newTree.treeTypeName = treeTypeName.toLowerCase();
        newTree.gender =
          selectedTreeType?.genus ||
          treeTypes.find(
            (t) => t.name.toLowerCase() === treeTypeName.toLowerCase(),
          )?.genus;
        newTree.conflictsNames = conflictsNames;
        newTree.pestsNames = pestsNames.filter(Boolean);
        newTree.diseasesNames = diseasesNames.filter(Boolean);
        newTree.interventionsNames = interventionsNames;
        newTree.createDefectsDtos = [];

        // Build defects
        const addDefect = (
          name: string,
          val: string | null,
          map: Defects.NumberToStringMap,
          branches?: number,
        ) => {
          const v = Number(val);
          if (v > 1) {
            newTree.createDefectsDtos.push({
              defectName: name,
              defectValue: v,
              textDefectValue: map[v],
              ...(branches !== undefined && { branches }),
            });
          }
        };

        addDefect(
          "cuerpos fructiferos de hongos en raices",
          fruitingBodiesRoots,
          Defects.fruitingBodiesOfFungiOnNeckOrRoots,
        );
        addDefect(
          "daño mecanico a raices",
          mechanicalDamageRoots,
          Defects.mechanicalDamageToRoots,
        );
        addDefect(
          "raices estrangulantes",
          stranglingRoots,
          Defects.stranglingRoots,
        );
        addDefect("raices muertas", deadRoots, Defects.deadRoots);
        addDefect(
          "sintomas de enfermedad radicular en copa",
          symptomsDiseaseRoots,
          Defects.symptomsDiseaseOfRootsInCrown,
        );
        addDefect(
          "agallas, termiteros, hormigueros",
          gallsTermites,
          Defects.gallsTermiteMoundsAnthills,
        );
        addDefect("cancros de tronco", cankersTrunk, Defects.cankersTrunk);
        addDefect("fustes miltiples", multipleTrunks, Defects.multipleTrunks);
        addDefect("horqueta de tronco", forkTrunk, Defects.forkTrunk);
        addDefect("rajaduras de tronco", fissuresTrunk, Defects.fissuresTrunk);
        addDefect("cancros de rama", cankersBranch, Defects.cankersBranch);
        addDefect(
          "cavidades de rama",
          cavitiesBranches,
          Defects.cavitiesBranches,
        );
        addDefect(
          "cuerpos fructiferos de hongos en rama",
          fruitingBodiesBranch,
          Defects.fruitingBodiesOfFungi,
        );
        addDefect("horqueta de rama", forkBranch, Defects.forkBranch);
        addDefect(
          "ramas colgantes o quebradas",
          hangingBranches,
          Defects.hangingOrBrokenBranches,
          hangingBranchesCount ? Number(hangingBranchesCount) : undefined,
        );
        addDefect(
          "ramas muertas",
          deadBranches,
          Defects.deadBranches,
          deadBranchesCount ? Number(deadBranchesCount) : undefined,
        );
        addDefect(
          "ramas sobre extendidas",
          overExtendedBranches,
          Defects.overExtendedBranches,
        );
        addDefect(
          "rajaduras de rama",
          fissuresBranches,
          Defects.fissuresBranches,
        );
        addDefect(
          "pudricion de madera en rama",
          woodRotBranch,
          Defects.woodRot,
        );
        addDefect(
          "interferencia con red electrica",
          electricalGrid,
          Defects.interferenceWithTheElectricalGrid,
        );

        // Cavities trunk calculation
        if (isCavitiesTrunk && cavitiesTrunkT && perimeterNum) {
          const tr = Number(cavitiesTrunkT) / (perimeterNum / 2 / Math.PI);
          let dv = 1;
          if (tr < 0.15) dv = 4;
          else if (tr < 0.2) dv = 3;
          else if (tr < 0.3) dv = 2;
          addDefect(
            "cavidades en tronco",
            String(dv),
            Defects.cavitiesTrunk,
            Number(cavitiesTrunkT),
          );
        }

        // Slenderness coefficient
        let slendernessNumber: number | undefined;
        if (heightNum && dch) {
          slendernessNumber = heightNum / dch;
          let dv = 1;
          if (slendernessNumber > 60 && slendernessNumber <= 80) dv = 2;
          else if (slendernessNumber > 80 && slendernessNumber <= 100) dv = 3;
          else if (slendernessNumber > 100) dv = 4;
          addDefect(
            "coeficiente de esbeltez",
            String(dv),
            Defects.slendernessCoefficent,
          );
        }

        // Lost or dead bark
        if (isLostOrDeadBark && lostOrDeadBarkWidth && perimeterNum) {
          const ratio = Number(lostOrDeadBarkWidth) / perimeterNum;
          let dv = 1;
          if (ratio < 0.25) dv = 2;
          else if (ratio < 0.5) dv = 3;
          else dv = 4;
          addDefect(
            "corteza perdida o muerta",
            String(dv),
            Defects.lostOrDeadBark,
            Number(lostOrDeadBarkWidth),
          );
        }

        // Wounds
        if (isWounds && woundsWidth && perimeterNum) {
          const ratio = Number(woundsWidth) / perimeterNum;
          let dv = 1;
          if (ratio < 0.5) dv = 3;
          else dv = 4;
          addDefect(
            "heridas de tronco",
            String(dv),
            Defects.wounds,
            Number(woundsWidth),
          );
        }

        // Inclination
        if (inclineNum) {
          let dv = 1;
          if (inclineNum >= 10 && inclineNum < 20) dv = 2;
          else if (inclineNum >= 20 && inclineNum < 30) dv = 3;
          else if (inclineNum >= 30) dv = 4;
          addDefect("inclinacion", String(dv), Defects.inclination);
        }

        // Wood rot trunk
        if (isWoodRot) {
          let dv = 1;
          if (isWoodRotFruitingBodies) {
            dv = 4;
          } else if (woodRotT && perimeterNum && slendernessNumber) {
            const tr = Number(woodRotT) / (perimeterNum / (2 * Math.PI));
            if (tr < 0.15 && slendernessNumber > 60) dv = 3;
            else if (tr < 0.2 && slendernessNumber > 60) dv = 2;
          }
          addDefect(
            "pudricion de madera en tronco",
            String(dv),
            Defects.woodRotTrunk,
            woodRotT ? Number(woodRotT) : undefined,
          );
        }

        // Risk calculation
        const defectValues = newTree.createDefectsDtos.map(
          (d) => d.defectValue,
        );
        const maxDefect = defectValues.length
          ? Math.max(...defectValues)
          : null;
        newTree.risk! += maxDefect || 1;
        if (windExposure === "parcialmente expuesto") newTree.risk! += 1;
        if (windExposure === "expuesto") newTree.risk! += 2;
        if (windExposure === "tunel de viento") newTree.risk! += 2;
        if (canopyDensity === "escasa") newTree.risk! -= 1;
        if (canopyDensity === "densa") newTree.risk! += 1;
        if (!nothingUnderTree && frequencyUse) newTree.risk! += frequencyUse;
        if (potentialDamage) newTree.risk! += potentialDamage;

        newTree.createDefectsDtos = newTree.createDefectsDtos.filter(
          (d) => d.defectValue > 1,
        );
      }

      // Photo handling
      if (imageUri) {
        // For expo-image-picker with base64, extract the base64 data
        const response = await fetch(imageUri);
        const blob = await response.blob();
        const reader = new FileReader();
        const base64 = await new Promise<string>((resolve) => {
          reader.onloadend = () => {
            const result = reader.result as string;
            resolve(result.split(",")[1] || "");
          };
          reader.readAsDataURL(blob);
        });
        newTree.photoFile = base64;
      }
      newTree.currentPhoto = currentPhoto || null;

      const resultId = await treeService.createOrUpdateTree(newTree, idTree);
      Alert.alert("Exito", `${operation} exitosa`);

      if (isUpdate) {
        navigation.goBack();
      } else {
        navigation.replace("DetailTree", {
          idTree: resultId,
          idProject,
          projectType,
        });
      }
    } catch {
      Alert.alert("Error", `${operation} fallida`);
    } finally {
      setSubmitting(false);
    }
  };

  // Defect summary by zone (must be before early return to respect hook rules)
  const dch = perimeter ? Number(perimeter) / Math.PI / 100 : 0;
  const { defectsRaiz, defectsTronco, defectsRama } = useMemo(() => {
    const raiz: { label: string; value: string }[] = [];
    const tronco: { label: string; value: string }[] = [];
    const rama: { label: string; value: string }[] = [];

    const defectFields: {
      val: string | null;
      entries: [string, string][];
      label: string;
      zone: "raiz" | "tronco" | "rama";
      control?: string;
    }[] = [
      {
        val: fruitingBodiesRoots,
        entries: Object.entries(Defects.fruitingBodiesOfFungiOnNeckOrRoots),
        label: "Cuerpos fructiferos de hongos en raices",
        zone: "raiz",
      },
      {
        val: mechanicalDamageRoots,
        entries: Object.entries(Defects.mechanicalDamageToRoots),
        label: "Dano mecanico a raices",
        zone: "raiz",
      },
      {
        val: stranglingRoots,
        entries: Object.entries(Defects.stranglingRoots),
        label: "Raices estrangulantes",
        zone: "raiz",
      },
      {
        val: deadRoots,
        entries: Object.entries(Defects.deadRoots),
        label: "Raices muertas",
        zone: "raiz",
      },
      {
        val: symptomsDiseaseRoots,
        entries: Object.entries(Defects.symptomsDiseaseOfRootsInCrown),
        label: "Sintomas de enfermedad radicular en copa",
        zone: "raiz",
      },
      {
        val: gallsTermites,
        entries: Object.entries(Defects.gallsTermiteMoundsAnthills),
        label: "Agallas, termiteros, hormigueros",
        zone: "tronco",
      },
      {
        val: cankersTrunk,
        entries: Object.entries(Defects.cankersTrunk),
        label: "Cancros de tronco",
        zone: "tronco",
      },
      {
        val: multipleTrunks,
        entries: Object.entries(Defects.multipleTrunks),
        label: "Fustes multiples",
        zone: "tronco",
      },
      {
        val: forkTrunk,
        entries: Object.entries(Defects.forkTrunk),
        label: "Horqueta de tronco",
        zone: "tronco",
      },
      {
        val: fissuresTrunk,
        entries: Object.entries(Defects.fissuresTrunk),
        label: "Rajaduras de tronco",
        zone: "tronco",
      },
      {
        val: cankersBranch,
        entries: Object.entries(Defects.cankersBranch),
        label: "Cancros de ramas",
        zone: "rama",
      },
      {
        val: cavitiesBranches,
        entries: Object.entries(Defects.cavitiesBranches),
        label: "Cavidades en ramas",
        zone: "rama",
      },
      {
        val: fruitingBodiesBranch,
        entries: Object.entries(Defects.fruitingBodiesOfFungi),
        label: "Cuerpos fructiferos de hongos",
        zone: "rama",
      },
      {
        val: forkBranch,
        entries: Object.entries(Defects.forkBranch),
        label: "Horqueta de rama",
        zone: "rama",
      },
      {
        val: hangingBranches,
        entries: Object.entries(Defects.hangingOrBrokenBranches),
        label: "Ramas colgantes o quebradas",
        zone: "rama",
        control: "hangingBranches",
      },
      {
        val: deadBranches,
        entries: Object.entries(Defects.deadBranches),
        label: "Ramas muertas",
        zone: "rama",
        control: "deadBranches",
      },
      {
        val: overExtendedBranches,
        entries: Object.entries(Defects.overExtendedBranches),
        label: "Ramas sobre extendidas",
        zone: "rama",
      },
      {
        val: fissuresBranches,
        entries: Object.entries(Defects.fissuresBranches),
        label: "Rajaduras de ramas",
        zone: "rama",
      },
      {
        val: woodRotBranch,
        entries: Object.entries(Defects.woodRot),
        label: "Pudricion de madera",
        zone: "rama",
      },
      {
        val: electricalGrid,
        entries: Object.entries(Defects.interferenceWithTheElectricalGrid),
        label: "Interferencia con red electrica",
        zone: "rama",
      },
    ];

    for (const field of defectFields) {
      if (field.val) {
        const entry = field.entries.find(([key]) => key === field.val);
        if (entry) {
          let desc = entry[1];
          if (field.control === "hangingBranches" && hangingBranchesCount)
            desc += ` (${hangingBranchesCount})`;
          if (field.control === "deadBranches" && deadBranchesCount)
            desc += ` (${deadBranchesCount})`;
          const target =
            field.zone === "raiz"
              ? raiz
              : field.zone === "tronco"
                ? tronco
                : rama;
          target.push({ label: field.label, value: desc });
        }
      }
    }

    // Inclination
    const inclineNum = Number(incline);
    if (inclineNum >= 10) {
      let dv = 1;
      if (inclineNum >= 10 && inclineNum < 20) dv = 2;
      else if (inclineNum >= 20 && inclineNum < 30) dv = 3;
      else if (inclineNum >= 30) dv = 4;
      if (dv > 1)
        tronco.push({
          label: "Inclinacion",
          value: `${inclineNum}° - riesgo: ${dv}`,
        });
    }

    // Cavities trunk
    if (isCavitiesTrunk && cavitiesTrunkT) {
      tronco.push({
        label: "Cavidades en tronco",
        value: `t = ${cavitiesTrunkT}`,
      });
    }

    // Lost/dead bark
    if (isLostOrDeadBark && lostOrDeadBarkWidth) {
      tronco.push({
        label: "Corteza perdida o muerta",
        value: `ancho = ${lostOrDeadBarkWidth}`,
      });
    }

    // Wounds
    if (isWounds && woundsWidth) {
      tronco.push({
        label: "Heridas en el tronco",
        value: `ancho = ${woundsWidth}`,
      });
    }

    // Wood rot trunk
    if (isWoodRot) {
      if (isWoodRotFruitingBodies) {
        tronco.push({
          label: "Pudricion de madera",
          value: "con cuerpos fructiferos",
        });
      } else if (woodRotT) {
        tronco.push({ label: "Pudricion de madera", value: `t = ${woodRotT}` });
      }
    }

    // Slenderness
    const heightNum = Number(height);
    if (heightNum && dch) {
      const sl = heightNum / dch;
      let dv = 1;
      if (sl > 60 && sl <= 80) dv = 2;
      else if (sl > 80 && sl <= 100) dv = 3;
      else if (sl > 100) dv = 4;
      if (dv > 1)
        tronco.push({
          label: "Coeficiente de esbeltez",
          value: `${sl.toFixed(1)} - riesgo: ${dv}`,
        });
    }

    return { defectsRaiz: raiz, defectsTronco: tronco, defectsRama: rama };
  }, [
    fruitingBodiesRoots,
    mechanicalDamageRoots,
    stranglingRoots,
    deadRoots,
    symptomsDiseaseRoots,
    gallsTermites,
    cankersTrunk,
    multipleTrunks,
    forkTrunk,
    fissuresTrunk,
    cankersBranch,
    cavitiesBranches,
    fruitingBodiesBranch,
    forkBranch,
    hangingBranches,
    hangingBranchesCount,
    deadBranches,
    deadBranchesCount,
    overExtendedBranches,
    fissuresBranches,
    woodRotBranch,
    electricalGrid,
    isCavitiesTrunk,
    cavitiesTrunkT,
    isLostOrDeadBark,
    lostOrDeadBarkWidth,
    isWounds,
    woundsWidth,
    isWoodRot,
    isWoodRotFruitingBodies,
    woodRotT,
    incline,
    height,
    perimeter,
    dch,
  ]);

  if (loading) {
    return (
      <ActivityIndicator size="large" color="#388E3C" style={{ flex: 1 }} />
    );
  }

  const showFullForm = !isMissing && !isDead;

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView style={styles.container} keyboardShouldPersistTaps="handled">
        {/* LOCATION */}
        <SectionHeader title="Ubicacion" icon="📍" color="#1976D2" />

        <FormField label="Obtener posicion actual" row>
          <StyledSwitch value={useGPS} onValueChange={onToggleGPS} />
        </FormField>
        {latitude != null && (
          <Text style={styles.coordText}>
            Lat: {latitude}, Lon: {longitude}
          </Text>
        )}

        <FormField label="Direccion *">
          <TextInput
            style={styles.input}
            value={address}
            onChangeText={setAddress}
          />
        </FormField>

        <FormField label="Manzana (opcional)">
          <TextInput
            style={styles.input}
            value={cityBlock}
            onChangeText={setCityBlock}
            keyboardType="numeric"
          />
        </FormField>

        {/* Photo */}
        <View style={styles.photoRow}>
          <TouchableOpacity style={styles.photoButton} onPress={takePhoto}>
            <Text style={styles.photoButtonText}>Tomar foto</Text>
          </TouchableOpacity>
          {(imageUri || currentPhoto) && (
            <TouchableOpacity
              onPress={() => {
                setImageUri(null);
                setCurrentPhoto(null);
              }}
            >
              <Text style={styles.removePhotoText}>Quitar foto</Text>
            </TouchableOpacity>
          )}
        </View>
        {(imageUri || currentPhoto) && (
          <Image
            source={{ uri: imageUri || currentPhoto! }}
            style={styles.photoPreview}
            resizeMode="cover"
          />
        )}

        {projectType === "muestreo" && (
          <FormField label="Cantidad de arboles en la manzana *">
            <TextInput
              style={styles.input}
              value={treesInTheBlock}
              onChangeText={setTreesInTheBlock}
              keyboardType="numeric"
            />
          </FormField>
        )}

        {/* TREE CHARACTERISTICS */}
        <SectionHeader
          title="Caracteristicas del arbol"
          icon="🌳"
          color="#388E3C"
        />

        {!isDead && (
          <FormField label="Es arbol faltante?" row>
            <StyledSwitch value={isMissing} onValueChange={setIsMissing} />
          </FormField>
        )}
        {!isMissing && (
          <FormField label="Esta muerto?" row>
            <StyledSwitch value={isDead} onValueChange={setIsDead} />
          </FormField>
        )}

        {showFullForm && (
          <>
            {/* Tree type autocomplete */}
            <FormField label="Tipo de arbol *">
              <TextInput
                style={styles.input}
                value={treeTypeName}
                onChangeText={onTreeTypeChange}
                placeholder="Escriba el tipo de arbol"
              />
            </FormField>
            {showSuggestions && (
              <View style={styles.suggestionsContainer}>
                {filteredTreeTypes.map((tt, i) => (
                  <TouchableOpacity
                    key={i}
                    style={styles.suggestionItem}
                    onPress={() => onSelectTreeType(tt)}
                  >
                    <Text>{tt.name}</Text>
                  </TouchableOpacity>
                ))}
                {filteredTreeTypes.length === 10 && (
                  <Text style={styles.moreHint}>
                    Escriba mas para ver resultados especificos...
                  </Text>
                )}
              </View>
            )}

            <FormField label="Perimetro (centimetros) *">
              <TextInput
                style={styles.input}
                value={perimeter}
                onChangeText={setPerimeter}
                keyboardType="numeric"
              />
            </FormField>

            {projectType !== "muestreo" && (
              <SelectPicker
                label="Valor del arbol *"
                options={treeValueOptions.map((o) => ({ label: o, value: o }))}
                value={treeValue}
                onChange={setTreeValue}
              />
            )}

            {/* Tilt measurement */}
            <TiltMeasure onTiltChange={(v) => setIncline(String(v))}>
              <FormField label="Inclinacion (angulo en grados) *">
                <TextInput
                  style={styles.input}
                  value={incline}
                  onChangeText={setIncline}
                  keyboardType="numeric"
                />
              </FormField>
            </TiltMeasure>

            {/* Height measurement */}
            <HeightMeasure onHeightChange={(v) => setHeight(String(v))}>
              <FormField label="Altura (metros) *">
                <TextInput
                  style={styles.input}
                  value={height}
                  onChangeText={setHeight}
                  keyboardType="numeric"
                />
              </FormField>
            </HeightMeasure>

            {/* Pests */}
            {pestsNames.map((pest, i) => (
              <View key={i} style={styles.dynamicRow}>
                <TextInput
                  style={[styles.input, { flex: 1 }]}
                  value={pest}
                  onChangeText={(v) => updatePest(i, v)}
                  placeholder={`Plaga ${i + 1}`}
                />
                <TouchableOpacity onPress={() => removePest(i)}>
                  <Text style={styles.removeBtn}>X</Text>
                </TouchableOpacity>
              </View>
            ))}
            <TouchableOpacity style={styles.addButton} onPress={addPest}>
              <Text style={styles.addButtonText}>Agregar plaga</Text>
            </TouchableOpacity>

            {/* Diseases */}
            {diseasesNames.map((disease, i) => (
              <View key={i} style={styles.dynamicRow}>
                <TextInput
                  style={[styles.input, { flex: 1 }]}
                  value={disease}
                  onChangeText={(v) => updateDisease(i, v)}
                  placeholder={`Enfermedad ${i + 1}`}
                />
                <TouchableOpacity onPress={() => removeDisease(i)}>
                  <Text style={styles.removeBtn}>X</Text>
                </TouchableOpacity>
              </View>
            ))}
            <TouchableOpacity style={styles.addButton} onPress={addDisease}>
              <Text style={styles.addButtonText}>Agregar enfermedad</Text>
            </TouchableOpacity>

            {/* LOAD FACTORS */}
            <SectionHeader
              title="Factores de carga"
              icon="💨"
              color="#F9A825"
            />
            <SelectPicker
              label="Exposicion al viento *"
              options={windExposureOptions.map((o) => ({ label: o, value: o }))}
              value={windExposure}
              onChange={setWindExposure}
            />
            <SelectPicker
              label="Vigor *"
              options={vigorOptions.map((o) => ({ label: o, value: o }))}
              value={vigor}
              onChange={setVigor}
            />
            <SelectPicker
              label="Densidad de copa *"
              options={canopyDensityOptions.map((o) => ({
                label: o,
                value: o,
              }))}
              value={canopyDensity}
              onChange={setCanopyDensity}
            />

            {/* SITE CONDITIONS */}
            <SectionHeader
              title="Condiciones del sitio"
              icon="🌍"
              color="#7B1FA2"
            />
            <SelectPicker
              label="Espacio de crecimiento *"
              options={growthSpaceOptions.map((o) => ({ label: o, value: o }))}
              value={growthSpace}
              onChange={setGrowthSpace}
            />
            <FormField label="Raices expuestas?" row>
              <StyledSwitch
                value={exposedRoots}
                onValueChange={setExposedRoots}
              />
            </FormField>
            <SelectPicker
              label="Conflictos"
              options={conflictOptions.map((o) => ({ label: o, value: o }))}
              value={conflictsNames}
              onChange={setConflictsNames}
              multiple
            />
            {conflictsNames.length > 0 && (
              <View style={styles.selectedList}>
                <Text style={styles.selectedListTitle}>
                  Conflictos seleccionados:
                </Text>
                {conflictsNames.map((item, i) => (
                  <Text key={i} style={styles.selectedItem}>
                    - {item}
                  </Text>
                ))}
              </View>
            )}

            {/* TARGET UNDER TREE */}
            <SectionHeader
              title="Blanco debajo del arbol"
              icon="🎯"
              color="#D32F2F"
            />
            <FormField label="No hay nada bajo el arbol" row>
              <StyledSwitch
                value={nothingUnderTree}
                onValueChange={setNothingUnderTree}
              />
            </FormField>
            {!nothingUnderTree && (
              <>
                <FormField label="Que hay bajo el arbol? *">
                  <TextInput
                    style={styles.input}
                    value={useUnderTheTree}
                    onChangeText={setUseUnderTheTree}
                  />
                </FormField>
                <SelectPicker
                  label="Frecuencia *"
                  options={frequencyUseOptions.map((o, i) => ({
                    label: o,
                    value: i + 1,
                  }))}
                  value={frequencyUse}
                  onChange={setFrequencyUse}
                />
                <FormField label="Se puede mover el blanco?" row>
                  <StyledSwitch
                    value={isMovable}
                    onValueChange={setIsMovable}
                  />
                </FormField>
                <FormField label="Se puede restringir el blanco?" row>
                  <StyledSwitch
                    value={isRestrictable}
                    onValueChange={setIsRestrictable}
                  />
                </FormField>
              </>
            )}

            {/* DEFECTS - ROOTS */}
            <SectionHeader
              title="Defectos en raices"
              icon="🌱"
              color="#E65100"
            />
            <SelectPicker
              label="Cuerpos fructiferos de hongos"
              options={defectOptions(
                Defects.fruitingBodiesOfFungiOnNeckOrRoots,
                "sin cuerpos fructiferos",
              )}
              value={fruitingBodiesRoots}
              onChange={setFruitingBodiesRoots}
            />
            <SelectPicker
              label="Dano mecanico a raices"
              options={defectOptions(
                Defects.mechanicalDamageToRoots,
                "sin danos en raices",
              )}
              value={mechanicalDamageRoots}
              onChange={setMechanicalDamageRoots}
            />
            <SelectPicker
              label="Raices estrangulantes"
              options={defectOptions(
                Defects.stranglingRoots,
                "sin raices estrangulantes",
              )}
              value={stranglingRoots}
              onChange={setStranglingRoots}
            />
            <SelectPicker
              label="Raices muertas"
              options={defectOptions(Defects.deadRoots, "sin raices muertas")}
              value={deadRoots}
              onChange={setDeadRoots}
            />
            <SelectPicker
              label="Sintomas de enfermedad radicular en copa"
              options={defectOptions(
                Defects.symptomsDiseaseOfRootsInCrown,
                "sin sintomas",
              )}
              value={symptomsDiseaseRoots}
              onChange={setSymptomsDiseaseRoots}
            />

            {/* DEFECTS - TRUNK */}
            <SectionHeader
              title="Defectos en tronco y cuello"
              icon="🪵"
              color="#E65100"
            />
            <SelectPicker
              label="Agallas, termiteros, hormigueros"
              options={defectOptions(
                Defects.gallsTermiteMoundsAnthills,
                "no se observa",
              )}
              value={gallsTermites}
              onChange={setGallsTermites}
            />
            <SelectPicker
              label="Cancros de tronco o cuello"
              options={defectOptions(Defects.cankersTrunk, "sin cancro")}
              value={cankersTrunk}
              onChange={setCankersTrunk}
            />

            <FormField label="Tiene cavidades en el tronco?" row>
              <StyledSwitch
                value={isCavitiesTrunk}
                onValueChange={setIsCavitiesTrunk}
              />
            </FormField>
            {isCavitiesTrunk && (
              <NestedGroup>
                <FormField label="Mida el valor de t (cm)">
                  <TextInput
                    style={styles.input}
                    value={cavitiesTrunkT}
                    onChangeText={setCavitiesTrunkT}
                    keyboardType="numeric"
                  />
                  {!cavitiesTrunkT && (
                    <Text style={styles.warningText}>
                      Si no ingresa el valor de t, este defecto no se tendra en
                      cuenta.
                    </Text>
                  )}
                </FormField>
              </NestedGroup>
            )}

            <FormField label="Hay corteza perdida o muerta?" row>
              <StyledSwitch
                value={isLostOrDeadBark}
                onValueChange={setIsLostOrDeadBark}
              />
            </FormField>
            {isLostOrDeadBark && (
              <NestedGroup>
                <FormField label="Mida el perimetro (cm) afectado">
                  <TextInput
                    style={styles.input}
                    value={lostOrDeadBarkWidth}
                    onChangeText={setLostOrDeadBarkWidth}
                    keyboardType="numeric"
                  />
                  {!lostOrDeadBarkWidth && (
                    <Text style={styles.warningText}>
                      Si no ingresa el perimetro afectado, este defecto no se
                      tendra en cuenta.
                    </Text>
                  )}
                </FormField>
              </NestedGroup>
            )}

            <SelectPicker
              label="Fustes multiples"
              options={defectOptions(Defects.multipleTrunks, "no")}
              value={multipleTrunks}
              onChange={setMultipleTrunks}
            />

            <FormField label="Hay heridas en el tronco (no leves)?" row>
              <StyledSwitch value={isWounds} onValueChange={setIsWounds} />
            </FormField>
            {isWounds && (
              <NestedGroup>
                <FormField label="Mida el perimetro (cm) afectado">
                  <TextInput
                    style={styles.input}
                    value={woundsWidth}
                    onChangeText={setWoundsWidth}
                    keyboardType="numeric"
                  />
                  {!woundsWidth && (
                    <Text style={styles.warningText}>
                      Si no ingresa el perimetro afectado, este defecto no se
                      tendra en cuenta.
                    </Text>
                  )}
                </FormField>
              </NestedGroup>
            )}

            <SelectPicker
              label="Horqueta de tronco"
              options={defectOptions(Defects.forkTrunk, "sin horqueta")}
              value={forkTrunk}
              onChange={setForkTrunk}
            />

            <FormField label="Hay pudricion de madera?" row>
              <StyledSwitch
                value={isWoodRot}
                onValueChange={(v) => {
                  setIsWoodRot(v);
                  if (!v) setIsWoodRotFruitingBodies(false);
                }}
              />
            </FormField>
            {isWoodRot && (
              <NestedGroup>
                <FormField label="Es con presencia de cuerpos fructiferos?" row>
                  <StyledSwitch
                    value={isWoodRotFruitingBodies}
                    onValueChange={setIsWoodRotFruitingBodies}
                  />
                </FormField>
                {!isWoodRotFruitingBodies && (
                  <FormField label="Mida el valor de t (cm)">
                    <TextInput
                      style={styles.input}
                      value={woodRotT}
                      onChangeText={setWoodRotT}
                      keyboardType="numeric"
                    />
                    {!woodRotT && (
                      <Text style={styles.warningText}>
                        Ingrese el valor de t si no hay presencia de CF.
                      </Text>
                    )}
                  </FormField>
                )}
              </NestedGroup>
            )}

            <SelectPicker
              label="Rajaduras de tronco"
              options={defectOptions(Defects.fissuresTrunk, "sin rajaduras")}
              value={fissuresTrunk}
              onChange={setFissuresTrunk}
            />

            {/* DEFECTS - BRANCHES */}
            <SectionHeader
              title="Defectos en ramas"
              icon="🌿"
              color="#E65100"
            />
            <SelectPicker
              label="Cancros de ramas"
              options={defectOptions(Defects.cankersBranch, "sin cancro")}
              value={cankersBranch}
              onChange={setCankersBranch}
            />
            <SelectPicker
              label="Cavidades"
              options={defectOptions(Defects.cavitiesBranches, "sin cavidades")}
              value={cavitiesBranches}
              onChange={setCavitiesBranches}
            />
            <SelectPicker
              label="Cuerpos fructiferos de hongos"
              options={defectOptions(
                Defects.fruitingBodiesOfFungi,
                "sin cuerpos fructiferos",
              )}
              value={fruitingBodiesBranch}
              onChange={setFruitingBodiesBranch}
            />
            <SelectPicker
              label="Horqueta de ramas"
              options={defectOptions(Defects.forkBranch, "sin horqueta")}
              value={forkBranch}
              onChange={setForkBranch}
            />

            <SelectPicker
              label="Ramas colgantes o quebradas"
              options={defectOptions(
                Defects.hangingOrBrokenBranches,
                "sin ramas quebradas/colgantes",
              )}
              value={hangingBranches}
              onChange={(v) => {
                setHangingBranches(v);
                if (v !== "4") setHangingBranchesCount("");
              }}
            />
            {hangingBranches === "4" && (
              <NestedGroup>
                <FormField label="Cantidad de ramas colgantes o quebradas *">
                  <TextInput
                    style={styles.input}
                    value={hangingBranchesCount}
                    onChangeText={setHangingBranchesCount}
                    keyboardType="numeric"
                  />
                </FormField>
              </NestedGroup>
            )}

            <SelectPicker
              label="Ramas muertas"
              options={defectOptions(Defects.deadBranches, "sin ramas muertas")}
              value={deadBranches}
              onChange={(v) => {
                setDeadBranches(v);
                if (v !== "4") setDeadBranchesCount("");
              }}
            />
            {deadBranches === "4" && (
              <NestedGroup>
                <FormField label="Cantidad de ramas muertas *">
                  <TextInput
                    style={styles.input}
                    value={deadBranchesCount}
                    onChangeText={setDeadBranchesCount}
                    keyboardType="numeric"
                  />
                </FormField>
              </NestedGroup>
            )}

            <SelectPicker
              label="Ramas sobre extendidas"
              options={defectOptions(
                Defects.overExtendedBranches,
                "sin ramas sobreextendidas",
              )}
              value={overExtendedBranches}
              onChange={setOverExtendedBranches}
            />
            <SelectPicker
              label="Rajaduras de ramas"
              options={defectOptions(Defects.fissuresBranches, "sin rajaduras")}
              value={fissuresBranches}
              onChange={setFissuresBranches}
            />
            <SelectPicker
              label="Pudricion de madera"
              options={defectOptions(
                Defects.woodRot,
                "ramas estructurales sin pudricion",
              )}
              value={woodRotBranch}
              onChange={setWoodRotBranch}
            />
            <SelectPicker
              label="Interferencia con red electrica"
              options={defectOptions(
                Defects.interferenceWithTheElectricalGrid,
                "sin interferencia con red electrica",
              )}
              value={electricalGrid}
              onChange={setElectricalGrid}
            />

            {/* DEFECT SUMMARY BY ZONE */}
            <SectionHeader
              title="Defectos seleccionados por zona"
              icon="📋"
              color="#795548"
            />
            <View style={styles.summaryCard}>
              {defectsRaiz.length > 0 && (
                <View style={styles.summaryZone}>
                  <Text style={styles.summaryZoneTitle}>
                    🌱 Defectos en Raices
                  </Text>
                  {defectsRaiz.map((d, i) => (
                    <View key={i} style={styles.summaryRow}>
                      <Text style={styles.summaryLabel}>{d.label}</Text>
                      <Text style={styles.summaryValue}>{d.value}</Text>
                    </View>
                  ))}
                </View>
              )}
              {defectsTronco.length > 0 && (
                <View style={styles.summaryZone}>
                  <Text style={styles.summaryZoneTitle}>
                    🪵 Defectos en Tronco
                  </Text>
                  {defectsTronco.map((d, i) => (
                    <View key={i} style={styles.summaryRow}>
                      <Text style={styles.summaryLabel}>{d.label}</Text>
                      <Text style={styles.summaryValue}>{d.value}</Text>
                    </View>
                  ))}
                </View>
              )}
              {defectsRama.length > 0 && (
                <View style={styles.summaryZone}>
                  <Text style={styles.summaryZoneTitle}>
                    🌿 Defectos en Ramas
                  </Text>
                  {defectsRama.map((d, i) => (
                    <View key={i} style={styles.summaryRow}>
                      <Text style={styles.summaryLabel}>{d.label}</Text>
                      <Text style={styles.summaryValue}>{d.value}</Text>
                    </View>
                  ))}
                </View>
              )}
              {defectsRaiz.length === 0 &&
                defectsTronco.length === 0 &&
                defectsRama.length === 0 && (
                  <Text style={styles.summaryEmpty}>
                    No hay defectos de riesgo seleccionados.
                  </Text>
                )}
            </View>

            {/* INTERVENTIONS */}
            <SectionHeader
              title="Mitigacion del riesgo"
              icon="🛡️"
              color="#616161"
            />
            <SelectPicker
              label="Potencial de dano del arbol o rama en caso de caerse *"
              options={potentialDamageOptions.map((o, i) => ({
                label: o,
                value: i + 1,
              }))}
              value={potentialDamage}
              onChange={setPotentialDamage}
            />
            <SelectPicker
              label="Intervenciones"
              options={interventionOptions.map((o) => ({ label: o, value: o }))}
              value={interventionsNames}
              onChange={setInterventionsNames}
              multiple
            />
            {interventionsNames.length > 0 && (
              <View style={styles.selectedList}>
                <Text style={styles.selectedListTitle}>
                  Intervenciones seleccionadas:
                </Text>
                {interventionsNames.map((item, i) => (
                  <Text key={i} style={styles.selectedItem}>
                    - {item}
                  </Text>
                ))}
              </View>
            )}
          </>
        )}

        {/* Missing/Dead intervention info */}
        {(isMissing || isDead) && (
          <>
            <SectionHeader
              title="Mitigacion del riesgo"
              icon="🛡️"
              color="#616161"
            />
            <Text style={styles.autoIntervention}>
              {isMissing
                ? "plantacion de arbol faltante"
                : "extraccion del arbol"}
            </Text>
          </>
        )}

        {/* Submit */}
        <TouchableOpacity
          style={[
            styles.submitButton,
            submitting && styles.submitButtonDisabled,
          ]}
          onPress={onSubmit}
          disabled={submitting}
        >
          {submitting ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.submitButtonText}>
              {isUpdate ? `Actualizar arbol ID: ${idTree}` : "Registrar arbol"}
            </Text>
          )}
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f5f5f5", padding: 12 },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 6,
    marginTop: 16,
    marginBottom: 8,
  },
  sectionHeaderIcon: { fontSize: 16, marginRight: 8 },
  sectionHeaderText: { color: "#fff", fontWeight: "bold", fontSize: 15 },
  formField: { marginBottom: 10 },
  formFieldRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
    paddingVertical: 6,
    paddingHorizontal: 4,
    backgroundColor: "#fff",
    borderRadius: 8,
    paddingLeft: 10,
    paddingRight: 6,
    elevation: 1,
  },
  nestedGroup: {
    marginLeft: 12,
    paddingLeft: 12,
    borderLeftWidth: 3,
    borderLeftColor: "#388E3C",
    marginBottom: 8,
  },
  fieldLabel: { color: "#555", fontSize: 13, marginBottom: 4 },
  fieldLabelRow: { color: "#333", fontSize: 14, flex: 1, marginRight: 8 },
  input: {
    borderBottomWidth: 1,
    borderBottomColor: "#ddd",
    paddingVertical: 8,
    fontSize: 16,
  },
  coordText: { color: "#888", fontSize: 13, marginBottom: 8, marginLeft: 4 },
  photoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginVertical: 8,
  },
  photoButton: { backgroundColor: "#1976D2", padding: 12, borderRadius: 8 },
  photoButtonText: { color: "#fff", fontWeight: "bold" },
  removePhotoText: { color: "#d32f2f", fontWeight: "bold" },
  photoPreview: {
    width: "100%",
    height: 200,
    borderRadius: 8,
    marginBottom: 12,
  },
  suggestionsContainer: {
    backgroundColor: "#fff",
    borderRadius: 8,
    elevation: 3,
    marginBottom: 8,
    maxHeight: 200,
  },
  suggestionItem: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderBottomWidth: 0.5,
    borderBottomColor: "#eee",
  },
  moreHint: { padding: 10, color: "#888", fontStyle: "italic", fontSize: 13 },
  dynamicRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 6,
  },
  removeBtn: {
    color: "#d32f2f",
    fontWeight: "bold",
    fontSize: 18,
    paddingHorizontal: 8,
  },
  addButton: {
    backgroundColor: "#7B1FA2",
    padding: 10,
    borderRadius: 8,
    alignItems: "center",
    marginBottom: 8,
  },
  addButtonText: { color: "#fff", fontWeight: "bold" },
  warningText: { color: "#FF9800", fontSize: 12, marginTop: 4 },
  selectedList: { marginTop: 4, marginBottom: 8 },
  selectedListTitle: { fontWeight: "bold", color: "#555", marginBottom: 4 },
  selectedItem: { color: "#555", marginLeft: 8, fontSize: 14 },
  autoIntervention: { padding: 12, color: "#555", fontSize: 15 },
  summaryCard: {
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 14,
    marginBottom: 10,
    elevation: 2,
    borderLeftWidth: 4,
    borderLeftColor: "#795548",
  },
  summaryZone: { marginBottom: 12 },
  summaryZoneTitle: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#555",
    marginBottom: 6,
  },
  summaryRow: {
    paddingVertical: 6,
    paddingHorizontal: 8,
    backgroundColor: "#FAFAFA",
    borderRadius: 4,
    marginBottom: 3,
  },
  summaryLabel: { color: "#555", fontSize: 13, marginBottom: 2 },
  summaryValue: { color: "#333", fontSize: 13, fontWeight: "600" },
  summaryEmpty: {
    color: "#999",
    fontStyle: "italic",
    fontSize: 13,
    textAlign: "center",
    paddingVertical: 12,
  },
  submitButton: {
    backgroundColor: "#388E3C",
    paddingVertical: 16,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 16,
  },
  submitButtonDisabled: { opacity: 0.6 },
  submitButtonText: { color: "#fff", fontWeight: "bold", fontSize: 17 },
});
