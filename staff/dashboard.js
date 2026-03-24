// API base URL
const API_BASE_URL = window.location.origin;

// #region agent log
fetch('http://127.0.0.1:7243/ingest/4da6fc2e-4d2c-4115-959d-5ca3885558f2',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'dashboard.js:3',message:'Script dashboard.js carregado',data:{apiBaseUrl:API_BASE_URL,url:window.location.href,readyState:document.readyState},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
// #endregion
console.log('[Dashboard] ============================================');
console.log('[Dashboard] SCRIPT CARREGADO');
console.log('[Dashboard] API_BASE_URL:', API_BASE_URL);
console.log('[Dashboard] URL:', window.location.href);
console.log('[Dashboard] ReadyState:', document.readyState);
console.log('[Dashboard] ============================================');

// Capturar erros globais não tratados
window.addEventListener('error', (event) => {
    console.error('[Dashboard] ERRO GLOBAL CAPTURADO:', event.error);
    console.error('[Dashboard] Mensagem:', event.message);
    console.error('[Dashboard] Arquivo:', event.filename);
    console.error('[Dashboard] Linha:', event.lineno);
    console.error('[Dashboard] Coluna:', event.colno);
});

// Capturar promessas rejeitadas não tratadas
window.addEventListener('unhandledrejection', (event) => {
    console.error('[Dashboard] PROMESSA REJEITADA NÃO TRATADA:', event.reason);
    console.error('[Dashboard] Stack:', event.reason?.stack);
});

// State - DECLARAR ANTES da solução direta para garantir acesso
let currentDate = new Date();
let appointments = [];
let currentUser = null;
let currentView = 'calendar'; // 'calendar' or 'list'
let notifications = [];
let unreadCount = 0;

// Função auxiliar para atualizar appointments (acessível globalmente)
window.updateAppointments = function(newAppointments) {
    appointments = newAppointments;
    window.appointments = newAppointments;
    console.log('[Dashboard] updateAppointments() chamada:', newAppointments.length, 'agendamentos');
};

// Tornar appointments acessível globalmente para a solução direta
window.appointments = appointments;
window.currentView = currentView;

// VERIFICAÇÃO IMEDIATA: Se o script inline do HTML já carregou os dados, usar eles
// Caso contrário, garantir que fetchAppointments() seja chamada
(function checkInlineData() {
    console.log('[Dashboard] Verificando se script inline já carregou agendamentos...');
    
    // Verificar se o script inline já carregou os dados
    if (window._staffAppointments && Array.isArray(window._staffAppointments) && window._staffAppointments.length > 0) {
        console.log('[Dashboard] ✅ Agendamentos já carregados pelo script inline:', window._staffAppointments.length);
        
        // Atualizar variáveis imediatamente
        appointments = window._staffAppointments;
        window.appointments = window._staffAppointments;
        
        // Esconder loading
        const loadingEl = document.getElementById('loadingState');
        if (loadingEl) {
            loadingEl.style.display = 'none';
        }
        
        // Mostrar calendário quando DOM estiver pronto
        const showCalendar = () => {
            const calendarEl = document.getElementById('calendarContainer');
            if (calendarEl) {
                calendarEl.style.display = 'block';
                // Tentar renderizar quando a função estiver disponível
                if (typeof renderCalendar === 'function') {
                    renderCalendar();
                } else {
                    // Aguardar um pouco e tentar novamente
                    setTimeout(() => {
                        if (typeof renderCalendar === 'function') {
                            renderCalendar();
                        }
                    }, 200);
                }
            }
        };
        
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', showCalendar);
        } else {
            setTimeout(showCalendar, 50);
        }
    } else {
        console.log('[Dashboard] ⚠️ Script inline não carregou agendamentos ainda, fetchAppointments() será chamada');
    }
})();

// Inicialização simples: quando o DOM estiver pronto, chamar fetchAppointments()
// A função fetchAppointments() já chama a rota correta /api/staff/appointments
// que filtra os agendamentos onde o staff está vinculado a procedimentos

// DOM Elements
const currentMonthEl = document.getElementById('currentMonth');
const calendarDaysEl = document.getElementById('calendarDays');
const prevMonthBtn = document.getElementById('prevMonth');
const nextMonthBtn = document.getElementById('nextMonth');
const todayBtn = document.getElementById('todayButton');
const logoutBtn = document.getElementById('logoutButton');
const loadingState = document.getElementById('loadingState');
const errorState = document.getElementById('errorState');
const calendarContainer = document.getElementById('calendarContainer');
const listContainer = document.getElementById('listContainer');
const listContent = document.getElementById('listContent');
const emptyState = document.getElementById('emptyState');
const appointmentModal = document.getElementById('appointmentModal');
const closeModalBtn = document.getElementById('closeModal');
const modalBody = document.getElementById('modalBody');
const retryButton = document.getElementById('retryButton');
const calendarViewBtn = document.getElementById('calendarViewBtn');
const listViewBtn = document.getElementById('listViewBtn');
const notificationsButton = document.getElementById('notificationsButton');
const notificationsDropdown = document.getElementById('notificationsDropdown');
const notificationsList = document.getElementById('notificationsList');
const notificationBadge = document.getElementById('notificationBadge');
const markAllReadButton = document.getElementById('markAllReadButton');
const notificationsEmpty = document.getElementById('notificationsEmpty');

// Day names in Portuguese
const dayNames = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
const monthNames = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];

