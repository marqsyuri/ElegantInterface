# 📱 API Documentation - Staff Mobile App

Documentação completa da API para o aplicativo mobile do staff.

## 🔐 Autenticação

A API utiliza autenticação baseada em sessões (cookies). Todas as requisições devem incluir os cookies de sessão automaticamente.

### Base URL

```
http://localhost:5000  (desenvolvimento)
https://seu-dominio.com  (produção)
```

---

## 🔑 Endpoints de Autenticação

### 1. Login do Staff

**POST** `/api/login`

Autentica um usuário staff e cria uma sessão.

**Request Body:**
```json
{
  "username": "clebinho",
  "password": "admin"
}
```

**Response Success (200):**
```json
{
  "id": 1,
  "username": "clebinho",
  "name": "Clebinho Seixas",
  "email": "clebinho@example.com",
  "role": "therapist",
  "accessLevel": "staff",
  "userType": "staff",
  "userId": 1,
  "companyId": null,
  "isActive": true
}
```

**Response Error (401):**
```json
{
  "message": "Invalid username or password"
}
```

**Response Error (400):**
```json
{
  "message": "Username and password are required"
}
```

**Notas:**
- O servidor retorna cookies de sessão automaticamente
- O Dio (Flutter) deve manter cookies entre requisições
- A sessão expira após 24 horas de inatividade

---

### 2. Validar Sessão Atual

**GET** `/api/user`

Retorna os dados do usuário autenticado ou 401 se não autenticado.

**Headers:**
- Cookie: Sessão (automático pelo Dio)

**Response Success (200):**
```json
{
  "id": 1,
  "username": "clebinho",
  "name": "Clebinho Seixas",
  "email": "clebinho@example.com",
  "role": "therapist",
  "accessLevel": "staff",
  "userType": "staff",
  "userId": 1,
  "companyId": null,
  "isActive": true
}
```

**Response Error (401):**
```json
{
  "message": "Unauthorized"
}
```

**Notas:**
- Use este endpoint para verificar se o usuário ainda está autenticado
- Chame este endpoint ao abrir o app para validar a sessão

---

### 3. Logout

**POST** `/api/logout`

Encerra a sessão do usuário.

**Headers:**
- Cookie: Sessão (automático pelo Dio)

**Response Success (200):**
```json
{
  "message": "Logged out successfully"
}
```

**Notas:**
- Após logout, limpe as credenciais armazenadas localmente
- A sessão no servidor é destruída

---

## 📅 Endpoints de Agendamentos

### 1. Listar Todos os Agendamentos

**GET** `/api/appointments/all`

Retorna todos os agendamentos do staff autenticado ou de um staff específico.

**Query Parameters:**
- `staffId` (opcional): ID do staff para filtrar agendamentos. Se não fornecido, retorna os agendamentos do staff logado.

**Headers:**
- Cookie: Sessão (automático pelo Dio)

**Exemplos:**
```
GET /api/appointments/all
GET /api/appointments/all?staffId=1
```

**Response Success (200):**
```json
[
  {
    "id": 41,
    "userId": 1,
    "clientId": 7,
    "appointmentDate": "2025-12-05T10:00:00.000Z",
    "status": "scheduled",
    "notes": "Cliente preferencial",
    "totalPrice": "150.00",
    "totalDuration": 120,
    "createdAt": "2025-12-01T10:00:00.000Z",
    "client": {
      "id": 7,
      "name": "Maria Silva",
      "email": "maria@example.com",
      "phone": "11999999999"
    },
    "service": {
      "id": 12,
      "name": "Corte Feminino",
      "duration": 60,
      "price": "80.00"
    }
  }
]
```

**Response Error (401):**
```json
{
  "message": "Unauthorized"
}
```

**Notas:**
- Se `staffId` não for fornecido, o backend filtra automaticamente apenas os agendamentos do staff logado
- Se `staffId` for fornecido:
  - **Admin users**: Podem filtrar por qualquer `staffId`
  - **Staff users**: Podem filtrar apenas pelo seu próprio `staffId` (retorna 403 se tentar filtrar por outro staff)
