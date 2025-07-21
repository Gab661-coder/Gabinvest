// Global variables
let currentUser = null;
let users = JSON.parse(localStorage.getItem('investnaira_users')) || [];

// DOM elements
const loginBtn = document.getElementById('loginBtn');
const signupBtn = document.getElementById('signupBtn');
const logoutBtn = document.getElementById('logoutBtn');
const dashboardLink = document.getElementById('dashboardLink');
const loginModal = document.getElementById('loginModal');
const signupModal = document.getElementById('signupModal');
const paymentModal = document.getElementById('paymentModal');
const dashboardSection = document.getElementById('dashboard');

// Initialize app
document.addEventListener('DOMContentLoaded', function() {
    checkLoginStatus();
    setupEventListeners();
});

// Event listeners
function setupEventListeners() {
    // Navigation
    loginBtn.addEventListener('click', () => showModal('loginModal'));
    signupBtn.addEventListener('click', () => showModal('signupModal'));
    logoutBtn.addEventListener('click', logout);
    
    // Forms
    document.getElementById('loginForm').addEventListener('submit', handleLogin);
    document.getElementById('signupForm').addEventListener('submit', handleSignup);
    document.getElementById('makeInvestmentBtn').addEventListener('click', makeInvestment);
    document.getElementById('confirmPaymentBtn').addEventListener('click', confirmPayment);
    
    // Investment buttons
    document.querySelectorAll('.invest-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            if (!currentUser) {
                showModal('loginModal');
                return;
            }
            const plan = e.target.dataset.plan;
            showInvestmentModal(plan);
        });
    });
    
    // Modal close buttons
    document.querySelectorAll('.close').forEach(closeBtn => {
        closeBtn.addEventListener('click', (e) => {
            e.target.closest('.modal').style.display = 'none';
        });
    });
    
    // Dashboard link
    dashboardLink.addEventListener('click', (e) => {
        e.preventDefault();
        showDashboard();
    });
}

// Authentication functions
function handleLogin(e) {
    e.preventDefault();
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;
    
    const user = users.find(u => u.email === email && u.password === password);
    
    if (user) {
        currentUser = user;
        localStorage.setItem('investnaira_currentUser', JSON.stringify(user));
        updateUI();
        hideModal('loginModal');
        showNotification('Login successful!', 'success');
    } else {
        showNotification('Invalid credentials!', 'error');
    }
}

function handleSignup(e) {
    e.preventDefault();
    const name = document.getElementById('signupName').value;
    const email = document.getElementById('signupEmail').value;
    const phone = document.getElementById('signupPhone').value;
    const password = document.getElementById('signupPassword').value;
    
    // Check if user already exists
    if (users.find(u => u.email === email)) {
        showNotification('User already exists!', 'error');
        return;
    }
    
    // Create new user with welcome bonus
    const newUser = {
        id: Date.now(),
        name,
        email,
        phone,
        password,
        balance: 1000, // Welcome bonus
        totalInvested: 0,
        totalReturns: 0,
        investments: [],
        joinDate: new Date().toISOString()
    };
    
    users.push(newUser);
    localStorage.setItem('investnaira_users', JSON.stringify(users));
    
    currentUser = newUser;
    localStorage.setItem('investnaira_currentUser', JSON.stringify(newUser));
    
    updateUI();
    hideModal('signupModal');
    showNotification('Account created! Welcome bonus of ₦1,000 added!', 'success');
}

function logout() {
    currentUser = null;
    localStorage.removeItem('investnaira_currentUser');
    updateUI();
    showNotification('Logged out successfully!', 'success');
}

function checkLoginStatus() {
    const savedUser = localStorage.getItem('investnaira_currentUser');
    if (savedUser) {
        currentUser = JSON.parse(savedUser);
        updateUI();
    }
}