// Check if user is logged in
async function checkSession() {
    try {
        console.log('[Dashboard] Verificando sessão...');
        const response = await fetch(`${API_BASE_URL}/api/user`, {
            method: 'GET',
            credentials: 'include'
        });
        
        console.log('[Dashboard] Resposta /api/user:', response.status, response.statusText);
        
        if (response.ok) {
            const user = await response.json();
            console.log('[Dashboard] Dados do usuário:', user);
            
            // Check if user is staff - be more flexible with the check
            // Staff users from staff table might not have userType set
            const isStaff = user.userType === 'staff' || 
                           user.accessLevel === 'staff' || 
                           (user.role && user.role !== 'admin') ||
                           !user.userType || // If no userType, assume staff (from staff table)
                           user.id !== undefined; // If has id, might be staff
            
            console.log('[Dashboard] É staff?', isStaff, {
                userType: user.userType,
                accessLevel: user.accessLevel,
                role: user.role,
                hasId: !!user.id
            });
            
            if (isStaff) {
                currentUser = user;
                // #region agent log
                fetch('http://127.0.0.1:7243/ingest/4da6fc2e-4d2c-4115-959d-5ca3885558f2',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'dashboard.js:checkSession-staff',message:'Usuário é staff',data:{userId:user?.id,isStaff:true},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
                // #endregion
                console.log('[Dashboard] Sessão válida, usuário é staff');
                return true;
            } else {
                // Not a staff user, redirect to login
                // #region agent log
                fetch('http://127.0.0.1:7243/ingest/4da6fc2e-4d2c-4115-959d-5ca3885558f2',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'dashboard.js:checkSession-not-staff',message:'Usuário não é staff',data:{userId:user?.id,isStaff:false},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
                // #endregion
                console.log('[Dashboard] Usuário não é staff, redirecionando para login');
                // Don't redirect immediately, let the page try to load
                // window.location.href = '/staff/';
                return false;
            }
        } else {
            // Not logged in
            console.log('[Dashboard] Não autenticado (status:', response.status, ')');
            // Don't redirect immediately, let the page try to load
            // window.location.href = '/staff/';
            return false;
        }
    } catch (error) {
        console.error('[Dashboard] Erro ao verificar sessão:', error);
        // Don't redirect on error, let the page try to load
        return false;
    }
}

// Fetch appointments from API (using staff-specific route)
async function fetchAppointments() {
    try {
        // #region agent log
        fetch('http://127.0.0.1:7243/ingest/4da6fc2e-4d2c-4115-959d-5ca3885558f2',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'dashboard.js:fetchAppointments-entry',message:'fetchAppointments() entrada',data:{apiBaseUrl:API_BASE_URL},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
        // #endregion
        console.log('[Dashboard] fetchAppointments() chamada');
        showLoading();
        
        const apiUrl = `${API_BASE_URL}/api/staff/appointments`;
        console.log('[Dashboard] Fazendo requisição para:', apiUrl);
        
        // #region agent log
        fetch('http://127.0.0.1:7243/ingest/4da6fc2e-4d2c-4115-959d-5ca3885558f2',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'dashboard.js:fetchAppointments-before-fetch',message:'Antes de fazer fetch',data:{apiUrl,method:'GET',hasCredentials:true},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
        // #endregion
        
        // Use staff-specific route that filters by staff linkage to procedures
        const response = await fetch(apiUrl, {
            method: 'GET',
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        // #region agent log
        fetch('http://127.0.0.1:7243/ingest/4da6fc2e-4d2c-4115-959d-5ca3885558f2',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'dashboard.js:fetchAppointments-response',message:'Resposta fetch recebida',data:{status:response.status,statusText:response.statusText,ok:response.ok},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
        // #endregion
        console.log('[Dashboard] Resposta recebida:', response.status, response.statusText);
        
        if (!response.ok) {
            const errorText = await response.text();
            console.error('[Dashboard] Erro na resposta:', response.status, errorText);
            
            if (response.status === 401) {
                // Not authenticated, redirect to login
                console.log('[Dashboard] Não autenticado, redirecionando...');
                window.location.href = '/staff/';
                return;
            }
            throw new Error(`Failed to fetch appointments: ${response.status} ${errorText}`);
        }
        
        const data = await response.json();
        // #region agent log
        fetch('http://127.0.0.1:7243/ingest/4da6fc2e-4d2c-4115-959d-5ca3885558f2',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'dashboard.js:fetchAppointments-data',message:'Dados recebidos da API',data:{isArray:Array.isArray(data),length:Array.isArray(data)?data.length:0,type:typeof data},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
        // #endregion
        console.log('[Dashboard] Dados recebidos:', Array.isArray(data) ? `${data.length} agendamentos` : 'Formato inválido');
        
        if (!Array.isArray(data)) {
            console.error('[Dashboard] Resposta não é um array:', typeof data, data);
            throw new Error('Invalid response format');
        }
        
        appointments = data;
        // #region agent log
        fetch('http://127.0.0.1:7243/ingest/4da6fc2e-4d2c-4115-959d-5ca3885558f2',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'dashboard.js:fetchAppointments-assigned',message:'Agendamentos atribuídos',data:{appointmentsCount:appointments.length},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
        // #endregion
        console.log('[Dashboard] Agendamentos atribuídos:', appointments.length);
        
        // Esconder estados de erro e loading primeiro
        if (errorState) errorState.style.display = 'none';
        if (loadingState) loadingState.style.display = 'none';
        
        // Garantir que o container do calendário esteja visível
        if (calendarContainer) calendarContainer.style.display = 'block';
        if (listContainer) listContainer.style.display = 'none';
        
        try {
            if (currentView === 'calendar') {
                console.log('[Dashboard] Renderizando calendário...');
                if (typeof renderCalendar === 'function') {
                    renderCalendar();
                } else {
                    console.error('[Dashboard] renderCalendar não é uma função!');
                }
            } else {
                console.log('[Dashboard] Renderizando lista...');
                if (typeof renderListView === 'function') {
                    renderListView();
                } else {
                    console.error('[Dashboard] renderListView não é uma função!');
                }
            }
        } catch (renderError) {
            console.error('[Dashboard] Erro ao renderizar:', renderError);
            console.error('[Dashboard] Stack:', renderError.stack);
            // Não mostrar erro se os dados foram carregados com sucesso
            // Apenas logar o erro
        }
        
        if (appointments.length === 0) {
            console.log('[Dashboard] Nenhum agendamento encontrado, mostrando estado vazio');
            showEmptyState();
        } else {
            console.log('[Dashboard] Agendamentos encontrados, escondendo estado vazio');
            hideEmptyState();
        }
    } catch (error) {
        // #region agent log
        fetch('http://127.0.0.1:7243/ingest/4da6fc2e-4d2c-4115-959d-5ca3885558f2',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'dashboard.js:fetchAppointments-catch',message:'Erro em fetchAppointments()',data:{error:error?.message||String(error),stack:error?.stack,name:error?.name},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
        // #endregion
        console.error('[Dashboard] Erro ao buscar agendamentos:', error);
        console.error('[Dashboard] Stack trace:', error.stack);
        hideLoading();
        showError();
    }
}

// Show loading state
function showLoading() {
    loadingState.style.display = 'flex';
    errorState.style.display = 'none';
    calendarContainer.style.display = 'none';
    listContainer.style.display = 'none';
    emptyState.style.display = 'none';
}

// Hide loading state
function hideLoading() {
    loadingState.style.display = 'none';
    errorState.style.display = 'none';
    updateView();
}

// Show error state
function showError() {
    loadingState.style.display = 'none';
    errorState.style.display = 'flex';
    calendarContainer.style.display = 'none';
    listContainer.style.display = 'none';
    emptyState.style.display = 'none';
}

// Hide error state
function hideError() {
    if (errorState) {
        errorState.style.display = 'none';
    }
}

// Show empty state
function showEmptyState() {
    emptyState.style.display = 'flex';
}

// Hide empty state
function hideEmptyState() {
    emptyState.style.display = 'none';
}

// Format date to YYYY-MM-DD
function formatDate(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

// Format time to HH:MM
function formatTime(dateString) {
    const date = new Date(dateString);
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${hours}:${minutes}`;
}

// Format date to readable format
function formatDateReadable(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

// Get appointments for a specific date
function getAppointmentsForDate(date) {
    const dateStr = formatDate(date);
    // Usar window.appointments como fallback se appointments local estiver vazio
    const apps = (appointments && appointments.length > 0) ? appointments : (window.appointments || []);
    return apps.filter(apt => {
        const aptDate = new Date(apt.appointmentDate);
        const aptDateStr = formatDate(aptDate);
        return aptDateStr === dateStr;
    });
}

// Get status color class
function getStatusColorClass(status) {
    switch (status) {
        case 'completed':
            return 'status-completed';
        case 'confirmed':
            return 'status-confirmed';
        case 'cancelled':
            return 'status-cancelled';
        default:
            return 'status-scheduled';
    }
}

// Get status label
function getStatusLabel(status) {
    const labels = {
        'scheduled': 'Agendado',
        'confirmed': 'Confirmado',
        'completed': 'Concluído',
        'cancelled': 'Cancelado'
    };
    return labels[status] || status;
}

// Render calendar
function renderCalendar() {
    // Verificar se os elementos DOM existem
    if (!currentMonthEl || !calendarDaysEl) {
        console.error('[Dashboard] Elementos DOM do calendário não encontrados!', {
            currentMonthEl: !!currentMonthEl,
            calendarDaysEl: !!calendarDaysEl
        });
        return;
    }
    
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    
    // Update month title
    currentMonthEl.textContent = `${monthNames[month]} ${year}`;
    
    // Get first day of month and last day
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();
    
    // Get previous month's last days
    const prevMonthLastDay = new Date(year, month, 0);
    const prevMonthDays = prevMonthLastDay.getDate();
    
    // Clear calendar
    calendarDaysEl.innerHTML = '';
    
    // Add previous month's trailing days
    for (let i = startingDayOfWeek - 1; i >= 0; i--) {
        const day = prevMonthDays - i;
        const date = new Date(year, month - 1, day);
        const dayEl = createDayElement(date, true);
        calendarDaysEl.appendChild(dayEl);
    }
    
    // Add current month's days
    for (let day = 1; day <= daysInMonth; day++) {
        const date = new Date(year, month, day);
        const dayEl = createDayElement(date, false);
        calendarDaysEl.appendChild(dayEl);
    }
    
    // Add next month's leading days to fill the grid
    const totalCells = calendarDaysEl.children.length;
    const remainingCells = 42 - totalCells; // 6 rows * 7 days = 42
    
    for (let day = 1; day <= remainingCells; day++) {
        const date = new Date(year, month + 1, day);
        const dayEl = createDayElement(date, true);
        calendarDaysEl.appendChild(dayEl);
    }
}

// Create day element
function createDayElement(date, isOtherMonth) {
    const dayEl = document.createElement('div');
    dayEl.className = 'calendar-day';
    
    if (isOtherMonth) {
        dayEl.classList.add('other-month');
    }
    
    // Check if today
    const today = new Date();
    if (formatDate(date) === formatDate(today)) {
        dayEl.classList.add('today');
    }
    
    // Day number
    const dayNumber = document.createElement('div');
    dayNumber.className = 'day-number';
    dayNumber.textContent = date.getDate();
    dayEl.appendChild(dayNumber);
    
    // Appointments for this day
    const dayAppointments = getAppointmentsForDate(date);
    if (dayAppointments.length > 0) {
        const appointmentsList = document.createElement('div');
        appointmentsList.className = 'appointments-list';
        
        // Show up to 3 appointments, then "+X more"
        const maxVisible = 3;
        const visibleAppointments = dayAppointments.slice(0, maxVisible);
        
        visibleAppointments.forEach(appointment => {
            const aptEl = createAppointmentElement(appointment);
            appointmentsList.appendChild(aptEl);
        });
        
        if (dayAppointments.length > maxVisible) {
            const moreEl = document.createElement('div');
            moreEl.className = 'appointment-item status-scheduled';
            moreEl.textContent = `+${dayAppointments.length - maxVisible} mais`;
            moreEl.style.fontSize = '0.625rem';
            moreEl.style.opacity = '0.7';
            appointmentsList.appendChild(moreEl);
        }
        
        dayEl.appendChild(appointmentsList);
    }
    
    return dayEl;
}

// Create appointment element
function createAppointmentElement(appointment) {
    const aptEl = document.createElement('div');
    aptEl.className = `appointment-item ${getStatusColorClass(appointment.status)}`;
    
    const time = formatTime(appointment.appointmentDate);
    const clientName = appointment.client?.name || 'Cliente';
    
    aptEl.innerHTML = `
        <span class="appointment-time">${time}</span>
        <span class="appointment-client">${clientName}</span>
    `;
    
    aptEl.addEventListener('click', (e) => {
        e.stopPropagation();
        showAppointmentDetails(appointment);
    });
    
    return aptEl;
}

// Fetch full appointment details with procedures and staff
async function fetchAppointmentDetails(appointmentId) {
    try {
        const response = await fetch(`${API_BASE_URL}/api/appointments/${appointmentId}/with-procedures`, {
            method: 'GET',
            credentials: 'include'
        });
        
        if (!response.ok) {
            throw new Error('Failed to fetch appointment details');
        }
        
        return await response.json();
    } catch (error) {
        console.error('Error fetching appointment details:', error);
        throw error;
    }
}

// Show appointment details modal
async function showAppointmentDetails(appointment) {
    try {
        // Show loading state
        modalBody.innerHTML = '<div class="loading-state"><div class="spinner"></div><p>Carregando detalhes...</p></div>';
        appointmentModal.style.display = 'flex';
        
        // Fetch full details
        const fullData = await fetchAppointmentDetails(appointment.id);
        console.log('Full appointment data:', fullData);
        
        const appointmentData = fullData.appointment || fullData;
        const client = appointmentData.client || appointment.client || {};
        let procedures = appointmentData.procedures || appointment.allProcedures || appointment.procedures || [];
        
        // Debug: log procedures to see structure
        console.log('Procedures from API:', procedures);
        console.log('Procedures with staff details:', procedures.map(p => ({
            id: p.id,
            procedureName: p.procedureName,
            staffId: p.staffId,
            staff: p.staff,
            staffName: p.staffName,
            hasStaff: !!p.staff,
            hasStaffName: !!p.staffName
        })));
        
        // Fetch all staff to create a lookup map
        let staffMap = new Map();
        try {
            const staffResponse = await fetch(`${API_BASE_URL}/api/staff`, {
                credentials: 'include'
            });
            if (staffResponse.ok) {
                const allStaff = await staffResponse.json();
                allStaff.forEach(s => {
                    if (s.id) {
                        staffMap.set(s.id, s);
                    }
                });
                console.log('Staff map created:', staffMap);
            }
        } catch (error) {
            console.error('Error fetching staff list:', error);
        }
        
        // Enrich procedures with staff names if missing
        // This ensures staffName is always available for display
        procedures = procedures.map(proc => {
            // If we have staffId, ensure we have staffName
            if (proc.staffId) {
                // If we already have staffName, keep it
                if (proc.staffName) {
                    // staffName already set, nothing to do
                }
                // If we have staff object but no staffName, extract it
                else if (proc.staff) {
                    if (typeof proc.staff === 'object' && proc.staff !== null) {
                        proc.staffName = proc.staff.name || proc.staff.username || 'Staff sem nome';
                        console.log(`Extracted staffName from staff object for procedure ${proc.id}: ${proc.staffName}`);
                    } else if (typeof proc.staff === 'string') {
                        proc.staffName = proc.staff;
                    }
                }
                // If we don't have staffName or staff object, try to get from staffMap
                else {
                    const staffData = staffMap.get(proc.staffId);
                    if (staffData) {
                        proc.staff = staffData;
                        proc.staffName = staffData.name || staffData.username || 'Staff sem nome';
                        console.log(`Enriched procedure ${proc.id} (${proc.procedureName || proc.name}) with staff: ${proc.staffName}`);
                    } else {
                        console.warn(`Procedure ${proc.id} has staffId ${proc.staffId} but staff not found in staffMap`);
                        proc.staffName = 'Não atribuído';
                    }
                }
            } else {
                // No staffId, set to not assigned
                proc.staffName = 'Não atribuído';
            }
            
            // Final check: ensure staffName is always set
            if (!proc.staffName) {
                proc.staffName = 'Não atribuído';
            }
            
            return proc;
        });
        
        // Log final procedures with staff names
        console.log('Final procedures with staff names:', procedures.map(p => ({
            id: p.id,
            procedureName: p.procedureName || p.name,
            staffId: p.staffId,
            staffName: p.staffName
        })));
        
        // Calculate payment info
        const totalAmount = parseFloat(appointmentData.totalAmount || appointmentData.totalPrice || '0');
        const paidAmount = parseFloat(appointmentData.paidAmount || '0');
        const outstandingBalance = Math.max(0, totalAmount - paidAmount);
        const paymentStatus = paidAmount === 0 ? 'unpaid' : (outstandingBalance <= 0 ? 'paid' : 'partial');
        
        // Get payment status label
        const paymentStatusLabel = {
            'unpaid': 'Não Pago',
            'partial': 'Parcialmente Pago',
            'paid': 'Pago'
        }[paymentStatus] || 'Desconhecido';
        
        modalBody.innerHTML = `
            <!-- Client Information -->
            <div class="modal-section">
                <h4 class="modal-section-title">Informações do Cliente</h4>
                <div class="modal-detail">
                    <div class="modal-detail-label">Nome</div>
                    <div class="modal-detail-value">${client.name || 'N/A'}</div>
                </div>
                ${client.phone ? `
                <div class="modal-detail">
                    <div class="modal-detail-label">Telefone</div>
                    <div class="modal-detail-value">${client.phone}</div>
                </div>
                ` : ''}
                ${client.email ? `
                <div class="modal-detail">
                    <div class="modal-detail-label">Email</div>
                    <div class="modal-detail-value">${client.email}</div>
                </div>
                ` : ''}
            </div>
            
            <!-- Appointment Details -->
            <div class="modal-section">
                <h4 class="modal-section-title">Detalhes do Agendamento</h4>
                <div class="modal-detail">
                    <div class="modal-detail-label">Data e Hora</div>
                    <div class="modal-detail-value">${formatDateReadable(appointmentData.appointmentDate || appointment.appointmentDate)}</div>
                </div>
                <div class="modal-detail">
                    <div class="modal-detail-label">Status</div>
                    <div class="modal-detail-value">
                        <span class="status-badge status-${appointmentData.status || appointment.status}">${getStatusLabel(appointmentData.status || appointment.status)}</span>
                    </div>
                </div>
                ${appointmentData.totalDuration || appointment.totalDuration ? `
                <div class="modal-detail">
                    <div class="modal-detail-label">Duração Total</div>
                    <div class="modal-detail-value">${appointmentData.totalDuration || appointment.totalDuration} minutos</div>
                </div>
                ` : ''}
            </div>
            
            <!-- Procedures with Staff -->
            ${procedures.length > 0 ? `
            <div class="modal-section">
                <h4 class="modal-section-title">Procedimentos e Profissionais</h4>
                <div class="procedures-list">
                    ${procedures.map((proc, index) => {
                        const procedureName = proc.procedure?.name || proc.name || proc.procedureName || 'N/A';
                        const procedurePrice = proc.procedure?.price || proc.price || '0';
                        const procedureDuration = proc.procedure?.duration || proc.duration || 0;
                        
                        // Try multiple ways to get staff name - prioritize staffName from API
                        let staffName = 'Não atribuído';
                        
                        // First, try staffName (should be set by API or enrichment above)
                        if (proc.staffName) {
                            staffName = proc.staffName;
                        } 
                        // Second, try staff object
                        else if (proc.staff) {
                            if (typeof proc.staff === 'object' && proc.staff !== null) {
                                staffName = proc.staff.name || proc.staff.username || 'Staff sem nome';
                            } else if (typeof proc.staff === 'string') {
                                staffName = proc.staff;
                            }
                        } 
                        // Third, if we have staffId, try to get from staffMap (fallback)
                        else if (proc.staffId) {
                            const staffData = staffMap.get(proc.staffId);
                            if (staffData) {
                                staffName = staffData.name || staffData.username || 'Staff sem nome';
                            } else {
                                staffName = 'Não atribuído';
                            }
                        }
                        
                        // Log for debugging
                        console.log(`Procedure ${proc.procedureName || proc.name}: staffId=${proc.staffId}, staffName=${staffName}, hasStaff=${!!proc.staff}`);
                        
                        const staffId = proc.staffId || (proc.staff ? proc.staff.id : null);
                        
                        return `
                            <div class="procedure-item">
                                <div class="procedure-header">
                                    <div class="procedure-name">${procedureName}</div>
                                    <div class="procedure-price">R$ ${parseFloat(procedurePrice).toFixed(2)}</div>
                                </div>
                                <div class="procedure-details">
                                    <div class="procedure-detail">
                                        <span class="detail-label">Duração:</span>
                                        <span class="detail-value">${procedureDuration} min</span>
                                    </div>
                                    <div class="procedure-detail">
                                        <span class="detail-label">Profissional:</span>
                                        <span class="detail-value staff-name">${staffName}</span>
                                    </div>
                                </div>
                            </div>
                        `;
                    }).join('')}
                </div>
            </div>
            ` : ''}
            
            <!-- Payment Information -->
            <div class="modal-section">
                <h4 class="modal-section-title">Informações de Pagamento</h4>
                <div class="payment-grid">
                    <div class="payment-item">
                        <div class="modal-detail-label">Valor Total</div>
                        <div class="modal-detail-value payment-total">R$ ${totalAmount.toFixed(2)}</div>
                    </div>
                    <div class="payment-item">
                        <div class="modal-detail-label">Valor Pago</div>
                        <div class="modal-detail-value payment-paid">R$ ${paidAmount.toFixed(2)}</div>
                    </div>
                    <div class="payment-item">
                        <div class="modal-detail-label">Saldo Pendente</div>
                        <div class="modal-detail-value payment-balance">R$ ${outstandingBalance.toFixed(2)}</div>
                    </div>
                    <div class="payment-item">
                        <div class="modal-detail-label">Status do Pagamento</div>
                        <div class="modal-detail-value">
                            <span class="payment-status-badge payment-${paymentStatus}">${paymentStatusLabel}</span>
                        </div>
                    </div>
                </div>
            </div>
            
            <!-- Images -->
            ${(appointmentData.beforeImages?.length > 0 || appointmentData.afterImages?.length > 0) ? `
            <div class="modal-section">
                <h4 class="modal-section-title">Fotos</h4>
                <div class="images-grid">
                    ${appointmentData.beforeImages?.length > 0 ? `
                    <div class="images-group">
                        <div class="images-group-title">Antes</div>
                        <div class="images-list">
                            ${appointmentData.beforeImages.map((img, idx) => `
                                <img src="${img}" alt="Antes ${idx + 1}" class="appointment-image" />
                            `).join('')}
                        </div>
                    </div>
                    ` : ''}
                    ${appointmentData.afterImages?.length > 0 ? `
                    <div class="images-group">
                        <div class="images-group-title">Depois</div>
                        <div class="images-list">
                            ${appointmentData.afterImages.map((img, idx) => `
                                <img src="${img}" alt="Depois ${idx + 1}" class="appointment-image" />
                            `).join('')}
                        </div>
                    </div>
                    ` : ''}
                </div>
            </div>
            ` : ''}
            
            <!-- Notes -->
            ${appointmentData.notes ? `
            <div class="modal-section">
                <h4 class="modal-section-title">Observações</h4>
                <div class="modal-notes">${appointmentData.notes}</div>
            </div>
            ` : ''}
            
            
            <!-- Action Buttons -->
            <div class="modal-actions">
                <button id="editButton" class="btn-primary">Editar</button>
                <button id="closeButton" class="btn-secondary">Fechar</button>
            </div>
        `;
        
        // Setup event listeners for edit functionality
        setupEditListeners(fullData);
        
    } catch (error) {
        console.error('Error showing appointment details:', error);
        modalBody.innerHTML = `
            <div class="error-state">
                <p>Erro ao carregar detalhes do agendamento.</p>
                <button onclick="closeModal()" class="btn-secondary">Fechar</button>
            </div>
        `;
    }
}

// Setup edit listeners
function setupEditListeners(fullData) {
    const editButton = document.getElementById('editButton');
    const closeButton = document.getElementById('closeButton');
    
    if (editButton) {
        editButton.addEventListener('click', async () => {
            // Close details modal
            closeModal();
            
            // Open create appointment modal in edit mode
            await openEditAppointmentModal(fullData);
        });
    }
    
    if (closeButton) {
        closeButton.addEventListener('click', closeModal);
    }
}


// Close modal
function closeModal() {
    appointmentModal.style.display = 'none';
}

// Navigate to previous month
function goToPreviousMonth() {
    currentDate = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1);
    if (currentView === 'calendar') {
        renderCalendar();
    } else {
        renderListView();
    }
}

// Navigate to next month
function goToNextMonth() {
    currentDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1);
    if (currentView === 'calendar') {
        renderCalendar();
    } else {
        renderListView();
    }
}

// Go to today
function goToToday() {
    currentDate = new Date();
    if (currentView === 'calendar') {
        renderCalendar();
    } else {
        renderListView();
    }
}

// Update view based on current view mode
function updateView() {
    if (currentView === 'calendar') {
        if (calendarContainer) calendarContainer.style.display = 'block';
        if (listContainer) listContainer.style.display = 'none';
        renderCalendar();
    } else {
        if (calendarContainer) calendarContainer.style.display = 'none';
        if (listContainer) listContainer.style.display = 'block';
        renderListView();
    }
}

// Switch view mode
function switchView(view) {
    currentView = view;
    
    // Update button states
    if (view === 'calendar') {
        if (calendarViewBtn) calendarViewBtn.classList.add('active');
        if (listViewBtn) listViewBtn.classList.remove('active');
    } else {
        if (calendarViewBtn) calendarViewBtn.classList.remove('active');
        if (listViewBtn) listViewBtn.classList.add('active');
    }
    
    updateView();
}

// Render list view
function renderListView() {
    if (!listContent) return;
    
    // Usar window.appointments como fallback se appointments local estiver vazio
    const apps = (appointments && appointments.length > 0) ? appointments : (window.appointments || []);
    
    // Group appointments by date
    const appointmentsByDate = {};
    apps.forEach(apt => {
        const date = new Date(apt.appointmentDate);
        const dateKey = formatDate(date);
        
        if (!appointmentsByDate[dateKey]) {
            appointmentsByDate[dateKey] = [];
        }
        appointmentsByDate[dateKey].push(apt);
    });
    
    // Sort dates - mais recente primeiro (ordem decrescente)
    const sortedDates = Object.keys(appointmentsByDate).sort((a, b) => {
        const dateA = new Date(a);
        const dateB = new Date(b);
        return dateB - dateA; // Invertido para mais recente primeiro
    });
    
    // Get current month range
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    
    // Filter dates within current month
    const monthDates = sortedDates.filter(dateStr => {
        const date = new Date(dateStr);
        return date >= firstDay && date <= lastDay;
    });
    
    if (monthDates.length === 0) {
        listContent.innerHTML = '<div class="empty-list-state"><p>Nenhum agendamento neste mês</p></div>';
        return;
    }
    
    // Render list
    listContent.innerHTML = monthDates.map(dateStr => {
        const date = new Date(dateStr);
        const dayAppointments = appointmentsByDate[dateStr].sort((a, b) => {
            const timeA = new Date(a.appointmentDate).getTime();
            const timeB = new Date(b.appointmentDate).getTime();
            return timeB - timeA; // Invertido para mais recente primeiro
        });
        
        const dayName = date.toLocaleDateString('pt-BR', { weekday: 'long' });
        const dayNumber = date.getDate();
        const monthName = date.toLocaleDateString('pt-BR', { month: 'long' });
        
        return `
            <div class="list-day-group">
                <div class="list-day-header">
                    <div class="list-day-date">${dayNumber}</div>
                    <div class="list-day-name">${dayName}, ${monthName}</div>
                    <div class="list-day-count">${dayAppointments.length} ${dayAppointments.length === 1 ? 'agendamento' : 'agendamentos'}</div>
                </div>
                <div class="list-appointments">
                    ${dayAppointments.map(apt => {
                        const time = formatTime(apt.appointmentDate);
                        const statusClass = getStatusColorClass(apt.status);
                        const statusLabel = getStatusLabel(apt.status);
                        const clientName = apt.client?.name || 'Cliente não informado';
                        const procedures = apt.allProcedures || apt.service ? [apt.service] : [];
                        const procedureNames = procedures.map(p => p.name || p.procedureName || 'N/A').join(', ');
                        
                        return `
                            <div class="list-appointment-card" data-appointment-id="${apt.id}">
                                <div class="list-appointment-header">
                                    <div class="list-appointment-time">${time}</div>
                                    <div class="list-appointment-status ${statusClass}">${statusLabel}</div>
                                </div>
                                <div class="list-appointment-body">
                                    <div class="list-appointment-client">${clientName}</div>
                                    <div class="list-appointment-details">
                                        ${procedureNames ? `
                                            <div class="list-appointment-detail">
                                                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                                    <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/>
                                                    <polyline points="14 2 14 8 20 8"/>
                                                </svg>
                                                <span>${procedureNames}</span>
                                            </div>
                                        ` : ''}
                                        ${apt.totalAmount ? `
                                            <div class="list-appointment-detail">
                                                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                                    <line x1="12" y1="1" x2="12" y2="23"/>
                                                    <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
                                                </svg>
                                                <span>R$ ${parseFloat(apt.totalAmount || '0').toFixed(2)}</span>
                                            </div>
                                        ` : ''}
                                    </div>
                                </div>
                            </div>
                        `;
                    }).join('')}
                </div>
            </div>
        `;
    }).join('');
    
    // Add click listeners to appointment cards
    listContent.querySelectorAll('.list-appointment-card').forEach(card => {
        card.addEventListener('click', () => {
            const appointmentId = parseInt(card.dataset.appointmentId);
            const appointment = appointments.find(apt => apt.id === appointmentId);
            if (appointment) {
                showAppointmentDetails(appointment);
            }
        });
    });
}

// Logout
async function handleLogout() {
    try {
        const response = await fetch(`${API_BASE_URL}/api/logout`, {
            method: 'POST',
            credentials: 'include'
        });
        
        // Redirect to login regardless of response
        window.location.href = '/staff/';
    } catch (error) {
        console.error('Logout error:', error);
        // Redirect anyway
        window.location.href = '/staff/';
    }
}

// ==================== CREATE APPOINTMENT FORM ====================

// State for create appointment form
let clients = [];
let procedures = [];
let staff = [];
let selectedClient = null;
let selectedProcedureIds = [];
let procedureStaffMap = {};
let calculatedTotal = 0;
let calculatedDuration = 0;
let beforeImages = [];
let afterImages = [];
let editingAppointmentId = null; // Track if we're editing an appointment

// DOM Elements for create appointment
const createAppointmentModal = document.getElementById('createAppointmentModal');
const newAppointmentButton = document.getElementById('newAppointmentButton');
const closeCreateModalBtn = document.getElementById('closeCreateModal');
const cancelCreateAppointmentBtn = document.getElementById('cancelCreateAppointment');
const createAppointmentForm = document.getElementById('createAppointmentForm');
const clientSearchInput = document.getElementById('clientSearch');
const clientDropdown = document.getElementById('clientDropdown');
const selectedClientIdInput = document.getElementById('selectedClientId');
const selectedClientDisplay = document.getElementById('selectedClientDisplay');
const procedureSearchInput = document.getElementById('procedureSearch');
const procedureDropdown = document.getElementById('procedureDropdown');
const selectedProceduresDiv = document.getElementById('selectedProcedures');
const proceduresStaffTable = document.getElementById('proceduresStaffTable');
const proceduresStaffTableBody = document.getElementById('proceduresStaffTableBody');
const appointmentDateInput = document.getElementById('appointmentDate');
const appointmentTimeSelect = document.getElementById('appointmentTime');
const totalDurationSpan = document.getElementById('totalDuration');
const appointmentStatusSelect = document.getElementById('appointmentStatus');
const totalAmountInput = document.getElementById('totalAmount');
const paidAmountInput = document.getElementById('paidAmount');
const appointmentNotesTextarea = document.getElementById('appointmentNotes');
const createAppointmentError = document.getElementById('createAppointmentError');

// Fetch clients, procedures, and staff
async function fetchFormData() {
    try {
        const [clientsRes, proceduresRes, staffRes] = await Promise.all([
            fetch(`${API_BASE_URL}/api/clients`, { credentials: 'include' }),
            fetch(`${API_BASE_URL}/api/procedures`, { credentials: 'include' }),
            fetch(`${API_BASE_URL}/api/staff`, { credentials: 'include' })
        ]);

        if (clientsRes.ok) clients = await clientsRes.json();
        if (proceduresRes.ok) procedures = await proceduresRes.json();
        if (staffRes.ok) staff = await staffRes.json();
    } catch (error) {
        console.error('Error fetching form data:', error);
    }
}

// Open create appointment modal
function openCreateAppointmentModal() {
    editingAppointmentId = null;
    createAppointmentModal.style.display = 'flex';
    fetchFormData();
    resetCreateAppointmentForm();
    
    // Set default date to today
    const today = new Date();
    appointmentDateInput.value = today.toISOString().split('T')[0];
    
    // Change button text
    const submitButton = document.getElementById('submitCreateAppointment');
    if (submitButton) {
        submitButton.textContent = 'Criar Agendamento';
    }
    
    // Initialize time slots with all available hours (00:00 to 23:45)
    setTimeout(() => {
        initializeTimeSlots();
    }, 100);
}

// Open edit appointment modal (reuse create form)
async function openEditAppointmentModal(fullData) {
    const appointmentId = fullData.appointment?.id || fullData.id;
    editingAppointmentId = appointmentId;
    createAppointmentModal.style.display = 'flex';
    
    console.log('📋 Opening edit modal for appointment:', appointmentId);
    
    try {
        // Fetch full appointment data with procedures and staffId (same as React system)
        const apiUrl = `/api/appointments/${appointmentId}/with-procedures`;
        console.log('📡 Fetching from API:', apiUrl);
        
        const response = await fetch(apiUrl, {
            credentials: 'include'
        });
        
        if (!response.ok) {
            throw new Error('Failed to fetch appointment data');
        }
        
        const fullAppointmentData = await response.json();
        console.log('📋 Full appointment data loaded:', fullAppointmentData);
        
        // Fetch form data (clients, procedures, staff)
        await fetchFormData();
        
        const appointmentData = fullAppointmentData.appointment || fullData.appointment || fullData;
        const client = fullAppointmentData.client || appointmentData.client || {};
        const proceduresList = fullAppointmentData.procedures || appointmentData.procedures || [];
        
        console.log('📋 Client:', client);
        console.log('📋 Procedures:', proceduresList);
        
        // Set client
        selectedClient = client;
        if (clientSearchInput) {
            clientSearchInput.value = client.name || '';
        }
        if (selectedClientIdInput) {
            selectedClientIdInput.value = client.id || '';
        }
        updateClientDisplay();
        
        // Set procedures - use procedureId from appointment_procedures table
        const procIds = proceduresList.map(p => p.procedureId || p.id).filter(id => id && !isNaN(id));
        console.log('📋 Procedure IDs:', procIds);
        selectedProcedureIds = procIds;
        
        // Build procedure-staff map from appointment_procedures (with staffId from API)
        procedureStaffMap = {};
        if (proceduresList && proceduresList.length > 0) {
            console.log('📋 Processing procedures from API:', proceduresList);
            proceduresList.forEach(proc => {
                const procId = proc.procedureId || proc.id;
                const staffId = proc.staffId || null;
                console.log(`📋 Procedure ${procId}: staffId = ${staffId}`, proc);
                
                if (procId && !isNaN(procId)) {
                    if (staffId) {
                        procedureStaffMap[procId] = staffId;
                        console.log(`✅ Mapped procedure ${procId} -> staff ${staffId}`);
                    } else if (appointmentData.staffId) {
                        // Fallback: use appointment staffId if procedure has no staffId
                        console.log(`⚠️ Procedure ${procId} has no staffId, using appointment staffId: ${appointmentData.staffId}`);
                        procedureStaffMap[procId] = appointmentData.staffId;
                    }
                }
            });
        } else if (appointmentData.allProcedures) {
            // Fallback to allProcedures if API data structure is different
            console.log('📋 Using fallback: allProcedures from appointment');
            appointmentData.allProcedures.forEach(proc => {
                const procId = proc.id;
                const staffId = proc.staffId || appointmentData.staffId || null;
                if (procId && !isNaN(procId)) {
                    procedureStaffMap[procId] = staffId;
                }
            });
        }
        
        console.log('📋 Final Procedure-Staff Map:', procedureStaffMap);
        
        // Update UI
        updateSelectedProcedures();
        updateProceduresStaffTable();
        calculateTotals(); // Recalculate totals after setting procedures
        
        // Set date and time
        if (appointmentData.appointmentDate) {
            const appointmentDate = new Date(appointmentData.appointmentDate);
            const dateStr = appointmentDate.toISOString().split('T')[0];
            const hours = String(appointmentDate.getHours()).padStart(2, '0');
            const minutes = String(appointmentDate.getMinutes()).padStart(2, '0');
            const timeStr = `${hours}:${minutes}`;
            
            console.log('📋 Setting date/time:', { dateStr, timeStr });
            
            if (appointmentDateInput) {
                appointmentDateInput.value = dateStr;
            }
            
            // Set time after time slots are loaded
            setTimeout(() => {
                if (appointmentTimeSelect) {
                    appointmentTimeSelect.value = timeStr;
                    console.log('📋 Time set to:', timeStr);
                }
            }, 300);
        }
        
        // Set status
        if (appointmentStatusSelect) {
            appointmentStatusSelect.value = appointmentData.status || 'scheduled';
        }
        
        // Set amounts
        const totalAmount = parseFloat(appointmentData.totalAmount || appointmentData.totalPrice || '0');
        const paidAmount = parseFloat(appointmentData.paidAmount || '0');
        calculatedTotal = totalAmount;
        
        if (totalAmountInput) {
            totalAmountInput.value = totalAmount.toFixed(2);
        }
        if (paidAmountInput) {
            paidAmountInput.value = paidAmount.toFixed(2);
        }
        
        // Set notes
        if (appointmentNotesTextarea) {
            appointmentNotesTextarea.value = appointmentData.notes || '';
        }
        
        // Set images
        beforeImages = appointmentData.beforeImages || [];
        afterImages = appointmentData.afterImages || [];
        updateImagePreviews();
        
        // Calculate duration from procedures
        if (proceduresList.length > 0) {
            calculatedDuration = proceduresList.reduce((sum, p) => sum + (p.duration || 60), 0);
        } else {
            calculatedDuration = appointmentData.totalDuration || appointmentData.duration || 60;
        }
        if (totalDurationSpan) {
            totalDurationSpan.textContent = `${calculatedDuration} minutos`;
        }
        
        // Change button text
        const submitButton = document.getElementById('submitCreateAppointment');
        if (submitButton) {
            submitButton.textContent = 'Atualizar Agendamento';
        }
        
        // Initialize time slots
        setTimeout(() => {
            initializeTimeSlots();
        }, 100);
        
    } catch (error) {
        console.error('❌ Error loading appointment data:', error);
        alert('Erro ao carregar dados do agendamento: ' + error.message);
        closeCreateAppointmentModal();
    }
}

// Close create appointment modal
function closeCreateAppointmentModal() {
    createAppointmentModal.style.display = 'none';
    resetCreateAppointmentForm();
}

// Reset create appointment form
function resetCreateAppointmentForm() {
    editingAppointmentId = null;
    selectedClient = null;
    selectedProcedureIds = [];
    procedureStaffMap = {};
    calculatedTotal = 0;
    calculatedDuration = 0;
    beforeImages = [];
    afterImages = [];
    
    if (clientSearchInput) clientSearchInput.value = '';
    if (selectedClientIdInput) selectedClientIdInput.value = '';
    if (selectedClientDisplay) {
        selectedClientDisplay.style.display = 'none';
        selectedClientDisplay.innerHTML = '';
    }
    if (clientDropdown) clientDropdown.style.display = 'none';
    if (procedureSearchInput) procedureSearchInput.value = '';
    if (procedureDropdown) procedureDropdown.style.display = 'none';
    if (selectedProceduresDiv) selectedProceduresDiv.innerHTML = '';
    if (proceduresStaffTable) proceduresStaffTable.style.display = 'none';
    if (proceduresStaffTableBody) proceduresStaffTableBody.innerHTML = '';
    if (appointmentDateInput) appointmentDateInput.value = '';
    if (appointmentTimeSelect) appointmentTimeSelect.innerHTML = '<option value="">Selecione a hora</option>';
    if (totalDurationSpan) totalDurationSpan.textContent = '0 minutos';
    if (appointmentStatusSelect) appointmentStatusSelect.value = 'scheduled';
    if (totalAmountInput) totalAmountInput.value = '';
    if (paidAmountInput) paidAmountInput.value = '';
    if (appointmentNotesTextarea) appointmentNotesTextarea.value = '';
    if (createAppointmentError) {
        createAppointmentError.style.display = 'none';
        createAppointmentError.textContent = '';
    }
    
    updateImagePreviews();
    
    const beforeImagesInput = document.getElementById('beforeImages');
    const afterImagesInput = document.getElementById('afterImages');
    if (beforeImagesInput) beforeImagesInput.value = '';
    if (afterImagesInput) afterImagesInput.value = '';
    
    // Reset button text
    const submitButton = document.getElementById('submitCreateAppointment');
    if (submitButton) {
        submitButton.textContent = 'Criar Agendamento';
    }
}

// Client search
clientSearchInput.addEventListener('input', (e) => {
    const searchTerm = e.target.value.toLowerCase();
    if (searchTerm.length < 2) {
        clientDropdown.style.display = 'none';
        return;
    }
    
    const filtered = clients.filter(c => 
        c.name.toLowerCase().includes(searchTerm) ||
        (c.phone && c.phone.includes(searchTerm)) ||
        (c.email && c.email.toLowerCase().includes(searchTerm))
    );
    
    if (filtered.length > 0) {
        clientDropdown.innerHTML = filtered.slice(0, 10).map(client => `
            <div class="client-dropdown-item" data-client-id="${client.id}">
                <div class="client-name">${client.name}</div>
                ${client.phone ? `<div class="client-phone">${client.phone}</div>` : ''}
            </div>
        `).join('');
        clientDropdown.style.display = 'block';
        
        // Add click listeners
        clientDropdown.querySelectorAll('.client-dropdown-item').forEach(item => {
            item.addEventListener('click', () => {
                const clientId = parseInt(item.dataset.clientId);
                selectClient(clientId);
            });
        });
    } else {
        clientDropdown.style.display = 'none';
    }
});

// Select client
function selectClient(clientId) {
    selectedClient = clients.find(c => c.id === clientId);
    if (selectedClient) {
        updateClientDisplay();
    }
}

// Update client display
function updateClientDisplay() {
    if (selectedClient) {
        if (selectedClientIdInput) {
            selectedClientIdInput.value = selectedClient.id;
        }
        if (clientSearchInput) {
            clientSearchInput.value = selectedClient.name;
        }
        if (selectedClientDisplay) {
            selectedClientDisplay.innerHTML = `
                <div class="selected-client-info">
                    <strong>${selectedClient.name}</strong>
                    ${selectedClient.phone ? `<span>${selectedClient.phone}</span>` : ''}
                </div>
            `;
            selectedClientDisplay.style.display = 'block';
        }
        if (clientDropdown) {
            clientDropdown.style.display = 'none';
        }
    } else {
        if (selectedClientDisplay) {
            selectedClientDisplay.style.display = 'none';
            selectedClientDisplay.innerHTML = '';
        }
    }
}

// Procedure search
procedureSearchInput.addEventListener('input', (e) => {
    const searchTerm = e.target.value.toLowerCase();
    if (searchTerm.length < 2) {
        procedureDropdown.style.display = 'none';
        return;
    }
    
    const filtered = procedures.filter(p => 
        p.name.toLowerCase().includes(searchTerm) &&
        !selectedProcedureIds.includes(p.id)
    );
    
    if (filtered.length > 0) {
        procedureDropdown.innerHTML = filtered.slice(0, 10).map(proc => `
            <div class="procedure-dropdown-item" data-procedure-id="${proc.id}">
                <div class="procedure-name">${proc.name}</div>
                <div class="procedure-details">
                    ${proc.price ? `R$ ${parseFloat(proc.price).toFixed(2)}` : ''}
                    ${proc.duration ? ` • ${proc.duration} min` : ''}
                </div>
            </div>
        `).join('');
        procedureDropdown.style.display = 'block';
        
        // Add click listeners
        procedureDropdown.querySelectorAll('.procedure-dropdown-item').forEach(item => {
            item.addEventListener('click', () => {
                const procedureId = parseInt(item.dataset.procedureId);
                addProcedure(procedureId);
            });
        });
    } else {
        procedureDropdown.style.display = 'none';
    }
});

// Add procedure
function addProcedure(procedureId) {
    if (selectedProcedureIds.includes(procedureId)) return;
    
    selectedProcedureIds.push(procedureId);
    procedureSearchInput.value = '';
    procedureDropdown.style.display = 'none';
    
    updateSelectedProcedures();
    updateProceduresStaffTable();
    calculateTotals();
}

// Remove procedure
function removeProcedure(procedureId) {
    selectedProcedureIds = selectedProcedureIds.filter(id => id !== procedureId);
    delete procedureStaffMap[procedureId];
    updateSelectedProcedures();
    updateProceduresStaffTable();
    calculateTotals();
}

// Update selected procedures display
function updateSelectedProcedures() {
    selectedProceduresDiv.innerHTML = selectedProcedureIds.map(procId => {
        const proc = procedures.find(p => p.id === procId);
        if (!proc) return '';
        return `
            <div class="selected-procedure-item">
                <span>${proc.name}</span>
                <button type="button" class="remove-procedure-btn" data-procedure-id="${procId}">×</button>
            </div>
        `;
    }).join('');
    
    // Add remove listeners
    selectedProceduresDiv.querySelectorAll('.remove-procedure-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const procId = parseInt(btn.dataset.procedureId);
            removeProcedure(procId);
        });
    });
}

// Update procedures-staff table
function updateProceduresStaffTable() {
    if (selectedProcedureIds.length === 0) {
        if (proceduresStaffTable) {
            proceduresStaffTable.style.display = 'none';
        }
        return;
    }
    
    if (proceduresStaffTable) {
        proceduresStaffTable.style.display = 'block';
    }
    
    if (!proceduresStaffTableBody) return;
    
    proceduresStaffTableBody.innerHTML = selectedProcedureIds.map(procId => {
        const proc = procedures.find(p => p.id === procId);
        const selectedStaffId = procedureStaffMap[procId] || null;
        
        console.log(`📋 Rendering procedure ${procId} with staff ${selectedStaffId}`, {
            procName: proc?.name,
            staffCount: staff.length,
            foundStaff: staff.find(s => s.id === selectedStaffId)
        });
        
        return `
            <tr>
                <td>${proc ? proc.name : `Procedimento #${procId}`}</td>
                <td>
                    <select class="procedure-staff-select" data-procedure-id="${procId}">
                        <option value="">Selecione o profissional</option>
                        ${staff.map(s => `
                            <option value="${s.id}" ${selectedStaffId === s.id ? 'selected' : ''}>${s.name || s.username}</option>
                        `).join('')}
                    </select>
                </td>
            </tr>
        `;
    }).join('');
    
    // Add change listeners
    proceduresStaffTableBody.querySelectorAll('.procedure-staff-select').forEach(select => {
        select.addEventListener('change', (e) => {
            const procId = parseInt(e.target.dataset.procedureId);
            const staffId = e.target.value ? parseInt(e.target.value) : null;
            procedureStaffMap[procId] = staffId;
            console.log(`✅ Updated procedure ${procId} -> staff ${staffId}`);
            onProcedureStaffMapChange();
        });
    });
}

// Calculate totals
function calculateTotals() {
    calculatedTotal = 0;
    calculatedDuration = 0;
    
    selectedProcedureIds.forEach(procId => {
        const proc = procedures.find(p => p.id === procId);
        if (proc) {
            calculatedTotal += parseFloat(proc.price || '0');
            calculatedDuration += parseInt(proc.duration || '60');
        }
    });
    
    totalDurationSpan.textContent = `${calculatedDuration} minutos`;
    totalAmountInput.value = calculatedTotal.toFixed(2);
}

// Fetch available time slots
// For staff users, return all time slots from 00:00 to 23:45 (every 15 minutes)
async function fetchTimeSlots(date, staffId) {
    if (!date) return [];
    
    // For staff users, always return all time slots (00:00 to 23:45)
    const slots = [];
    
    // Generate all time slots from 00:00 to 23:45 (every 15 minutes)
    for (let hour = 0; hour < 24; hour++) {
        for (let minute = 0; minute < 60; minute += 15) {
            const timeString = `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
            slots.push({
                value: timeString,
                label: timeString
            });
        }
    }
    
    return slots;
}

// Update time slots when date changes
// For staff, always show all time slots (00:00 to 23:45)
async function updateTimeSlots() {
    const date = appointmentDateInput.value;
    
    if (!date) {
        appointmentTimeSelect.innerHTML = '<option value="">Selecione a data primeiro</option>';
        return;
    }
    
    appointmentTimeSelect.innerHTML = '<option value="">Carregando...</option>';
    const slots = await fetchTimeSlots(date);
    
    if (slots.length === 0) {
        appointmentTimeSelect.innerHTML = '<option value="">Nenhum horário disponível</option>';
    } else {
        appointmentTimeSelect.innerHTML = '<option value="">Selecione a hora</option>' +
            slots.map(slot => `<option value="${slot.value}">${slot.label}</option>`).join('');
    }
}

// Update time slots when date changes
appointmentDateInput.addEventListener('change', updateTimeSlots);

// Also update time slots when modal opens (if date is already set)
function initializeTimeSlots() {
    if (appointmentDateInput.value) {
        updateTimeSlots();
    }
}

// Update time slots when procedure-staff map changes (not needed for staff, but keeping for consistency)
function onProcedureStaffMapChange() {
    // For staff, time slots don't depend on staff selection, so no need to update
    // But we can keep this function for future use if needed
}

// Update image previews
function updateImagePreviews() {
    const beforePreview = document.getElementById('beforeImagesPreview');
    const afterPreview = document.getElementById('afterImagesPreview');
    
    if (beforePreview) {
        beforePreview.innerHTML = beforeImages.map((img, index) => `
            <div class="image-preview-item">
                <img src="${img}" alt="Antes ${index + 1}">
                <button type="button" class="remove-image-btn" data-index="${index}" data-type="before">×</button>
            </div>
        `).join('');
        
        // Add remove listeners
        beforePreview.querySelectorAll('.remove-image-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const index = parseInt(btn.dataset.index);
                beforeImages.splice(index, 1);
                updateImagePreviews();
            });
        });
    }
    
    if (afterPreview) {
        afterPreview.innerHTML = afterImages.map((img, index) => `
            <div class="image-preview-item">
                <img src="${img}" alt="Depois ${index + 1}">
                <button type="button" class="remove-image-btn" data-index="${index}" data-type="after">×</button>
            </div>
        `).join('');
        
        // Add remove listeners
        afterPreview.querySelectorAll('.remove-image-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const index = parseInt(btn.dataset.index);
                afterImages.splice(index, 1);
                updateImagePreviews();
            });
        });
    }
}

// Handle image uploads
const beforeImagesInput = document.getElementById('beforeImages');
const afterImagesInput = document.getElementById('afterImages');

if (beforeImagesInput) {
    beforeImagesInput.addEventListener('change', async (e) => {
        await handleImageUpload(e.target.files, 'before');
    });
}

if (afterImagesInput) {
    afterImagesInput.addEventListener('change', async (e) => {
        await handleImageUpload(e.target.files, 'after');
    });
}

async function handleImageUpload(files, type) {
    const imageArray = type === 'before' ? beforeImages : afterImages;
    
    for (let file of Array.from(files)) {
        if (file.type.startsWith('image/')) {
            // Convert to base64 for now (in production, upload to server)
            const reader = new FileReader();
            reader.onload = (e) => {
                const base64 = e.target.result;
                imageArray.push(base64);
                updateImagePreviews();
            };
            reader.readAsDataURL(file);
        }
    }
}

// Image tab switching
document.querySelectorAll('.image-tab').forEach(tab => {
    tab.addEventListener('click', () => {
        document.querySelectorAll('.image-tab').forEach(t => t.classList.remove('active'));
        document.querySelectorAll('.image-tab-content').forEach(c => c.style.display = 'none');
        
        tab.classList.add('active');
        const tabName = tab.dataset.tab;
        document.getElementById(`${tabName}ImagesTab`).style.display = 'block';
    });
});

// Create appointment
createAppointmentForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    // Validation
    if (!selectedClient) {
        showCreateError('Por favor, selecione um cliente');
        return;
    }
    
    if (selectedProcedureIds.length === 0) {
        showCreateError('Por favor, selecione pelo menos um procedimento');
        return;
    }
    
    const staffIds = Object.values(procedureStaffMap).filter(id => id !== null);
    if (staffIds.length === 0) {
        showCreateError('Por favor, selecione um profissional para pelo menos um procedimento');
        return;
    }
    
    if (!appointmentDateInput.value || !appointmentTimeSelect.value) {
        showCreateError('Por favor, selecione data e hora');
        return;
    }
    
    // Build appointment date time
    const appointmentDateTime = new Date(`${appointmentDateInput.value}T${appointmentTimeSelect.value}`);
    
    // Build procedure-staff associations
    const procedureStaffAssociations = {};
    selectedProcedureIds.forEach(procId => {
        const staffId = procedureStaffMap[procId];
        if (staffId) {
            procedureStaffAssociations[procId] = staffId;
        }
    });
    
    // Build payload
    const payload = {
        clientId: selectedClient.id,
        staffId: staffIds[0],
        staffIds: staffIds,
        procedureStaffMap: procedureStaffAssociations,
        appointmentDate: appointmentDateTime.toISOString(),
        status: appointmentStatusSelect.value,
        notes: appointmentNotesTextarea.value || '',
        procedureIds: selectedProcedureIds,
        totalAmount: calculatedTotal,
        totalDuration: calculatedDuration,
        beforeImages: beforeImages,
        afterImages: afterImages,
    };
    
    try {
        const submitBtn = document.getElementById('submitCreateAppointment');
        submitBtn.disabled = true;
        submitBtn.textContent = editingAppointmentId ? 'Atualizando...' : 'Criando...';
        
        // Add paidAmount to payload
        const paidAmount = parseFloat(paidAmountInput.value) || 0;
        const totalAmount = parseFloat(totalAmountInput.value) || calculatedTotal;
        
        // Calculate payment status
        let paymentStatus = 'pending';
        if (paidAmount >= totalAmount && totalAmount > 0) {
            paymentStatus = 'paid';
        } else if (paidAmount > 0) {
            paymentStatus = 'partial';
        }
        
        payload.paidAmount = paidAmount.toString();
        payload.paymentStatus = paymentStatus;
        
        let response;
        if (editingAppointmentId) {
            // Update existing appointment
            response = await fetch(`${API_BASE_URL}/api/appointments/${editingAppointmentId}/with-procedures`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include',
                body: JSON.stringify(payload)
            });
        } else {
            // Create new appointment
            response = await fetch(`${API_BASE_URL}/api/appointments/with-procedures`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include',
                body: JSON.stringify(payload)
            });
        }
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || (editingAppointmentId ? 'Erro ao atualizar agendamento' : 'Erro ao criar agendamento'));
        }
        
        // Success
        closeCreateAppointmentModal();
        await fetchAppointments(); // Refresh appointments list
        
        alert(editingAppointmentId ? 'Agendamento atualizado com sucesso!' : 'Agendamento criado com sucesso!');
    } catch (error) {
        console.error('Error saving appointment:', error);
        showCreateError(error.message || (editingAppointmentId ? 'Erro ao atualizar agendamento. Tente novamente.' : 'Erro ao criar agendamento. Tente novamente.'));
    } finally {
        const submitBtn = document.getElementById('submitCreateAppointment');
        submitBtn.disabled = false;
        submitBtn.textContent = editingAppointmentId ? 'Atualizar Agendamento' : 'Criar Agendamento';
    }
});

