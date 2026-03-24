// API base URL - ajuste conforme necessário
const API_BASE_URL = window.location.origin;

// Get form elements
const loginForm = document.getElementById('loginForm');
const usernameInput = document.getElementById('username');
const passwordInput = document.getElementById('password');
const loginButton = document.getElementById('loginButton');
const buttonText = document.getElementById('buttonText');
const buttonLoader = document.getElementById('buttonLoader');
const errorMessage = document.getElementById('errorMessage');

// Show error message
function showError(message) {
    errorMessage.textContent = message;
    errorMessage.style.display = 'block';
}

// Hide error message
function hideError() {
    errorMessage.style.display = 'none';
}

// Set loading state
function setLoading(isLoading) {
    loginButton.disabled = isLoading;
    usernameInput.disabled = isLoading;
    passwordInput.disabled = isLoading;
    
    if (isLoading) {
        buttonText.style.display = 'none';
        buttonLoader.style.display = 'flex';
    } else {
        buttonText.style.display = 'inline';
        buttonLoader.style.display = 'none';
    }
}

// Handle login form submission
loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const username = usernameInput.value.trim();
    const password = passwordInput.value;
    
    // Validate inputs
    if (!username || !password) {
        showError('Por favor, preencha todos os campos');
        return;
    }
    
    // Hide previous errors
    hideError();
    
    // Set loading state
    setLoading(true);
    
    try {
        // Make login request
        const response = await fetch(`${API_BASE_URL}/api/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            credentials: 'include', // Important for cookies/session
            body: JSON.stringify({
                username: username,
                password: password
            })
        });
        
        const data = await response.json();
        
        if (!response.ok) {
            // Login failed
            throw new Error(data.message || 'Credenciais inválidas');
        }
        
        // Login successful
        console.log('Login successful:', data);
        
        // Check if user is staff - be more flexible with the check
        // Staff users might have userType='staff' or accessLevel='staff' or be from staff table
        const isStaff = data.userType === 'staff' || 
                       data.accessLevel === 'staff' || 
                       (data.role && data.role !== 'admin') ||
                       !data.userType; // If no userType, assume staff (from staff table)
        
        if (isStaff) {
            // Redirect to staff dashboard
            window.location.href = '/staff/dashboard.html';
        } else {
            showError('Acesso negado. Esta área é apenas para equipes.');
        }
        
    } catch (error) {
        console.error('Login error:', error);
        showError(error.message || 'Erro ao fazer login. Tente novamente.');
    } finally {
        setLoading(false);
    }
});

// Check if user is already logged in
async function checkSession() {
    try {
        const response = await fetch(`${API_BASE_URL}/api/user`, {
            method: 'GET',
            credentials: 'include'
        });
        
        if (response.ok) {
            const user = await response.json();
            // If user is staff and already logged in, redirect
            if (user.userType === 'staff' || user.accessLevel === 'staff') {
                // TODO: Redirect to staff dashboard
                // window.location.href = '/staff/dashboard.html';
            }
        }
    } catch (error) {
        // User is not logged in, continue showing login form
        console.log('No active session');
    }
}

// Check session on page load
checkSession();