// UI functions
function updateUI() {
    if (currentUser) {
        loginBtn.style.display = 'none';
        signupBtn.style.display = 'none';
        logoutBtn.style.display = 'block';
        dashboardLink.style.display = 'block';
        updateDashboard();
    } else {
        loginBtn.style.display = 'block';
        signupBtn.style.display = 'block';
        logoutBtn.style.display = 'none';
        dashboardLink.style.display = 'none';
        dashboardSection.style.display = 'none';
    }
}

function updateDashboard() {
    if (!currentUser) return;
    
    document.getElementById('userBalance').textContent = `₦${currentUser.balance.toLocaleString()}`;
    document.getElementById('totalInvested').textContent = `₦${currentUser.totalInvested.toLocaleString()}`;
    document.getElementById('totalReturns').textContent = `₦${currentUser.totalReturns.toLocaleString()}`;
}

function showDashboard() {
    dashboardSection.style.display = 'block';
    dashboardSection.scrollIntoView({ behavior: 'smooth' });
}

function showModal(modalId) {
    document.getElementById(modalId).style.display = 'block';
}

function hideModal(modalId) {
    document.getElementById(modalId).style.display = 'none';
}

// Investment functions
function makeInvestment() {
    if (!currentUser) {
        showNotification('Please login first!', 'error');
        return;
    }
    
    const plan = document.getElementById('investmentPlan').value;
    const amount = parseInt(document.getElementById('investmentAmount').value);
    
    const planDetails = {
        starter: { min: 5000, rate: 0.12, duration: 30 },
        premium: { min: 20000, rate: 0.18, duration: 60 },
        elite: { min: 100000, rate: 0.25, duration: 90 }
    };
    
    const selectedPlan = planDetails[plan];
    
    if (amount < selectedPlan.min) {
        showNotification(`Minimum investment for ${plan} plan is ₦${selectedPlan.min.toLocaleString()}`, 'error');
        return;
    }
    
    // Show payment modal
    document.getElementById('paymentAmount').textContent = `₦${amount.toLocaleString()}`;
    showModal('paymentModal');
    
    // Store pending investment
    window.pendingInvestment = { plan, amount, planDetails: selectedPlan };
}

function confirmPayment() {
    const paymentProof = document.getElementById('paymentProof').files[0];
    
    if (!paymentProof) {
        showNotification('Please upload payment proof!', 'error');
        return;
    }
    
    if (!window.pendingInvestment) {
        showNotification('No pending investment found!', 'error');
        return;
    }
    
    // Simulate payment processing
    const investment = {
        id: Date.now(),
        plan: window.pendingInvestment.plan,
        amount: window.pendingInvestment.amount,
        rate: window.pendingInvestment.planDetails.rate,
        duration: window.pendingInvestment.planDetails.duration,
        startDate: new Date().toISOString(),
        status: 'active'
    };
    
    // Update user data
    currentUser.investments.push(investment);
    currentUser.totalInvested += investment.amount;
    
    // Update users array
    const userIndex = users.findIndex(u => u.id === currentUser.id);
    if (userIndex !== -1) {
        users[userIndex] = currentUser;
        localStorage.setItem('investnaira_users', JSON.stringify(users));
        localStorage.setItem('investnaira_currentUser', JSON.stringify(currentUser));
    }
    
    updateDashboard();
    hideModal('paymentModal');
    showNotification('Investment successful! Payment is being processed.', 'success');
    
    // Clear form
    document.getElementById('investmentAmount').value = '';
    document.getElementById('paymentProof').value = '';
    window.pendingInvestment = null;
}

// Utility functions
function showNotification(message, type) {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    
    // Style the notification
    notification.style.cssText = `
        position: fixed;
        top: 100px;
        right: 20px;
        padding: 1rem 2rem;
        border-radius: 5px;
        color: white;
        font-weight: bold;
        z-index: 3000;
        animation: slideIn 0.3s ease;
        ${type === 'success' ? 'background: #00ff88;' : 'background: #ff4444;'}
    `;
    
    document.body.appendChild(notification);
    
    // Remove after 3 seconds
    setTimeout(() => {
        notification.remove();
    }, 3000);
}

// Add CSS animation
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
`;
document.head.appendChild(style);