function showCreateError(message) {
    createAppointmentError.textContent = message;
    createAppointmentError.style.display = 'block';
}

// Event Listeners
prevMonthBtn.addEventListener('click', goToPreviousMonth);
nextMonthBtn.addEventListener('click', goToNextMonth);
todayBtn.addEventListener('click', goToToday);
logoutBtn.addEventListener('click', handleLogout);
closeModalBtn.addEventListener('click', closeModal);
retryButton.addEventListener('click', fetchAppointments);
newAppointmentButton.addEventListener('click', openCreateAppointmentModal);

// View toggle listeners
if (calendarViewBtn) {
    calendarViewBtn.addEventListener('click', () => switchView('calendar'));
}
if (listViewBtn) {
    listViewBtn.addEventListener('click', () => switchView('list'));
}

// Detect mobile and default to list view on mobile
function detectMobile() {
    return window.innerWidth <= 768;
}

// Fetch notifications
async function fetchNotifications() {
    try {
        const response = await fetch(`${API_BASE_URL}/api/staff/notifications`, {
            credentials: 'include'
        });
        
        if (response.ok) {
            notifications = await response.json();
            updateNotificationsUI();
        } else {
            console.error('Error fetching notifications:', response.statusText);
        }
    } catch (error) {
        console.error('Error fetching notifications:', error);
    }
}