- Os agendamentos são retornados ordenados por data (mais recentes primeiro)

---

### 2. Listar Agendamentos por Data

**GET** `/api/appointments?date=YYYY-MM-DD`

Retorna os agendamentos do staff para uma data específica.

**Query Parameters:**
- `date` (opcional): Data no formato `YYYY-MM-DD` (ex: `2025-12-05`)

**Headers:**
- Cookie: Sessão (automático pelo Dio)

**Exemplo:**
```
GET /api/appointments?date=2025-12-05
```

**Response Success (200):**
```json
[
  {
    "id": 41,
    "userId": 1,
    "clientId": 7,
    "appointmentDate": "2025-12-05T10:00:00.000Z",
    "status": "scheduled",
    "notes": "Cliente preferencial",
    "totalPrice": "150.00",
    "totalDuration": 120,
    "client": {
      "id": 7,
      "name": "Maria Silva",
      "email": "maria@example.com",
      "phone": "11999999999"
    }
  }
]
```

**Notas:**
- Se `date` não for fornecido, retorna todos os agendamentos
- A data é interpretada no timezone do servidor

---

### 3. Listar Agendamentos por Data (Rota Alternativa)

**GET** `/api/appointments/:date`

Rota alternativa para buscar agendamentos por data usando path parameter.

**Path Parameters:**
- `date`: Data no formato `YYYY-MM-DD` (ex: `2025-12-05`)

**Headers:**
- Cookie: Sessão (automático pelo Dio)

**Exemplo:**
```
GET /api/appointments/2025-12-05
```

**Response:** Mesmo formato da rota anterior.

---

### 4. Detalhes do Agendamento com Procedimentos

**GET** `/api/appointments/:id/with-procedures`

Retorna os detalhes completos de um agendamento, incluindo todos os procedimentos associados.

**Path Parameters:**
- `id`: ID do agendamento

**Headers:**
- Cookie: Sessão (automático pelo Dio)

**Exemplo:**
```
GET /api/appointments/41/with-procedures
```

**Response Success (200):**
```json
{
  "id": 41,
  "userId": 1,
  "clientId": 7,
  "appointmentDate": "2025-12-05T10:00:00.000Z",
  "status": "scheduled",
  "notes": "Cliente preferencial",
  "totalPrice": "150.00",
  "totalDuration": 120,
  "paidAmount": "0.00",
  "beforeImages": [],
  "afterImages": [],
  "createdAt": "2025-12-01T10:00:00.000Z",
  "client": {
    "id": 7,
    "name": "Maria Silva",
    "email": "maria@example.com",
    "phone": "11999999999"
  },
  "procedures": [
    {
      "id": 1,
      "appointmentId": 41,
      "procedureId": 12,
      "price": "80.00",
      "duration": 60,
      "procedure": {
        "id": 12,
        "name": "Corte Feminino",
        "description": "Corte de cabelo feminino",
        "duration": 60,
        "price": "80.00"
      }
    }
  ]
}
```

**Response Error (404):**
```json
{
  "message": "Appointment not found"
}
```

**Response Error (403):**
```json
{
  "message": "Access denied: Appointment not assigned to you"
}
```

**Notas:**
- Esta rota verifica se o agendamento está atribuído ao staff logado
- Retorna 403 se o staff não tiver acesso ao agendamento

---

### 5. Atualizar Agendamento

**PUT** `/api/appointments/:id`

Atualiza um agendamento existente. Permite atualizar status, procedimentos, observações e todos os dados do formulário.

**Path Parameters:**
- `id`: ID do agendamento

**Headers:**
- Cookie: Sessão (automático pelo Dio)

