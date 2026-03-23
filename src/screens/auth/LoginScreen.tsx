import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Image,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/AppNavigator';
import { authService } from '../../services/auth.service';

type Props = NativeStackScreenProps<RootStackParamList, 'Login'>;

export default function LoginScreen({ navigation }: Props) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [emailTouched, setEmailTouched] = useState(false);
  const [passwordTouched, setPasswordTouched] = useState(false);

  useEffect(() => {
    authService.checkAuth().then((authenticated) => {
      if (authenticated) navigation.replace('ListProjects');
    });
  }, []);

  const isEmailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const isPasswordValid = password.length >= 6;
  const isFormValid = isEmailValid && isPasswordValid;

  const handleLogin = async () => {
    if (!isFormValid) return;

    setLoading(true);
    try {
      await authService.login(email, password);
      navigation.replace('ListProjects');
    } catch (error: any) {
      let errorMessage = 'Error desconocido';
      if (error?.error?.message === 'Invalid credentials') {
        errorMessage = 'Credenciales incorrectas.';
      } else if (error?.status === 0 || !error?.status) {
        errorMessage = 'No se pudo conectar con el servidor.';
      }
      Alert.alert('Error', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.card}>
          {/* Logo */}
          <View style={styles.logoContainer}>
            <Image source={require('../../../assets/logo.png')} style={styles.logo} resizeMode="contain" />
            <Text style={styles.appTitle}>Yvira</Text>
            <Text style={styles.subtitle}>¡Bienvenido!</Text>
          </View>

          {/* Email */}
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              placeholder="Correo electrónico"
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
              value={email}
              onChangeText={setEmail}
              onBlur={() => setEmailTouched(true)}
            />
          </View>
          {emailTouched && !isEmailValid && (
            <Text style={styles.errorText}>Correo inválido</Text>
          )}

          {/* Password */}
          <View style={styles.inputContainer}>
            <TextInput
              style={[styles.input, { flex: 1 }]}
              placeholder="Contraseña"
              secureTextEntry={!showPassword}
              autoComplete="password"
              value={password}
              onChangeText={setPassword}
              onBlur={() => setPasswordTouched(true)}
            />
            <TouchableOpacity
              style={styles.eyeButton}
              onPress={() => setShowPassword(!showPassword)}
            >
              <Text style={styles.eyeIcon}>{showPassword ? '🙈' : '👁'}</Text>
            </TouchableOpacity>
          </View>
          {passwordTouched && !isPasswordValid && (
            <Text style={styles.errorText}>Contraseña requerida (mín. 6 caracteres)</Text>
          )}

          {/* Actions */}
          <View style={styles.actionsRow}>
            <TouchableOpacity>
              <Text style={styles.forgotText}>¿Olvidaste tu contraseña?</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.loginButton, !isFormValid && styles.loginButtonDisabled]}
              onPress={handleLogin}
              disabled={!isFormValid || loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.loginButtonText}>Iniciar sesión</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 20,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 24,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  logo: {
    width: 100,
    height: 100,
    marginBottom: 16,
  },
  appTitle: {
    fontSize: 32,
    fontWeight: '600',
    color: 'green',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 18,
    color: '#888',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
    marginBottom: 8,
  },
  input: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 16,
  },
  eyeButton: {
    padding: 8,
  },
  eyeIcon: {
    fontSize: 20,
  },
  errorText: {
    color: '#f44336',
    fontSize: 13,
    marginBottom: 8,
    paddingLeft: 4,
  },
  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 16,
  },
  forgotText: {
    color: '#1976D2',
    fontSize: 13,
  },
  loginButton: {
    backgroundColor: '#388E3C',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  loginButtonDisabled: {
    backgroundColor: '#a5d6a7',
  },
  loginButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 15,
  },
});