// Update notifications UI
function updateNotificationsUI() {
    // Count unread notifications
    unreadCount = notifications.filter(n => !n.isRead || n.status === 'unread').length;
    
    // Update badge
    if (unreadCount > 0) {
        notificationBadge.textContent = unreadCount > 99 ? '99+' : unreadCount.toString();
        notificationBadge.style.display = 'block';
    } else {
        notificationBadge.style.display = 'none';
    }
    
    // Update notifications list
    if (notifications.length === 0) {
        notificationsList.style.display = 'none';
        notificationsEmpty.style.display = 'block';
    } else {
        notificationsList.style.display = 'block';
        notificationsEmpty.style.display = 'none';
        
        notificationsList.innerHTML = notifications.map(notification => {
            const isUnread = !notification.isRead || notification.status === 'unread';
            const date = new Date(notification.createdAt || notification.created_at);
            const timeAgo = getTimeAgo(date);
            
            return `
                <div class="notification-item ${isUnread ? 'unread' : ''}" data-notification-id="${notification.id}">
                    <div class="notification-icon">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
                            <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
                        </svg>
                    </div>
                    <div class="notification-content">
                        <div class="notification-title">${notification.title || 'Notificação'}</div>
                        <div class="notification-message">${notification.message || notification.content || ''}</div>
                        <div class="notification-time">${timeAgo}</div>
                    </div>
                </div>
            `;
        }).join('');
        
        // Add click listeners
        notificationsList.querySelectorAll('.notification-item').forEach(item => {
            item.addEventListener('click', async () => {
                const notificationId = parseInt(item.dataset.notificationId);
                await markNotificationAsRead(notificationId);
                
                // If notification has appointmentId, show appointment details
                const notification = notifications.find(n => n.id === notificationId);
                if (notification && notification.appointmentId) {
                    const appointment = appointments.find(a => a.id === notification.appointmentId);
                    if (appointment) {
                        showAppointmentDetails(appointment);
                        notificationsDropdown.style.display = 'none';
                    }
                }
            });
        });
    }
}