**Request Body:**
```json
{
  "status": "completed",
  "notes": "Procedimento realizado com sucesso",
  "procedureIds": [12, 25],
  "appointmentDate": "2025-12-05T14:00:00.000Z",
  "clientId": 7,
  "beforeImages": ["https://example.com/before1.jpg"],
  "afterImages": ["https://example.com/after1.jpg"],
  "paidAmount": "150.00",
  "paymentStatus": "paid",
  "staffId": 1,
  "staffIds": [1, 2]
}
```

**Campos do Request Body (todos opcionais):**
- `status` (string): Status do agendamento ('scheduled', 'confirmed', 'completed', 'cancelled')
- `notes` (string): Observações sobre o agendamento
- `procedureIds` (array de números): IDs dos procedimentos a serem associados ao agendamento
- `appointmentDate` (string ISO 8601): Data e hora do agendamento
- `clientId` (número): ID do cliente
- `beforeImages` (array de strings): URLs das imagens antes do procedimento
- `afterImages` (array de strings): URLs das imagens depois do procedimento
- `paidAmount` (string): Valor pago (formato decimal como string, ex: "150.00")
- `paymentStatus` (string): Status do pagamento ('pending', 'partial', 'paid')
- `staffId` (número): ID do staff principal (para compatibilidade)
- `staffIds` (array de números): IDs dos staffs associados ao agendamento

**Exemplo:**
```
PUT /api/appointments/41
Content-Type: application/json

{
  "status": "completed",
  "notes": "Cliente satisfeito com o serviço",
  "procedureIds": [12],
  "paidAmount": "150.00",
  "paymentStatus": "paid"
}
```

**Response Success (200):**
```json
{
  "id": 41,
  "userId": 1,
  "clientId": 7,
  "appointmentDate": "2025-12-05T14:00:00.000Z",
  "status": "completed",
  "notes": "Cliente satisfeito com o serviço",
  "totalPrice": "150.00",
  "totalDuration": 120,
  "paidAmount": "150.00",
  "paymentStatus": "paid",
  "beforeImages": [],
  "afterImages": [],
  "createdAt": "2025-12-01T10:00:00.000Z",
  "client": {
    "id": 7,
    "name": "Maria Silva",
    "email": "maria@example.com",
    "phone": "11999999999"
  },
  "procedures": [
    {
      "id": 1,
      "appointmentId": 41,
      "procedureId": 12,
      "price": "150.00",
      "duration": 120,
      "procedure": {
        "id": 12,
        "name": "Corte Feminino",
        "description": "Corte de cabelo feminino",
        "duration": 120,
        "price": "150.00"
      }
    }
  ]
}
```

**Response Error (400):**
```json
{
  "message": "Invalid appointment ID"
}
```

**Response Error (403):**
```json
{
  "message": "Access denied: Appointment not assigned to you"
}
```

**Response Error (404):**
```json
{
  "message": "Appointment not found"
}
```

**Response Error (500):**
```json
{
  "message": "Failed to update appointment",
  "error": "Error details"
}
```

**Notas:**
- Esta rota verifica se o agendamento está atribuído ao staff logado
- Retorna 403 se o staff não tiver acesso ao agendamento
- Todos os campos são opcionais - apenas os campos enviados serão atualizados
- Se `procedureIds` for fornecido, os procedimentos existentes serão substituídos pelos novos
- Se `staffIds` for fornecido, os staffs existentes serão substituídos pelos novos
- A rota calcula automaticamente `totalPrice` e `totalDuration` quando `procedureIds` é fornecido

---

## 🔔 Endpoints de Notificações

### 1. Listar Notificações por Staff

**GET** `/api/notifications/staff/:staffId`

Retorna todas as notificações dos agendamentos vinculados a um staff específico. A rota utiliza a tabela `appointment_staff` para encontrar os agendamentos vinculados ao staff e retorna as notificações relacionadas a esses agendamentos.

**Path Parameters:**
- `staffId`: ID do staff

**Headers:**
- Cookie: Sessão (automático pelo Dio)

**Exemplo:**
```
GET /api/notifications/staff/1
```

