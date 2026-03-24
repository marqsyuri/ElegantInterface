# 🔧 Correção: Android v1 Embedding Removido

Este erro ocorre quando o projeto Flutter ainda está usando o Android embedding v1, que foi removido nas versões mais recentes do Flutter.

## 📋 Solução Passo a Passo

### 1. Verificar o AndroidManifest.xml

Localize o arquivo:
```
android/app/src/main/AndroidManifest.xml
```

**Remova ou comente** a linha que contém:
```xml
<meta-data
    android:name="flutterEmbedding"
    android:value="1" />
```

**OU adicione** (se não existir):
```xml
<meta-data
    android:name="flutterEmbedding"
    android:value="2" />
```

### 2. Verificar o MainActivity.java ou MainActivity.kt

#### Se for Java (`MainActivity.java`):
Localize: `android/app/src/main/java/.../MainActivity.java`

**Substitua** por:
```java
package com.example.yourapp; // Substitua pelo seu package

import io.flutter.embedding.android.FlutterActivity;

public class MainActivity extends FlutterActivity {
}
```

#### Se for Kotlin (`MainActivity.kt`):
Localize: `android/app/src/main/kotlin/.../MainActivity.kt`

**Substitua** por:
```kotlin
package com.example.yourapp // Substitua pelo seu package

import io.flutter.embedding.android.FlutterActivity

class MainActivity: FlutterActivity() {
}
```

### 3. Verificar o build.gradle (app)

Localize: `android/app/build.gradle`

**Verifique** se tem estas configurações mínimas:
```gradle
android {
    compileSdkVersion 34  // ou superior
    
    defaultConfig {
        minSdkVersion 21  // ou superior
        targetSdkVersion 34  // ou superior
    }
    
    compileOptions {
        sourceCompatibility JavaVersion.VERSION_1_8
        targetCompatibility JavaVersion.VERSION_1_8
    }
}
```

### 4. Verificar dependências problemáticas

Algumas dependências antigas podem causar esse erro. Verifique o `pubspec.yaml`:

**Dependências conhecidas por causar problemas:**
- `flutter_webview_plugin` (antiga) → Use `webview_flutter` em vez disso
- `flutter_local_notifications` (versões antigas) → Atualize para versão mais recente
- Qualquer plugin que não tenha sido atualizado recentemente

**Solução:** Atualize todas as dependências:
```bash
flutter pub upgrade
```

### 5. Limpar e Reconstruir

Execute estes comandos na ordem:

```bash
# 1. Limpar build anterior
flutter clean

# 2. Obter dependências novamente
flutter pub get

# 3. Limpar cache do Gradle (Android)
cd android
./gradlew clean  # Linux/Mac
gradlew.bat clean  # Windows
cd ..

# 4. Tentar build novamente
flutter build apk
```

## 🔍 Verificação Rápida

### Checklist:

- [ ] `AndroidManifest.xml` não tem `flutterEmbedding` = 1
- [ ] `MainActivity` estende `FlutterActivity` (não `FlutterActivity` antigo)
- [ ] `build.gradle` tem `compileSdkVersion` >= 34
- [ ] Todas as dependências estão atualizadas
- [ ] Executou `flutter clean` e `flutter pub get`

## 📝 Exemplo Completo de AndroidManifest.xml

```xml
<manifest xmlns:android="http://schemas.android.com/apk/res/android"
    package="com.example.yourapp">
    
    <application
        android:label="Your App Name"
        android:name="${applicationName}"
        android:icon="@mipmap/ic_launcher">
        
        <activity
            android:name=".MainActivity"
            android:exported="true"
            android:launchMode="singleTop"
            android:theme="@style/LaunchTheme"
            android:configChanges="orientation|keyboardHidden|keyboard|screenSize|smallestScreenSize|locale|layoutDirection|fontScale|screenLayout|density|uiMode"
            android:hardwareAccelerated="true"
            android:windowSoftInputMode="adjustResize">
            
            <meta-data
              android:name="io.flutter.embedding.android.NormalTheme"
              android:resource="@style/NormalTheme"
              />
            
            <intent-filter>
                <action android:name="android.intent.action.MAIN"/>
                <category android:name="android.intent.category.LAUNCHER"/>
            </intent-filter>
        </activity>
        
        <!-- NÃO inclua flutterEmbedding = 1 aqui -->
        
        <meta-data
            android:name="flutterEmbedding"
            android:value="2" />
    </application>
</manifest>
```

## 🚨 Se o Erro Persistir

### Opção 1: Migrar para Android Embedding v2 Manualmente

1. **Criar novo projeto Flutter:**
```bash
flutter create temp_project
```

2. **Copiar os arquivos Android:**
   - Copie `android/app/src/main/AndroidManifest.xml` do projeto novo
   - Copie `android/app/src/main/kotlin/.../MainActivity.kt` do projeto novo
   - Ajuste o package name

### Opção 2: Verificar Versão do Flutter

```bash
flutter --version
```

**Recomendado:** Flutter 3.0 ou superior

Se estiver usando versão antiga:
```bash
flutter upgrade
```

### Opção 3: Verificar Plugins Específicos

Se o erro mencionar um plugin específico, atualize ou remova:

```bash
# Ver plugins instalados
flutter pub deps

# Atualizar plugin específico
flutter pub upgrade nome_do_plugin
```

## 📱 Comandos Úteis

```bash
# Verificar configuração Android
flutter doctor -v

# Limpar tudo
flutter clean
flutter pub get

# Build APK
flutter build apk

# Build APK dividido (menor tamanho)
flutter build apk --split-per-abi

# Build App Bundle (para Play Store)
flutter build appbundle
```

## ✅ Solução Rápida (Copy-Paste)

Execute estes comandos em sequência:

```bash
# Windows
cd C:\Projetos\replitSaloon\apk
flutter clean
flutter pub get
cd android
gradlew.bat clean
cd ..
flutter build apk
```

Se ainda der erro, edite manualmente:
1. `android/app/src/main/AndroidManifest.xml` - Remova `flutterEmbedding = 1`
2. `android/app/src/main/kotlin/.../MainActivity.kt` - Use `FlutterActivity`

---

**Última atualização:** 2025-12-05