// Get time ago string
function getTimeAgo(date) {
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    
    if (diffMins < 1) return 'Agora';
    if (diffMins < 60) return `${diffMins} min atrás`;
    if (diffHours < 24) return `${diffHours}h atrás`;
    if (diffDays < 7) return `${diffDays} dias atrás`;
    
    return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
}

// Mark notification as read
async function markNotificationAsRead(notificationId) {
    try {
        const response = await fetch(`${API_BASE_URL}/api/notifications/${notificationId}/read`, {
            method: 'POST',
            credentials: 'include'
        });
        
        if (response.ok) {
            // Update local state
            const notification = notifications.find(n => n.id === notificationId);
            if (notification) {
                notification.isRead = true;
                notification.status = 'read';
            }
            updateNotificationsUI();
        }
    } catch (error) {
        console.error('Error marking notification as read:', error);
    }
}

// Mark all notifications as read
async function markAllNotificationsAsRead() {
    try {
        const response = await fetch(`${API_BASE_URL}/api/notifications/mark-read`, {
            method: 'POST',
            credentials: 'include'
        });
        
        if (response.ok) {
            // Update local state
            notifications.forEach(n => {
                n.isRead = true;
                n.status = 'read';
            });
            updateNotificationsUI();
        }
    } catch (error) {
        console.error('Error marking all notifications as read:', error);
    }
}