**Response Success (200):**
```json
[
  {
    "id": 1,
    "userId": 1,
    "clientId": 7,
    "appointmentId": 41,
    "type": "appointment_reminder",
    "title": "Lembrete de Agendamento",
    "message": "Você tem um agendamento com Maria Silva em 05/12/2025 às 10:00",
    "channel": "in_app",
    "status": "unread",
    "isRead": false,
    "readAt": null,
    "metadata": {
      "clientName": "Maria Silva",
      "appointmentDate": "2025-12-05T10:00:00.000Z",
      "appointmentTime": "10:00",
      "procedures": ["Corte Feminino"],
      "staffName": "Clebinho Seixas"
    },
    "createdAt": "2025-12-01T10:00:00.000Z"
  }
]
```

**Response Error (400):**
```json
{
  "message": "Invalid staff ID"
}
```

**Response Error (403):**
```json
{
  "message": "Access denied: You can only view your own notifications"
}
```

**Response Error (404):**
```json
{
  "message": "Staff not found"
}
```

**Response Error (500):**
```json
{
  "message": "Failed to fetch staff notifications",
  "error": "Error details"
}
```

**Notas:**
- Esta rota busca todos os agendamentos vinculados ao staff através da tabela `appointment_staff`
- Retorna apenas as notificações dos agendamentos onde o staff está vinculado
- Staff users podem visualizar apenas suas próprias notificações (verificação de segurança)
- Admin users podem visualizar notificações de qualquer staff
- As notificações são retornadas ordenadas por data de criação (mais recentes primeiro)
- Se o staff não tiver agendamentos vinculados, retorna um array vazio

---

## 📊 Modelos de Dados

### User (Staff)

```dart
class User {
  final int id;
  final String username;
  final String name;
  final String? email;
  final String role; // 'therapist', 'receptionist', 'manager'
  final String accessLevel; // 'staff' ou 'admin'
  final String userType; // 'staff'
  final int userId; // ID do admin/salon que possui este staff
  final int? companyId;
  final bool isActive;

  bool get isStaff => userType == 'staff';
}
```

### Appointment

```dart
class Appointment {
  final int id;
  final DateTime appointmentDate;
  final String status; // 'scheduled', 'confirmed', 'completed', 'cancelled'
  final String? notes;
  final double totalPrice;
  final int totalDuration; // em minutos
  final double? paidAmount;
  final List<String>? beforeImages;
  final List<String>? afterImages;
  final int? clientId;
  final Client? client; // nome, telefone, email
  final List<AppointmentProcedure>? procedures;
  final DateTime? createdAt;

  // Métodos auxiliares
  bool get isUpcoming => appointmentDate.isAfter(DateTime.now());
  bool get isPast => appointmentDate.isBefore(DateTime.now());
  String get formattedDate => DateFormat('dd/MM/yyyy HH:mm').format(appointmentDate);
}
```

### Client

```dart
class Client {
  final int id;
  final String name;
  final String? email;
  final String? phone;
  final DateTime? createdAt;
}
```

### AppointmentProcedure

```dart
class AppointmentProcedure {
  final int id;
  final int appointmentId;
  final int procedureId;
  final double price;
  final int duration;
  final Procedure? procedure;
}
```

### Procedure

```dart
class Procedure {
  final int id;
  final String name;
  final String? description;
  final int duration; // em minutos
  final double price;
}
```

---

## 🔒 Segurança

### Armazenamento de Credenciais

**Recomendação:** Use `flutter_secure_storage` para armazenar credenciais de forma segura:

```dart
import 'package:flutter_secure_storage/flutter_secure_storage.dart';

final storage = FlutterSecureStorage();

// Salvar credenciais após login
await storage.write(key: 'username', value: username);
await storage.write(key: 'password', value: password);

// Recuperar credenciais
final username = await storage.read(key: 'username');
final password = await storage.read(key: 'password');
```

**Nota:** Não armazene a senha em texto plano. Use apenas para auto-login se necessário, ou melhor ainda, confie apenas nos cookies de sessão.

### Cookies/Sessões

O Dio mantém cookies automaticamente entre requisições se configurado corretamente:

```dart
final dio = Dio(BaseOptions(
  baseUrl: 'https://seu-dominio.com',
  headers: {
    'Content-Type': 'application/json',
  },
  // CookieJar gerencia cookies automaticamente
  cookieJar: CookieJar(),
));
```

### HTTPS

**IMPORTANTE:** Em produção, todas as requisições devem usar HTTPS. Configure o Dio para aceitar apenas conexões HTTPS:

```dart
final dio = Dio(BaseOptions(
  baseUrl: 'https://seu-dominio.com',
  // Em produção, não desabilite a verificação SSL
));
```

### Validação de Entrada

Sempre valide os dados do usuário antes de enviar:

```dart
String? validateUsername(String? value) {
  if (value == null || value.isEmpty) {
    return 'Username é obrigatório';
  }
  if (value.length < 3) {
    return 'Username deve ter pelo menos 3 caracteres';
  }
  return null;
}

String? validatePassword(String? value) {
  if (value == null || value.isEmpty) {
    return 'Senha é obrigatória';
  }
  if (value.length < 4) {
    return 'Senha deve ter pelo menos 4 caracteres';
  }
  return null;
}
```

---

## 📱 Exemplo de Implementação Flutter

### Configuração do Dio