// Toggle notifications dropdown
if (notificationsButton) {
    notificationsButton.addEventListener('click', (e) => {
        e.stopPropagation();
        const isVisible = notificationsDropdown.style.display === 'block';
        notificationsDropdown.style.display = isVisible ? 'none' : 'block';
        
        if (!isVisible) {
            fetchNotifications();
        }
    });
}

// Close dropdown when clicking outside
document.addEventListener('click', (e) => {
    if (notificationsDropdown && notificationsButton) {
        if (!notificationsDropdown.contains(e.target) && !notificationsButton.contains(e.target)) {
            notificationsDropdown.style.display = 'none';
        }
    }
});

// Mark all as read button
if (markAllReadButton) {
    markAllReadButton.addEventListener('click', async (e) => {
        e.stopPropagation();
        await markAllNotificationsAsRead();
    });
}

// Set initial view based on device
if (detectMobile()) {
    currentView = 'list';
    if (listViewBtn) listViewBtn.classList.add('active');
    if (calendarViewBtn) calendarViewBtn.classList.remove('active');
}
closeCreateModalBtn.addEventListener('click', closeCreateAppointmentModal);
cancelCreateAppointmentBtn.addEventListener('click', closeCreateAppointmentModal);

// Close create modal when clicking overlay
createAppointmentModal.addEventListener('click', (e) => {
    if (e.target.classList.contains('modal-overlay')) {
        closeCreateAppointmentModal();
    }
});