```dart
import 'package:dio/dio.dart';
import 'package:cookie_jar/cookie_jar.dart';
import 'package:dio_cookie_manager/dio_cookie_manager.dart';

class ApiService {
  late Dio _dio;
  static const String baseUrl = 'https://seu-dominio.com';

  ApiService() {
    _dio = Dio(BaseOptions(
      baseUrl: baseUrl,
      headers: {
        'Content-Type': 'application/json',
      },
      connectTimeout: const Duration(seconds: 30),
      receiveTimeout: const Duration(seconds: 30),
    ));

    // Configurar gerenciamento de cookies
    final cookieJar = CookieJar();
    _dio.interceptors.add(CookieManager(cookieJar));
  }

  // Login
  Future<User> login(String username, String password) async {
    try {
      final response = await _dio.post(
        '/api/login',
        data: {
          'username': username,
          'password': password,
        },
      );
      return User.fromJson(response.data);
    } on DioException catch (e) {
      if (e.response?.statusCode == 401) {
        throw Exception('Credenciais inválidas');
      }
      throw Exception('Erro ao fazer login: ${e.message}');
    }
  }

  // Validar sessão
  Future<User?> getCurrentUser() async {
    try {
      final response = await _dio.get('/api/user');
      return User.fromJson(response.data);
    } on DioException catch (e) {
      if (e.response?.statusCode == 401) {
        return null; // Não autenticado
      }
      throw Exception('Erro ao validar sessão: ${e.message}');
    }
  }

  // Logout
  Future<void> logout() async {
    try {
      await _dio.post('/api/logout');
    } catch (e) {
      // Ignorar erros no logout
    }
  }

  // Listar todos os agendamentos
  Future<List<Appointment>> getAllAppointments({int? staffId}) async {
    try {
      final queryParams = staffId != null ? {'staffId': staffId.toString()} : null;
      final response = await _dio.get(
        '/api/appointments/all',
        queryParameters: queryParams,
      );
      return (response.data as List)
          .map((json) => Appointment.fromJson(json))
          .toList();
    } on DioException catch (e) {
      if (e.response?.statusCode == 401) {
        throw Exception('Não autenticado');
      }
      if (e.response?.statusCode == 403) {
        throw Exception('Acesso negado: Você só pode visualizar seus próprios agendamentos');
      }
      throw Exception('Erro ao buscar agendamentos: ${e.message}');
    }
  }

  // Listar agendamentos por data
  Future<List<Appointment>> getAppointmentsByDate(DateTime date) async {
    try {
      final dateStr = '${date.year}-${date.month.toString().padLeft(2, '0')}-${date.day.toString().padLeft(2, '0')}';
      final response = await _dio.get(
        '/api/appointments',
        queryParameters: {'date': dateStr},
      );
      return (response.data as List)
          .map((json) => Appointment.fromJson(json))
          .toList();
    } on DioException catch (e) {
      if (e.response?.statusCode == 401) {
        throw Exception('Não autenticado');
      }
      throw Exception('Erro ao buscar agendamentos: ${e.message}');
    }
  }

  // Detalhes do agendamento
  Future<AppointmentDetail> getAppointmentDetails(int appointmentId) async {
    try {
      final response = await _dio.get('/api/appointments/$appointmentId/with-procedures');
      return AppointmentDetail.fromJson(response.data);
    } on DioException catch (e) {
      if (e.response?.statusCode == 401) {
        throw Exception('Não autenticado');
      }
      if (e.response?.statusCode == 404) {
        throw Exception('Agendamento não encontrado');
      }
      if (e.response?.statusCode == 403) {
        throw Exception('Acesso negado: Agendamento não atribuído a você');
      }
      throw Exception('Erro ao buscar detalhes: ${e.message}');
    }
  }

  // Atualizar agendamento
  Future<AppointmentDetail> updateAppointment(int appointmentId, {
    String? status,
    String? notes,
    List<int>? procedureIds,
    DateTime? appointmentDate,
    int? clientId,
    List<String>? beforeImages,
    List<String>? afterImages,
    String? paidAmount,
    String? paymentStatus,
    int? staffId,
    List<int>? staffIds,
  }) async {
    try {
      final data = <String, dynamic>{};
      if (status != null) data['status'] = status;
      if (notes != null) data['notes'] = notes;
      if (procedureIds != null) data['procedureIds'] = procedureIds;
      if (appointmentDate != null) data['appointmentDate'] = appointmentDate.toIso8601String();
      if (clientId != null) data['clientId'] = clientId;
      if (beforeImages != null) data['beforeImages'] = beforeImages;
      if (afterImages != null) data['afterImages'] = afterImages;
      if (paidAmount != null) data['paidAmount'] = paidAmount;
      if (paymentStatus != null) data['paymentStatus'] = paymentStatus;
      if (staffId != null) data['staffId'] = staffId;
      if (staffIds != null) data['staffIds'] = staffIds;

      final response = await _dio.put(
        '/api/appointments/$appointmentId',
        data: data,
      );
      return AppointmentDetail.fromJson(response.data);
    } on DioException catch (e) {
      if (e.response?.statusCode == 401) {
        throw Exception('Não autenticado');
      }
      if (e.response?.statusCode == 403) {
        throw Exception('Acesso negado: Agendamento não atribuído a você');
      }
      if (e.response?.statusCode == 404) {
        throw Exception('Agendamento não encontrado');
      }
      throw Exception('Erro ao atualizar agendamento: ${e.message}');
    }
  }

  // Buscar notificações de um staff
  Future<List<Map<String, dynamic>>> getStaffNotifications(int staffId) async {
    try {
      final response = await _dio.get('/api/notifications/staff/$staffId');
      return (response.data as List)
          .map((json) => json as Map<String, dynamic>)
          .toList();
    } on DioException catch (e) {
      if (e.response?.statusCode == 401) {
        throw Exception('Não autenticado');
      }
      if (e.response?.statusCode == 403) {
        throw Exception('Acesso negado: Você só pode visualizar suas próprias notificações');
      }
      if (e.response?.statusCode == 404) {
        throw Exception('Staff não encontrado');
      }
      throw Exception('Erro ao buscar notificações: ${e.message}');
    }
  }
}
```

### Exemplo de Tela de Login