// Close dropdowns when clicking outside
document.addEventListener('click', (e) => {
    if (!clientSearchInput.contains(e.target) && !clientDropdown.contains(e.target)) {
        clientDropdown.style.display = 'none';
    }
    if (!procedureSearchInput.contains(e.target) && !procedureDropdown.contains(e.target)) {
        procedureDropdown.style.display = 'none';
    }
});

// Close modal when clicking overlay
appointmentModal.addEventListener('click', (e) => {
    if (e.target.classList.contains('modal-overlay')) {
        closeModal();
    }
});

// Close modal with Escape key
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && appointmentModal.style.display !== 'none') {
        closeModal();
    }
});

// Initialize - wait for DOM to be ready
function initializeDashboard() {
    // #region agent log
    fetch('http://127.0.0.1:7243/ingest/4da6fc2e-4d2c-4115-959d-5ca3885558f2',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'dashboard.js:initializeDashboard',message:'initializeDashboard() chamada',data:{timestamp:Date.now()},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
    // #endregion
    (async () => {
        try {
            console.log('[Dashboard] Inicializando dashboard...');
            
            // Always try to check session, but don't block on it
            // #region agent log
            fetch('http://127.0.0.1:7243/ingest/4da6fc2e-4d2c-4115-959d-5ca3885558f2',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'dashboard.js:checkSession-call',message:'Chamando checkSession()',data:{timestamp:Date.now()},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
            // #endregion
            const isAuthenticated = await checkSession().catch(err => {
                // #region agent log
                fetch('http://127.0.0.1:7243/ingest/4da6fc2e-4d2c-4115-959d-5ca3885558f2',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'dashboard.js:checkSession-error',message:'checkSession() falhou',data:{error:err?.message||String(err)},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
                // #endregion
                console.warn('[Dashboard] Erro ao verificar sessão, continuando mesmo assim:', err);
                return false;
            });
            // #region agent log
            fetch('http://127.0.0.1:7243/ingest/4da6fc2e-4d2c-4115-959d-5ca3885558f2',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'dashboard.js:checkSession-result',message:'checkSession() resultado',data:{isAuthenticated},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
            // #endregion
            console.log('[Dashboard] Resultado checkSession:', isAuthenticated);
            
            // Set initial view based on device
            if (detectMobile()) {
                currentView = 'list';
                if (listViewBtn) listViewBtn.classList.add('active');
                if (calendarViewBtn) calendarViewBtn.classList.remove('active');
            }
            
            // ALWAYS try to fetch appointments - this is the critical call
            // The API /api/staff/appointments will handle authentication
            // Esta rota retorna APENAS os agendamentos onde o staff está vinculado a procedimentos
            console.log('[Dashboard] Carregando agendamentos da API do staff (/api/staff/appointments)...');
            console.log('[Dashboard] Esta rota filtra agendamentos onde o staff está vinculado a procedimentos');
            
            // Verificar se já foram carregados pelo script inline
            if (window._staffAppointments && Array.isArray(window._staffAppointments) && window._staffAppointments.length > 0) {
                console.log('[Dashboard] Usando agendamentos já carregados pelo script inline:', window._staffAppointments.length);
                appointments = window._staffAppointments;
                window.appointments = window._staffAppointments;
                hideLoading();
                if (currentView === 'calendar') {
                    renderCalendar();
                } else {
                    renderListView();
                }
            } else {
                // #region agent log
                fetch('http://127.0.0.1:7243/ingest/4da6fc2e-4d2c-4115-959d-5ca3885558f2',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'dashboard.js:fetchAppointments-call',message:'Chamando fetchAppointments()',data:{timestamp:Date.now()},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
                // #endregion
                await fetchAppointments().catch(err => {
                    // #region agent log
                    fetch('http://127.0.0.1:7243/ingest/4da6fc2e-4d2c-4115-959d-5ca3885558f2',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'dashboard.js:fetchAppointments-error',message:'fetchAppointments() falhou',data:{error:err?.message||String(err),stack:err?.stack},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
                    // #endregion
                    console.error('[Dashboard] Erro ao carregar agendamentos:', err);
                    // Show error state but don't block
                });
            }
            // #region agent log
            fetch('http://127.0.0.1:7243/ingest/4da6fc2e-4d2c-4115-959d-5ca3885558f2',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'dashboard.js:fetchAppointments-complete',message:'fetchAppointments() concluída',data:{appointmentsCount:appointments.length},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
            // #endregion
            console.log('[Dashboard] Processo de carregamento de agendamentos concluído. Total:', appointments.length);
            
            // Try to fetch notifications (non-blocking)
            if (isAuthenticated) {
                console.log('[Dashboard] Carregando notificações...');
                fetchNotifications().catch(err => {
                    console.warn('[Dashboard] Erro ao carregar notificações:', err);
                });
                
                // Refresh notifications every 30 seconds
                setInterval(() => {
                    fetchNotifications().catch(err => {
                        console.warn('[Dashboard] Erro ao atualizar notificações:', err);
                    });
                }, 30000);
            }
        } catch (error) {
            console.error('[Dashboard] Erro crítico na inicialização:', error);
            console.error('[Dashboard] Stack trace:', error.stack);
            
            // Last resort: try to fetch appointments anyway
            console.log('[Dashboard] Tentativa final de carregar agendamentos...');
            try {
                await fetchAppointments();
            } catch (fetchError) {
                console.error('[Dashboard] Falha ao carregar agendamentos após erro crítico:', fetchError);
                // Show error state to user
                showError();
            }
        }
    })();
}

// Inicialização antiga removida - agora usamos a inicialização simples no final do arquivo

// Inicialização: quando o DOM estiver pronto, chamar fetchAppointments() imediatamente
// A função fetchAppointments() chama /api/staff/appointments que filtra agendamentos
// onde o staff está vinculado a procedimentos
(function initDashboard() {
    function startDashboard() {
        console.log('[Dashboard] Inicializando dashboard...');
        // Chamar fetchAppointments() imediatamente - esta é a rota correta do staff
        fetchAppointments().catch(err => {
            console.error('[Dashboard] Erro ao carregar agendamentos:', err);
        });
    }
    
    // Se o DOM já estiver pronto, iniciar imediatamente
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', startDashboard);
    } else {
        // DOM já está pronto
        startDashboard();
    }
})();