```dart
class LoginScreen extends StatefulWidget {
  @override
  _LoginScreenState createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> {
  final _formKey = GlobalKey<FormState>();
  final _usernameController = TextEditingController();
  final _passwordController = TextEditingController();
  bool _isLoading = false;
  String? _errorMessage;

  Future<void> _handleLogin() async {
    if (!_formKey.currentState!.validate()) {
      return;
    }

    setState(() {
      _isLoading = true;
      _errorMessage = null;
    });

    try {
      final apiService = ApiService();
      final user = await apiService.login(
        _usernameController.text.trim(),
        _passwordController.text,
      );

      // Navegar para tela principal
      Navigator.pushReplacement(
        context,
        MaterialPageRoute(builder: (context) => HomeScreen(user: user)),
      );
    } catch (e) {
      setState(() {
        _errorMessage = e.toString().replaceAll('Exception: ', '');
        _isLoading = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: SafeArea(
        child: Padding(
          padding: EdgeInsets.all(24.0),
          child: Form(
            key: _formKey,
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                // Logo ou título
                Text(
                  'Staff App',
                  style: TextStyle(fontSize: 32, fontWeight: FontWeight.bold),
                ),
                SizedBox(height: 48),
                
                // Campo de username
                TextFormField(
                  controller: _usernameController,
                  decoration: InputDecoration(
                    labelText: 'Username',
                    border: OutlineInputBorder(),
                  ),
                  validator: (value) {
                    if (value == null || value.isEmpty) {
                      return 'Username é obrigatório';
                    }
                    return null;
                  },
                ),
                SizedBox(height: 16),
                
                // Campo de senha
                TextFormField(
                  controller: _passwordController,
                  decoration: InputDecoration(
                    labelText: 'Senha',
                    border: OutlineInputBorder(),
                  ),
                  obscureText: true,
                  validator: (value) {
                    if (value == null || value.isEmpty) {
                      return 'Senha é obrigatória';
                    }
                    return null;
                  },
                ),
                SizedBox(height: 24),
                
                // Mensagem de erro
                if (_errorMessage != null)
                  Container(
                    padding: EdgeInsets.all(12),
                    decoration: BoxDecoration(
                      color: Colors.red.shade50,
                      borderRadius: BorderRadius.circular(8),
                      border: Border.all(color: Colors.red.shade200),
                    ),
                    child: Text(
                      _errorMessage!,
                      style: TextStyle(color: Colors.red.shade700),
                    ),
                  ),
                SizedBox(height: 16),
                
                // Botão de login
                SizedBox(
                  width: double.infinity,
                  child: ElevatedButton(
                    onPressed: _isLoading ? null : _handleLogin,
                    child: _isLoading
                        ? CircularProgressIndicator()
                        : Text('Entrar'),
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
```

---

## ⚠️ Códigos de Status HTTP

- **200 OK**: Requisição bem-sucedida
- **400 Bad Request**: Dados inválidos na requisição
- **401 Unauthorized**: Não autenticado ou sessão expirada
- **403 Forbidden**: Acesso negado (agendamento não atribuído ao staff)
- **404 Not Found**: Recurso não encontrado
- **500 Internal Server Error**: Erro interno do servidor

---

## 📝 Notas Importantes

1. **Filtragem Automática**: O backend filtra automaticamente os agendamentos do staff logado. Não é necessário enviar `staffId` nas requisições.

2. **Sessões**: As sessões expiram após 24 horas de inatividade. Implemente verificação periódica da sessão usando `/api/user`.

3. **Timezones**: As datas são enviadas e recebidas em UTC. Converta para o timezone local no app.

4. **Imagens**: Os campos `beforeImages` e `afterImages` contêm URLs ou base64. Trate adequadamente no app.

5. **Status de Agendamento**: Os valores possíveis são:
   - `scheduled`: Agendado
   - `confirmed`: Confirmado
   - `completed`: Concluído
   - `cancelled`: Cancelado

---

## 🚀 Próximos Passos

1. Implemente a tela de login com validação
2. Configure o Dio com gerenciamento de cookies
3. Implemente a listagem de agendamentos
4. Implemente a visualização de detalhes do agendamento
5. Adicione tratamento de erros robusto
6. Implemente refresh automático da lista de agendamentos
7. Adicione pull-to-refresh na lista

---

**Última atualização:** 2025-12-05


