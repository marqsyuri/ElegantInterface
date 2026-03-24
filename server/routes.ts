import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { procedureStorage } from "./procedures";
import { setupAuth, isAuthenticated, isAdmin, isStaff, getEffectiveUserId, hashPasswordMD5 } from "./auth";
import { hashPassword, isClientAuthenticated } from "./clientAuth";
import passport from "passport";
import { ObjectStorageService, ObjectNotFoundError } from "./objectStorage";
import {
  insertClientSchema,
  insertServiceSchema,
  insertAppointmentSchema,
  insertClinicalRecordSchema,
  insertTransactionSchema,
  insertCampaignSchema,
  insertMessageSchema,
  insertFeedbackSchema,
  insertInventorySchema,
  insertLoyaltyPackageSchema,
  insertStaffSchema,
  insertStaffScheduleSchema,
  insertMarketingCampaignSchema,
  insertProcedureSchema,
  updateProcedureSchema,
  insertPaymentSchema,
  insertSocialMediaPostSchema,
  insertIntegrationSchema,
  insertProductSchema,
  updateProductSchema,
  insertSaleSchema,
  insertBannerSchema,
  insertPackageSchema,
  insertLoyaltySettingsSchema,
  users,
  companies,
  clients,
  appointments,
  services,
  notifications,
  procedures,
  staff,
  businessHours,
  clinicalRecords,
  transactions,
  inventory,
  messages,
  integrations,
  appointmentProcedures,
  appointmentStaff,
  appointmentProducts,
  payments,
  products,
  sales,
} from "@shared/schema";
import { db } from "./db";
import { eq, and, gte, lte, or, asc, inArray, desc, isNull, isNotNull, between, sql, like } from "drizzle-orm";

// Utility function to generate unique ID
function generateUniqueId(): string {
  return Math.random().toString(36).substring(2, 10) + Date.now().toString(36);
}

// Function to generate dynamic booking page HTML
function generateBookingPage(company: any, businessHours: any[]): string {
  const clinicName = company.clinicName || 'Beauty Salon';
  const publicLink = company.publicLink || 'default';
  const specialties = company.specialties || 'Hair, Beauty, Wellness';
  const address = company.clinicAddress || 'Address not provided';
  const phone = company.clinicPhone || 'Phone not provided';
  const whatsapp = company.clinicWhatsapp || phone;
  const heroImage = company.heroImageUrl || 'https://images.unsplash.com/photo-1560066984-138dadb4c035?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80';
  const profileImage = company.profileImageUrl || 'https://images.unsplash.com/photo-1494790108755-2616b612b786?ixlib=rb-4.0.3&auto=format&fit=crop&w=150&q=80';
  
  // Format business hours
  const hoursText = businessHours
    .filter(h => h.isOpen)
    .map(h => `${h.dayOfWeek.charAt(0).toUpperCase() + h.dayOfWeek.slice(1)}: ${h.openTime} - ${h.closeTime}`)
    .join(', ');

  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${clinicName} - Agende seu Horário</title>
    <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&family=Playfair+Display:wght@400;700&display=swap" rel="stylesheet">
    <link href="https://fonts.googleapis.com/icon?family=Material+Icons" rel="stylesheet">
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        body {
            font-family: 'Poppins', sans-serif;
            background-color: #f8f8f8;
            color: #333;
        }
        .slide {
            width: 100%;
            max-width: 720px;
            min-height: 100vh;
            margin: 0 auto;
            background: linear-gradient(rgba(0, 0, 0, 0.4), rgba(0, 0, 0, 0.4)), url('${heroImage}');
            background-size: cover;
            background-position: center;
            display: flex;
            flex-direction: column;
            overflow: hidden;
            position: relative;
        }
        .header {
            padding: 40px 30px 20px;
            text-align: center;
        }
        .logo {
            width: 80px;
            height: 80px;
            background-color: #fff;
            border-radius: 50%;
            margin: 0 auto 20px;
            display: flex;
            align-items: center;
            justify-content: center;
            box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
            background-image: url('${profileImage}');
            background-size: cover;
            background-position: center;
        }
        .logo i {
            font-size: 40px;
            color: #e91e63;
        }
        .title {
            font-family: 'Playfair Display', serif;
            font-size: 32px;
            font-weight: 700;
            color: #fff;
            margin-bottom: 10px;
            text-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
        }
        .tagline {
            font-size: 18px;
            color: #fff;
            margin-bottom: 40px;
            max-width: 80%;
            margin-left: auto;
            margin-right: auto;
        }
        .cta-button {
            background-color: #e91e63;
            color: white;
            border: none;
            padding: 18px 30px;
            font-size: 20px;
            font-weight: 600;
            border-radius: 50px;
            cursor: pointer;
            margin: 0 auto 40px;
            box-shadow: 0 4px 15px rgba(233, 30, 99, 0.3);
            transition: all 0.3s ease;
            display: block;
            width: 70%;
            text-align: center;
            text-decoration: none;
        }
        .cta-button:hover {
            background-color: #d81b60;
            transform: translateY(-2px);
            box-shadow: 0 6px 20px rgba(233, 30, 99, 0.4);
        }
        .features {
            display: flex;
            justify-content: space-around;
            padding: 0 30px 40px;
        }
        .feature {
            text-align: center;
            color: white;
        }
        .feature i {
            font-size: 30px;
            margin-bottom: 10px;
        }
        .feature p {
            font-size: 14px;
        }
        .info-section {
            background-color: rgba(255, 255, 255, 0.95);
            margin: 20px 30px;
            padding: 20px;
            border-radius: 15px;
            box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
        }
        .info-title {
            font-size: 18px;
            font-weight: 600;
            color: #e91e63;
            margin-bottom: 15px;
            display: flex;
            align-items: center;
        }
        .info-title i {
            margin-right: 10px;
        }
        .info-item {
            display: flex;
            align-items: center;
            margin-bottom: 10px;
            font-size: 14px;
            color: #666;
        }
        .info-item i {
            color: #e91e63;
            margin-right: 10px;
            width: 20px;
        }
        .login-button {
            position: absolute;
            top: 20px;
            right: 20px;
            background-color: rgba(255, 255, 255, 0.95);
            color: #e91e63;
            border: none;
            padding: 10px 20px;
            font-size: 14px;
            font-weight: 600;
            border-radius: 25px;
            cursor: pointer;
            box-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
            transition: all 0.3s ease;
            text-decoration: none;
            display: flex;
            align-items: center;
            gap: 5px;
        }
        .login-button:hover {
            background-color: #fff;
            transform: translateY(-2px);
            box-shadow: 0 4px 15px rgba(0, 0, 0, 0.3);
        }
        .login-button i {
            font-size: 18px;
        }
        .bottom-nav {
            position: absolute;
            bottom: 0;
            left: 0;
            right: 0;
            background-color: rgba(255, 255, 255, 0.9);
            display: flex;
            justify-content: space-around;
            padding: 15px 0;
            box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.1);
        }
        .nav-item {
            display: flex;
            flex-direction: column;
            align-items: center;
            color: #666;
            text-decoration: none;
        }
        .nav-item.active {
            color: #e91e63;
        }
        .nav-item i {
            font-size: 24px;
            margin-bottom: 5px;
        }
        .nav-item span {
            font-size: 12px;
        }
        @media (max-width: 768px) {
            .slide {
                width: 100%;
                min-height: 100vh;
            }
            .title {
                font-size: 28px;
            }
            .tagline {
                font-size: 16px;
            }
            .cta-button {
                width: 85%;
                font-size: 18px;
            }
            .features {
                flex-direction: column;
                gap: 20px;
            }
        }
    </style>
</head>
<body>
    <div class="slide">
        <a href="/booking/${publicLink}/login" class="login-button" id="loginButton">
            <i class="material-icons">person</i>
            <span>Entrar</span>
        </a>
        
        <div class="header">
            <div class="logo">
                <i class="material-icons">spa</i>
            </div>
            <h1 class="title">${clinicName}</h1>
            <p class="tagline">${specialties}</p>
        </div>
        
        <a href="/booking/${publicLink}/services" class="cta-button">Agendar Agora</a>
        
        <div class="features">
            <div class="feature">
                <i class="material-icons">star</i>
                <p>Serviços Premium</p>
            </div>
            <div class="feature">
                <i class="material-icons">people</i>
                <p>Especialistas</p>
            </div>
            <div class="feature">
                <i class="material-icons">schedule</i>
                <p>Agendamento Flexível</p>
            </div>
        </div>
        
        <div class="info-section">
            <div class="info-title">
                <i class="material-icons">location_on</i>
                Informações de Contato
            </div>
            <div class="info-item">
                <i class="material-icons">place</i>
                <span>${address}</span>
            </div>
            <div class="info-item">
                <i class="material-icons">phone</i>
                <span>${phone}</span>
            </div>
            <div class="info-item">
                <i class="material-icons">schedule</i>
                <span>${hoursText}</span>
            </div>
        </div>
        
        <div class="bottom-nav">
            <a href="#" class="nav-item active">
                <i class="material-icons">home</i>
                <span>Início</span>
            </a>
            <a href="#services" class="nav-item">
                <i class="material-icons">content_cut</i>
                <span>Serviços</span>
            </a>
            <a href="#about" class="nav-item">
                <i class="material-icons">info</i>
                <span>Sobre</span>
            </a>
            <a href="#contact" class="nav-item">
                <i class="material-icons">contact_phone</i>
                <span>Contato</span>
            </a>
        </div>
    </div>
    
    <script>
        // Check if client is logged in
        fetch('/api/client/me')
            .then(res => res.ok ? res.json() : null)
            .then(client => {
                if (client) {
                    const loginBtn = document.getElementById('loginButton');
                    loginBtn.href = '/booking/${publicLink}/dashboard';
                    loginBtn.querySelector('span').textContent = 'Meus Agendamentos';
                }
            })
            .catch(() => {});
        
        // Smooth scrolling for navigation
        document.querySelectorAll('a[href^="#"]').forEach(anchor => {
            anchor.addEventListener('click', function (e) {
                e.preventDefault();
                const target = document.querySelector(this.getAttribute('href'));
                if (target) {
                    target.scrollIntoView({
                        behavior: 'smooth'
                    });
                }
            });
        });
    </script>
</body>
</html>`;
}

// Function to generate dynamic services page HTML
function generateServicesPage(company: any, procedures: any[]): string {
  const clinicName = company.clinicName || 'Beauty Salon';
  const publicLink = company.publicLink;
  
  // Group procedures by category
  const groupedProcedures: Record<string, any[]> = {};
  procedures.forEach(proc => {
    if (!groupedProcedures[proc.category]) {
      groupedProcedures[proc.category] = [];
    }
    groupedProcedures[proc.category].push(proc);
  });
  
  // Get unique categories for filter
  const categories = Object.keys(groupedProcedures).sort();
  
  // Generate procedure items HTML
  const procedureItems = procedures.map(proc => {
  /* Generate Services Page Translations */
    const price = proc.price ? `R$ ${parseFloat(proc.price).toFixed(2)}` : 'Preço sob consulta';
    const duration = proc.duration ? `${proc.duration} min` : 'Duração varia';
    const description = proc.description || '';
    const truncatedDesc = description.length > 100 ? description.substring(0, 100) + '...' : description;
    
    return `
      <div class="service-item" data-category="${proc.category}" data-id="${proc.id}">
        <div class="service-image">
          <i class="material-icons">content_cut</i>
        </div>
        <div class="service-details">
          <div class="service-name">${proc.name}</div>
          ${truncatedDesc ? `<div class="service-description">${truncatedDesc}</div>` : ''}
          <div class="service-meta">
            <i class="material-icons">schedule</i>
            <span>${duration}</span>
          </div>
          <div class="service-price">${price}</div>
        </div>
        <div class="service-checkbox" data-id="${proc.id}">
        </div>
      </div>
    `;
  }).join('');

  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${clinicName} - Nossos Serviços</title>
    <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&family=Playfair+Display:wght@400;700&display=swap" rel="stylesheet">
    <link href="https://fonts.googleapis.com/icon?family=Material+Icons" rel="stylesheet">
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        body {
            font-family: 'Poppins', sans-serif;
            background-color: #f8f8f8;
            color: #333;
        }
        .slide {
            width: 100%;
            max-width: 720px;
            min-height: 100vh;
            margin: 0 auto;
            background-color: #fff;
            display: flex;
            flex-direction: column;
            overflow: hidden;
            position: relative;
        }
        .header {
            padding: 30px;
            background-color: #f8f8f8;
            border-bottom: 1px solid #eee;
        }
        .title {
            font-family: 'Playfair Display', serif;
            font-size: 28px;
            font-weight: 700;
            color: #e91e63;
            margin-bottom: 15px;
        }
        .search-bar {
            display: flex;
            align-items: center;
            background-color: #fff;
            border-radius: 30px;
            padding: 12px 20px;
            box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
        }
        .search-bar i {
            color: #999;
            margin-right: 10px;
        }
        .search-bar input {
            border: none;
            outline: none;
            flex: 1;
            font-size: 16px;
        }
        .categories {
            display: flex;
            padding: 15px 30px;
            overflow-x: auto;
            gap: 15px;
            border-bottom: 1px solid #eee;
        }
        .category {
            padding: 8px 16px;
            background-color: #f0f0f0;
            border-radius: 20px;
            white-space: nowrap;
            font-size: 14px;
            font-weight: 500;
            cursor: pointer;
            transition: all 0.3s ease;
        }
        .category:hover {
            background-color: #e0e0e0;
        }
        .category.active {
            background-color: #e91e63;
            color: white;
        }
        .services {
            flex: 1;
            overflow-y: auto;
            padding: 20px 30px 120px;
        }
        .service-item {
            display: flex;
            margin-bottom: 20px;
            background-color: #f9f9f9;
            border-radius: 12px;
            padding: 15px;
            box-shadow: 0 2px 5px rgba(0, 0, 0, 0.05);
            transition: all 0.3s ease;
        }
        .service-item:hover {
            box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);
        }
        .service-image {
            width: 80px;
            height: 80px;
            border-radius: 10px;
            margin-right: 15px;
            background: linear-gradient(135deg, #e91e63 0%, #d81b60 100%);
            display: flex;
            align-items: center;
            justify-content: center;
        }
        .service-image i {
            font-size: 40px;
            color: white;
        }
        .service-details {
            flex: 1;
        }
        .service-name {
            font-size: 18px;
            font-weight: 600;
            margin-bottom: 5px;
            color: #333;
        }
        .service-description {
            font-size: 13px;
            color: #666;
            margin-bottom: 8px;
            line-height: 1.4;
        }
        .service-meta {
            display: flex;
            align-items: center;
            margin-bottom: 10px;
        }
        .service-meta i {
            font-size: 16px;
            color: #999;
            margin-right: 5px;
        }
        .service-meta span {
            font-size: 14px;
            color: #666;
            margin-right: 15px;
        }
        .service-price {
            font-size: 16px;
            font-weight: 600;
            color: #e91e63;
        }
        .service-checkbox {
            display: flex;
            align-items: center;
            justify-content: center;
            width: 24px;
            height: 24px;
            border: 2px solid #e91e63;
            border-radius: 50%;
            margin-left: 10px;
            cursor: pointer;
            transition: all 0.3s ease;
            flex-shrink: 0;
        }
        .service-checkbox:hover {
            transform: scale(1.1);
        }
        .service-checkbox.checked {
            background-color: #e91e63;
        }
        .service-checkbox.checked i {
            color: white;
            font-size: 16px;
        }
        .selected-count {
            position: fixed;
            bottom: 140px;
            left: 50%;
            transform: translateX(-50%);
            background-color: #333;
            color: white;
            padding: 10px 20px;
            border-radius: 20px;
            font-size: 14px;
            display: none;
            z-index: 10;
        }
        .selected-count.visible {
            display: block;
        }
        .continue-button {
            position: fixed;
            bottom: 80px;
            left: 50%;
            transform: translateX(-50%);
            width: calc(100% - 60px);
            max-width: 660px;
            background-color: #e91e63;
            color: white;
            border: none;
            padding: 15px 0;
            font-size: 18px;
            font-weight: 600;
            border-radius: 30px;
            cursor: pointer;
            box-shadow: 0 4px 15px rgba(233, 30, 99, 0.3);
            transition: all 0.3s ease;
            display: flex;
            align-items: center;
            justify-content: center;
        }
        .continue-button:hover {
            background-color: #d81b60;
            transform: translateX(-50%) translateY(-2px);
            box-shadow: 0 6px 20px rgba(233, 30, 99, 0.4);
        }
        .continue-button:disabled {
            background-color: #ccc;
            cursor: not-allowed;
        }
        .continue-button i {
            margin-right: 8px;
        }
        .bottom-nav {
            position: fixed;
            bottom: 0;
            left: 50%;
            transform: translateX(-50%);
            width: 100%;
            max-width: 720px;
            background-color: rgba(255, 255, 255, 0.95);
            display: flex;
            justify-content: space-around;
            padding: 15px 0;
            box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.1);
            z-index: 100;
        }
        .nav-item {
            display: flex;
            flex-direction: column;
            align-items: center;
            color: #666;
            text-decoration: none;
            cursor: pointer;
        }
        .nav-item.active {
            color: #e91e63;
        }
        .nav-item i {
            font-size: 24px;
            margin-bottom: 5px;
        }
        .nav-item span {
            font-size: 12px;
        }
        .hidden {
            display: none !important;
        }
        @media (max-width: 768px) {
            .slide {
                width: 100%;
            }
            .header {
                padding: 20px;
            }
            .title {
                font-size: 24px;
            }
            .services {
                padding: 15px 20px 120px;
            }
            .continue-button {
                width: calc(100% - 40px);
            }
        }
    </style>
</head>
<body>
    <div class="slide">
        <div class="header">
            <h1 class="title">Nossos Serviços</h1>
            <div class="search-bar">
                <i class="material-icons">search</i>
                <input type="text" id="searchInput" placeholder="Buscar serviços...">
            </div>
        </div>
        
        <div class="categories">
            <div class="category active" data-category="all">Todos</div>
            ${categories.map(cat => `<div class="category" data-category="${cat}">${cat}</div>`).join('')}
        </div>
        
        <div class="services" id="servicesContainer">
            ${procedureItems}
        </div>
        
        <div class="selected-count" id="selectedCount">
            <span id="countText">0 serviços selecionados</span>
        </div>
        
        <button class="continue-button" id="continueBtn" disabled>
            <i class="material-icons">arrow_forward</i>
            Continuar
        </button>
        
        <div class="bottom-nav">
            <a href="/booking/${publicLink}" class="nav-item">
                <i class="material-icons">home</i>
                <span>Início</span>
            </a>
            <a href="/booking/${publicLink}/services" class="nav-item active">
                <i class="material-icons">content_cut</i>
                <span>Serviços</span>
            </a>
            <a href="#" class="nav-item">
                <i class="material-icons">info</i>
                <span>Sobre</span>
            </a>
            <a href="#" class="nav-item">
                <i class="material-icons">contact_phone</i>
                <span>Contato</span>
            </a>
        </div>
    </div>
    
    <script>
        // Store selected services
        let selectedServices = new Set();
        
        // Service selection
        document.querySelectorAll('.service-checkbox').forEach(checkbox => {
            checkbox.addEventListener('click', function() {
                const serviceId = this.getAttribute('data-id');
                
                if (this.classList.contains('checked')) {
                    // Deselect
                    this.classList.remove('checked');
                    this.innerHTML = '';
                    selectedServices.delete(serviceId);
                } else {
                    // Select
                    this.classList.add('checked');
                    this.innerHTML = '<i class="material-icons">check</i>';
                    selectedServices.add(serviceId);
                }
                
                updateSelectedCount();
            });
        });
        
        // Update selected count
        function updateSelectedCount() {
            const count = selectedServices.size;
            const countEl = document.getElementById('selectedCount');
            const countText = document.getElementById('countText');
            const continueBtn = document.getElementById('continueBtn');
            
            countText.textContent = count + (count === 1 ? ' serviço selecionado' : ' serviços selecionados');
            
            if (count > 0) {
                countEl.classList.add('visible');
                continueBtn.disabled = false;
            } else {
                countEl.classList.remove('visible');
                continueBtn.disabled = true;
            }
        }
        
        // Category filter
        document.querySelectorAll('.category').forEach(cat => {
            cat.addEventListener('click', function() {
                // Update active category
                document.querySelectorAll('.category').forEach(c => c.classList.remove('active'));
                this.classList.add('active');
                
                const category = this.getAttribute('data-category');
                const services = document.querySelectorAll('.service-item');
                
                services.forEach(service => {
                    if (category === 'all' || service.getAttribute('data-category') === category) {
                        service.style.display = 'flex';
                    } else {
                        service.style.display = 'none';
                    }
                });
            });
        });
        
        // Search functionality
        const searchInput = document.getElementById('searchInput');
        searchInput.addEventListener('input', function() {
            const searchTerm = this.value.toLowerCase();
            const services = document.querySelectorAll('.service-item');
            
            services.forEach(service => {
                const name = service.querySelector('.service-name').textContent.toLowerCase();
                const description = service.querySelector('.service-description')?.textContent.toLowerCase() || '';
                const category = service.getAttribute('data-category').toLowerCase();
                
                if (name.includes(searchTerm) || description.includes(searchTerm) || category.includes(searchTerm)) {
                    service.style.display = 'flex';
                } else {
                    service.style.display = 'none';
                }
            });
        });
        
        // Continue button
        document.getElementById('continueBtn').addEventListener('click', function() {
            if (selectedServices.size > 0) {
                // Store selected services in sessionStorage
                sessionStorage.setItem('selectedServices', JSON.stringify(Array.from(selectedServices)));
                // Navigate to next step (specialist selection)
                window.location.href = '/booking/${publicLink}/specialists';
            }
        });
    </script>
</body>
</html>`;
}

// Function to generate specialists selection page
function generateSpecialistsPage(company: any, staff: any[]): string {
  const clinicName = company.clinicName || 'Beauty Salon';
  const publicLink = company.publicLink;
  
  const staffItems = staff.filter((s: any) => s.isActive).map((specialist: any) => {
    const specialties = Array.isArray(specialist.specialties) ? specialist.specialties.join(', ') : specialist.specialties || 'General';
    
    return `
      <div class="specialist-item" data-id="${specialist.id}">
        <div class="specialist-image">
          <i class="material-icons">person</i>
        </div>
        <div class="specialist-details">
          <div class="specialist-name">${specialist.name}</div>
          <div class="specialist-role">${specialist.role}</div>
          ${specialties !== 'General' ? `<div class="specialist-specialties">${specialties}</div>` : ''}
        </div>
        <div class="specialist-radio" data-id="${specialist.id}">
        </div>
      </div>
    `;
  }).join('');

  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${clinicName} - Escolha o Especialista</title>
    <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&family=Playfair+Display:wght@400;700&display=swap" rel="stylesheet">
    <link href="https://fonts.googleapis.com/icon?family=Material+Icons" rel="stylesheet">
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Poppins', sans-serif; background-color: #f8f8f8; color: #333; }
        .slide { width: 100%; max-width: 720px; min-height: 100vh; margin: 0 auto; background-color: #fff; display: flex; flex-direction: column; overflow: hidden; position: relative; }
        .header { padding: 30px; background-color: #f8f8f8; border-bottom: 1px solid #eee; }
        .title { font-family: 'Playfair Display', serif; font-size: 28px; font-weight: 700; color: #e91e63; margin-bottom: 15px; }
        .specialists { flex: 1; overflow-y: auto; padding: 20px 30px 120px; }
        .specialist-item { display: flex; margin-bottom: 20px; background-color: #f9f9f9; border-radius: 12px; padding: 15px; box-shadow: 0 2px 5px rgba(0, 0, 0, 0.05); transition: all 0.3s ease; cursor: pointer; }
        .specialist-item:hover { box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1); }
        .specialist-image { width: 80px; height: 80px; border-radius: 50%; margin-right: 15px; background: linear-gradient(135deg, #e91e63 0%, #d81b60 100%); display: flex; align-items: center; justify-content: center; }
        .specialist-image i { font-size: 40px; color: white; }
        .specialist-details { flex: 1; }
        .specialist-name { font-size: 18px; font-weight: 600; margin-bottom: 5px; color: #333; }
        .specialist-role { font-size: 14px; color: #666; margin-bottom: 5px; text-transform: capitalize; }
        .specialist-specialties { font-size: 13px; color: #999; }
        .specialist-radio { display: flex; align-items: center; justify-content: center; width: 24px; height: 24px; border: 2px solid #e91e63; border-radius: 50%; margin-left: 10px; }
        .specialist-radio.selected { background-color: #e91e63; }
        .specialist-radio.selected::after { content: ''; width: 12px; height: 12px; background-color: white; border-radius: 50%; }
        .continue-button { position: fixed; bottom: 80px; left: 50%; transform: translateX(-50%); width: calc(100% - 60px); max-width: 660px; background-color: #e91e63; color: white; border: none; padding: 15px 0; font-size: 18px; font-weight: 600; border-radius: 30px; cursor: pointer; box-shadow: 0 4px 15px rgba(233, 30, 99, 0.3); transition: all 0.3s ease; display: flex; align-items: center; justify-content: center; }
        .continue-button:hover { background-color: #d81b60; transform: translateX(-50%) translateY(-2px); }
        .continue-button:disabled { background-color: #ccc; cursor: not-allowed; }
        .bottom-nav { position: fixed; bottom: 0; left: 50%; transform: translateX(-50%); width: 100%; max-width: 720px; background-color: rgba(255, 255, 255, 0.95); display: flex; justify-content: space-around; padding: 15px 0; box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.1); z-index: 100; }
        .nav-item { display: flex; flex-direction: column; align-items: center; color: #666; text-decoration: none; }
        .nav-item.active { color: #e91e63; }
        .nav-item i { font-size: 24px; margin-bottom: 5px; }
        .nav-item span { font-size: 12px; }
    </style>
</head>
<body>
    <div class="slide">
        <div class="header">
            <h1 class="title">Escolha seu Especialista</h1>
        </div>
        <div class="specialists">${staffItems}</div>
        <button class="continue-button" id="continueBtn" disabled><i class="material-icons">arrow_forward</i>Continuar</button>
        <div class="bottom-nav">
            <a href="/booking/${publicLink}" class="nav-item"><i class="material-icons">home</i><span>Início</span></a>
            <a href="/booking/${publicLink}/services" class="nav-item"><i class="material-icons">content_cut</i><span>Serviços</span></a>
            <a href="#" class="nav-item active"><i class="material-icons">person</i><span>Profissional</span></a>
            <a href="#" class="nav-item"><i class="material-icons">contact_phone</i><span>Contato</span></a>
        </div>
    </div>
    <script>
        let selectedSpecialist = null;
        document.querySelectorAll('.specialist-item').forEach(item => {
            item.addEventListener('click', function() {
                document.querySelectorAll('.specialist-radio').forEach(r => r.classList.remove('selected'));
                const radio = this.querySelector('.specialist-radio');
                radio.classList.add('selected');
                selectedSpecialist = this.getAttribute('data-id');
                document.getElementById('continueBtn').disabled = false;
            });
        });
        document.getElementById('continueBtn').addEventListener('click', function() {
            if (selectedSpecialist) {
                sessionStorage.setItem('selectedSpecialist', selectedSpecialist);
                window.location.href = '/booking/${publicLink}/datetime';
            }
        });
    </script>
</body>
</html>`;
}

// Function to generate date/time selection page
function generateDateTimePage(company: any, businessHours: any[]): string {
  const clinicName = company.clinicName || 'Beauty Salon';
  const publicLink = company.publicLink;
  
  // Get open days
  const openDays = businessHours.filter(h => h.isOpen).map(h => h.dayOfWeek);
  
  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${clinicName} - Selecione Data e Horário</title>
    <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&family=Playfair+Display:wght@400;700&display=swap" rel="stylesheet">
    <link href="https://fonts.googleapis.com/icon?family=Material+Icons" rel="stylesheet">
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Poppins', sans-serif; background-color: #f8f8f8; color: #333; }
        .slide { width: 100%; max-width: 720px; min-height: 100vh; margin: 0 auto; background-color: #fff; display: flex; flex-direction: column; overflow: hidden; position: relative; }
        .header { padding: 30px; background-color: #f8f8f8; border-bottom: 1px solid #eee; }
        .title { font-family: 'Playfair Display', serif; font-size: 28px; font-weight: 700; color: #e91e63; margin-bottom: 15px; }
        .content { flex: 1; overflow-y: auto; padding: 20px 30px 120px; }
        .section-title { font-size: 18px; font-weight: 600; margin-bottom: 15px; color: #333; }
        .calendar { background: #fff; border-radius: 12px; padding: 20px; margin-bottom: 30px; }
        .date-input { width: 100%; padding: 12px; border: 2px solid #eee; border-radius: 8px; font-size: 16px; }
        .time-slots { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; min-height: 100px; }
        .time-slot { padding: 12px; border-radius: 10px; text-align: center; font-size: 16px; font-weight: 500; cursor: pointer; background-color: #f0f0f0; color: #333; transition: all 0.3s ease; }
        .time-slot:hover { background-color: #e91e63; color: white; }
        .time-slot.selected { background-color: #e91e63; color: white; }
        .continue-button { position: fixed; bottom: 80px; left: 50%; transform: translateX(-50%); width: calc(100% - 60px); max-width: 660px; background-color: #e91e63; color: white; border: none; padding: 15px 0; font-size: 18px; font-weight: 600; border-radius: 30px; cursor: pointer; box-shadow: 0 4px 15px rgba(233, 30, 99, 0.3); }
        .continue-button:disabled { background-color: #ccc; cursor: not-allowed; }
        .bottom-nav { position: fixed; bottom: 0; left: 50%; transform: translateX(-50%); width: 100%; max-width: 720px; background-color: rgba(255, 255, 255, 0.95); display: flex; justify-content: space-around; padding: 15px 0; box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.1); z-index: 100; }
        .nav-item { display: flex; flex-direction: column; align-items: center; color: #666; text-decoration: none; }
        .nav-item.active { color: #e91e63; }
        .nav-item i { font-size: 24px; margin-bottom: 5px; }
        .nav-item span { font-size: 12px; }
        .loading-slots, .no-slots { grid-column: 1 / -1; text-align: center; padding: 20px; color: #888; }
    </style>
</head>
<body>
    <div class="slide">
        <div class="header">
            <h1 class="title">Selecione Data e Horário</h1>
        </div>
        <div class="content">
            <div class="calendar">
                <div class="section-title">Selecione a Data</div>
                <input type="date" class="date-input" id="dateInput" min="${new Date().toISOString().split('T')[0]}">
            </div>
            <div class="section-title">Horários Disponíveis</div>
            <div class="time-slots" id="timeSlots">
                <div class="no-slots">Selecione uma data para ver os horários disponíveis</div>
            </div>
        </div>
        <button class="continue-button" id="continueBtn" disabled><i class="material-icons">arrow_forward</i>Continuar</button>
        <div class="bottom-nav">
            <a href="/booking/${publicLink}" class="nav-item"><i class="material-icons">home</i><span>Início</span></a>
            <a href="/booking/${publicLink}/services" class="nav-item"><i class="material-icons">content_cut</i><span>Serviços</span></a>
            <a href="#" class="nav-item active"><i class="material-icons">schedule</i><span>Data/Hora</span></a>
            <a href="#" class="nav-item"><i class="material-icons">contact_phone</i><span>Contato</span></a>
        </div>
    </div>
    <script>
        let selectedDate = null;
        let selectedTime = null;
        const publicLink = '${publicLink}';
        
        // Load stored selections
        const selectedSpecialist = sessionStorage.getItem('selectedSpecialist');
        const selectedServices = JSON.parse(sessionStorage.getItem('selectedServices') || '[]');

        const dateInput = document.getElementById('dateInput');
        const timeSlotsContainer = document.getElementById('timeSlots');
        const continueBtn = document.getElementById('continueBtn');

        dateInput.addEventListener('change', function() {
            selectedDate = this.value;
            selectedTime = null;
            updateContinueButton();
            fetchSlots(selectedDate);
        });

        async function fetchSlots(date) {
            timeSlotsContainer.innerHTML = '<div class="loading-slots">Carregando horários...</div>';
            
            try {
                // Build Query
                let url = \`/api/public/slots?publicLink=\${publicLink}&date=\${date}\`;
                if (selectedSpecialist) url += \`&staffId=\${selectedSpecialist}\`;
                if (selectedServices.length > 0) url += \`&serviceIds=\${selectedServices.join(',')}\`;

                const response = await fetch(url);
                const slots = await response.json();

                renderSlots(slots);
            } catch (error) {
                console.error('Error fetching slots:', error);
                timeSlotsContainer.innerHTML = '<div class="no-slots">Erro ao carregar horários. Tente novamente.</div>';
            }
        }

        function renderSlots(slots) {
            if (!slots || slots.length === 0) {
                timeSlotsContainer.innerHTML = '<div class="no-slots">Nenhum horário disponível para esta data.</div>';
                return;
            }

            timeSlotsContainer.innerHTML = '';
            
            slots.forEach(time => {
                const slotEl = document.createElement('div');
                slotEl.className = 'time-slot';
                slotEl.textContent = time;
                slotEl.setAttribute('data-time', time);
                
                slotEl.addEventListener('click', function() {
                    document.querySelectorAll('.time-slot').forEach(s => s.classList.remove('selected'));
                    this.classList.add('selected');
                    selectedTime = this.getAttribute('data-time');
                    updateContinueButton();
                });
                
                timeSlotsContainer.appendChild(slotEl);
            });
        }

        function updateContinueButton() {
            continueBtn.disabled = !(selectedDate && selectedTime);
        }

        continueBtn.addEventListener('click', function() {
            if (selectedDate && selectedTime) {
                sessionStorage.setItem('selectedDate', selectedDate);
                sessionStorage.setItem('selectedTime', selectedTime);
                window.location.href = '/booking/${publicLink}/customer';
            }
        });
    </script>
</body>
</html>`;
}


// Function to generate customer information page
function generateCustomerPage(company: any): string {
  const clinicName = company.clinicName || 'Beauty Salon';
  const publicLink = company.publicLink;
  
  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${clinicName} - Suas Informações</title>
    <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&family=Playfair+Display:wght@400;700&display=swap" rel="stylesheet">
    <link href="https://fonts.googleapis.com/icon?family=Material+Icons" rel="stylesheet">
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Poppins', sans-serif; background-color: #f8f8f8; color: #333; }
        .slide { width: 100%; max-width: 720px; min-height: 100vh; margin: 0 auto; background-color: #fff; display: flex; flex-direction: column; overflow: hidden; position: relative; }
        .header { padding: 30px; background-color: #f8f8f8; border-bottom: 1px solid #eee; }
        .title { font-family: 'Playfair Display', serif; font-size: 28px; font-weight: 700; color: #e91e63; margin-bottom: 15px; }
        .content { flex: 1; overflow-y: auto; padding: 20px 30px 120px; }
        .form-group { margin-bottom: 20px; }
        .form-label { display: block; font-size: 14px; font-weight: 500; margin-bottom: 8px; color: #333; }
        .form-input { width: 100%; padding: 12px; border: 2px solid #eee; border-radius: 8px; font-size: 16px; font-family: 'Poppins', sans-serif; }
        .form-input:focus { outline: none; border-color: #e91e63; }
        .continue-button { position: fixed; bottom: 80px; left: 50%; transform: translateX(-50%); width: calc(100% - 60px); max-width: 660px; background-color: #e91e63; color: white; border: none; padding: 15px 0; font-size: 18px; font-weight: 600; border-radius: 30px; cursor: pointer; box-shadow: 0 4px 15px rgba(233, 30, 99, 0.3); }
        .continue-button:disabled { background-color: #ccc; cursor: not-allowed; }
        .bottom-nav { position: fixed; bottom: 0; left: 50%; transform: translateX(-50%); width: 100%; max-width: 720px; background-color: rgba(255, 255, 255, 0.95); display: flex; justify-content: space-around; padding: 15px 0; box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.1); z-index: 100; }
        .nav-item { display: flex; flex-direction: column; align-items: center; color: #666; text-decoration: none; }
        .nav-item.active { color: #e91e63; }
        .nav-item i { font-size: 24px; margin-bottom: 5px; }
        .nav-item span { font-size: 12px; }
        .login-link {
            text-align: center;
            padding: 15px;
            background-color: #f0f8ff;
            border-radius: 8px;
            margin-bottom: 20px;
            font-size: 14px;
        }
        .login-link a {
            color: #e91e63;
            text-decoration: none;
            font-weight: 600;
        }
        .login-link a:hover {
            text-decoration: underline;
        }
    </style>
</head>
<body>
    <div class="slide">
        <div class="header">
            <h1 class="title">Suas Informações</h1>
        </div>
        <div class="content">
            <div class="login-link" id="loginLink" style="display: none;">
                Já tem uma conta? <a href="/booking/${publicLink}/login">Entre</a> para preencher seus dados
            </div>
            <form id="customerForm">
                <div class="form-group">
                    <label class="form-label">Nome Completo *</label>
                    <input type="text" class="form-input" id="name" required>
                </div>
                <div class="form-group">
                    <label class="form-label">Email *</label>
                    <input type="email" class="form-input" id="email" required>
                </div>
                <div class="form-group">
                    <label class="form-label">Telefone *</label>
                    <input type="tel" class="form-input" id="phone" required>
                </div>
                <div class="form-group">
                    <label class="form-label">Observações (Opcional)</label>
                    <textarea class="form-input" id="notes" rows="4" placeholder="Alguma observação especial..."></textarea>
                </div>
            </form>
        </div>
        <button class="continue-button" id="continueBtn"><i class="material-icons">arrow_forward</i>Continuar</button>
        <div class="bottom-nav">
            <a href="/booking/${publicLink}" class="nav-item"><i class="material-icons">home</i><span>Início</span></a>
            <a href="/booking/${publicLink}/services" class="nav-item"><i class="material-icons">content_cut</i><span>Serviços</span></a>
            <a href="#" class="nav-item active"><i class="material-icons">person</i><span>Seus Dados</span></a>
            <a href="#" class="nav-item"><i class="material-icons">contact_phone</i><span>Contato</span></a>
        </div>
    </div>
    <script>
        // Check if client is logged in and auto-fill data
        fetch('/api/client/me')
            .then(res => res.ok ? res.json() : null)
            .then(client => {
                if (client) {
                    // Client is logged in - auto-fill data and LOCK fields
                    const nameField = document.getElementById('name');
                    const emailField = document.getElementById('email');
                    const phoneField = document.getElementById('phone');
                    
                    nameField.value = client.name || '';
                    emailField.value = client.email || '';
                    phoneField.value = client.phone || '';
                    
                    // Lock fields to enforce identity
                    [nameField, emailField, phoneField].forEach(field => {
                        field.readOnly = true;
                        field.style.backgroundColor = '#f0f0f0';
                        field.style.color = '#555';
                        field.title = 'Estes dados est\\u00E3o vinculados \\u00E0 sua conta logada.';
                    });
                    
                    // Show message
                    const loginLink = document.getElementById('loginLink');
                    loginLink.style.display = 'block';
                    loginLink.innerHTML = \`<i class="material-icons" style="vertical-align: middle; font-size: 16px; margin-right: 5px; color: #4caf50;">check_circle</i> Voc\\u00EA est\\u00E1 logado como <strong>\${client.name}</strong>\`;
                    loginLink.style.backgroundColor = '#e8f5e9';
                    loginLink.style.border = '1px solid #c8e6c9';
                    loginLink.style.color = '#2e7d32';
                } else {
                    // Not logged in - show login link
                    document.getElementById('loginLink').style.display = 'block';
                }
            })
            .catch(() => {
                // Show login link on error
                document.getElementById('loginLink').style.display = 'block';
            });
        
        document.getElementById('continueBtn').addEventListener('click', function() {
            const name = document.getElementById('name').value;
            const email = document.getElementById('email').value;
            const phone = document.getElementById('phone').value;
            const notes = document.getElementById('notes').value;
            
            if (!name || !email || !phone) {
                alert('Por favor, preencha todos os campos obrigatórios');
                return;
            }
            
            const customerInfo = { name, email, phone, notes };
            sessionStorage.setItem('customerInfo', JSON.stringify(customerInfo));
            window.location.href = '/booking/${publicLink}/confirmation';
        });
    </script>
</body>
</html>`;
}

// Function to generate confirmation page
function generateConfirmationPage(company: any): string {
  const clinicName = company.clinicName || 'Beauty Salon';
  const publicLink = company.publicLink;
  const address = company.clinicAddress || 'Address not provided';
  const phone = company.clinicPhone || 'Phone not provided';
  
  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${clinicName} - Confirmação</title>
    <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&family=Playfair+Display:wght@400;700&display=swap" rel="stylesheet">
    <link href="https://fonts.googleapis.com/icon?family=Material+Icons" rel="stylesheet">
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Poppins', sans-serif; background-color: #f8f8f8; color: #333; }
        .slide { width: 100%; max-width: 720px; min-height: 100vh; margin: 0 auto; background-color: #fff; display: flex; flex-direction: column; overflow: hidden; position: relative; }
        .header { padding: 30px; background-color: #f8f8f8; border-bottom: 1px solid #eee; text-align: center; }
        .title { font-family: 'Playfair Display', serif; font-size: 28px; font-weight: 700; color: #e91e63; margin-bottom: 15px; }
        .content { flex: 1; overflow-y: auto; padding: 20px 30px 120px; }
        .success-icon { width: 80px; height: 80px; background-color: #e91e63; border-radius: 50%; margin: 0 auto 20px; display: flex; align-items: center; justify-content: center; }
        .success-icon i { font-size: 40px; color: white; }
        .summary { background-color: #f9f9f9; border-radius: 12px; padding: 20px; margin-bottom: 20px; }
        .summary-item { margin-bottom: 15px; padding-bottom: 15px; border-bottom: 1px solid #eee; }
        .summary-item:last-child { margin-bottom: 0; padding-bottom: 0; border-bottom: none; }
        .summary-label { font-size: 14px; color: #666; margin-bottom: 5px; }
        .summary-value { font-size: 16px; font-weight: 600; color: #333; }
        .info-box { background-color: #fff3f8; border-left: 4px solid #e91e63; padding: 15px; border-radius: 8px; margin-bottom: 20px; }
        .info-box p { font-size: 14px; color: #666; line-height: 1.6; }
        .confirm-button { position: fixed; bottom: 80px; left: 50%; transform: translateX(-50%); width: calc(100% - 60px); max-width: 660px; background-color: #e91e63; color: white; border: none; padding: 15px 0; font-size: 18px; font-weight: 600; border-radius: 30px; cursor: pointer; box-shadow: 0 4px 15px rgba(233, 30, 99, 0.3); }
        .bottom-nav { position: fixed; bottom: 0; left: 50%; transform: translateX(-50%); width: 100%; max-width: 720px; background-color: rgba(255, 255, 255, 0.95); display: flex; justify-content: space-around; padding: 15px 0; box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.1); z-index: 100; }
        .nav-item { display: flex; flex-direction: column; align-items: center; color: #666; text-decoration: none; }
        .nav-item.active { color: #e91e63; }
        .nav-item i { font-size: 24px; margin-bottom: 5px; }
        .nav-item span { font-size: 12px; }
    </style>
</head>
<body>
    <div class="slide">
        <div class="header">
            <div class="success-icon"><i class="material-icons">check</i></div>
            <h1 class="title">Revise seu Agendamento</h1>
        </div>
        <div class="content">
            <div class="summary" id="summary">
                <div class="summary-item">
                    <div class="summary-label">Serviços</div>
                    <div class="summary-value" id="servicesText">Carregando...</div>
                </div>
                <div class="summary-item">
                    <div class="summary-label">Especialista</div>
                    <div class="summary-value" id="specialistText">Carregando...</div>
                </div>
                <div class="summary-item">
                    <div class="summary-label">Data e Horário</div>
                    <div class="summary-value" id="datetimeText">Carregando...</div>
                </div>
                <div class="summary-item">
                    <div class="summary-label">Seus Dados</div>
                    <div class="summary-value" id="customerText">Carregando...</div>
                </div>
            </div>
            <div class="info-box">
                <p><strong>${clinicName}</strong></p>
                <p>${address}</p>
                <p>Phone: ${phone}</p>
            </div>
        </div>
        <button class="confirm-button" id="confirmBtn"><i class="material-icons">check_circle</i>Confirmar Agendamento</button>
        <div class="bottom-nav">
            <a href="/booking/${publicLink}" class="nav-item"><i class="material-icons">home</i><span>Início</span></a>
            <a href="/booking/${publicLink}/services" class="nav-item"><i class="material-icons">content_cut</i><span>Serviços</span></a>
            <a href="#" class="nav-item active"><i class="material-icons">check_circle</i><span>Confirmar</span></a>
            <a href="#" class="nav-item"><i class="material-icons">contact_phone</i><span>Contato</span></a>
        </div>
    </div>
    <script>
        // Load booking data from sessionStorage
        const selectedServices = JSON.parse(sessionStorage.getItem('selectedServices') || '[]');
        const selectedSpecialist = sessionStorage.getItem('selectedSpecialist');
        const selectedDate = sessionStorage.getItem('selectedDate');
        const selectedTime = sessionStorage.getItem('selectedTime');
        const customerInfo = JSON.parse(sessionStorage.getItem('customerInfo') || '{}');
        
        document.getElementById('servicesText').textContent = selectedServices.length + ' serviço(s) selecionado(s)';
        document.getElementById('specialistText').textContent = selectedSpecialist ? 'Especialista ID: ' + selectedSpecialist : 'Não selecionado';
        document.getElementById('datetimeText').textContent = selectedDate && selectedTime ? selectedDate + ' às ' + selectedTime : 'Não selecionado';
        document.getElementById('customerText').textContent = customerInfo.name ? customerInfo.name + ' - ' + customerInfo.email : 'Não informado';
        
        document.getElementById('confirmBtn').addEventListener('click', async function() {
            const bookingData = {
                name: customerInfo.name,
                phone: customerInfo.phone,
                email: customerInfo.email,
                notes: customerInfo.notes || '',
                selectedServices: selectedServices,
                selectedProfessional: selectedSpecialist,
                selectedDate: selectedDate,
                selectedTime: selectedTime
            };
            
            try {
                const response = await fetch('/api/public/appointments/${publicLink}', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(bookingData)
                });
                
                if (response.ok) {
                    alert('Agendamento confirmado! Entraremos em contato em breve.');
                    sessionStorage.clear();
                    window.location.href = '/booking/${publicLink}';
                } else {
                    const errorData = await response.json();
                    alert('Erro ao criar agendamento: ' + (errorData.message || 'Por favor tente novamente.'));
                }
            } catch (error) {
                alert('Erro ao criar agendamento. Por favor tente novamente.');
            }
        });
    </script>
</body>
</html>`;
}

// ===============================================
// CLIENT PORTAL HTML PAGES
// ===============================================

function generateClientLoginPage(company: any): string {
  const clinicName = company.clinicName || 'Beauty Salon';
  const publicLink = company.publicLink;
  
  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${clinicName} - Login do Cliente</title>
    <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&family=Playfair+Display:wght@400;700&display=swap" rel="stylesheet">
    <link href="https://fonts.googleapis.com/icon?family=Material+Icons" rel="stylesheet">
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Poppins', sans-serif; background-color: #f8f8f8; color: #333; }
        .slide {
            width: 720px;
            min-height: 960px;
            margin: 0 auto;
            background-color: #fff;
            display: flex;
            flex-direction: column;
            overflow: hidden;
            position: relative;
        }
        .header {
            padding: 30px;
            background: linear-gradient(135deg, #e91e63 0%, #d81b60 100%);
            color: white;
            text-align: center;
        }
        .header h1 {
            font-family: 'Playfair Display', serif;
            font-size: 28px;
            margin-bottom: 10px;
        }
        .header p { font-size: 14px; opacity: 0.9; }
        .back-button {
            position: absolute;
            top: 30px;
            left: 30px;
            background: rgba(255, 255, 255, 0.2);
            border: none;
            border-radius: 50%;
            width: 40px;
            height: 40px;
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            color: white;
        }
        .form-container {
            flex: 1;
            padding: 40px 30px;
        }
        .form-group {
            margin-bottom: 20px;
        }
        .form-group label {
            display: block;
            font-size: 14px;
            font-weight: 500;
            margin-bottom: 8px;
            color: #333;
        }
        .form-group input {
            width: 100%;
            padding: 12px 15px;
            border: 1px solid #ddd;
            border-radius: 8px;
            font-size: 16px;
            font-family: 'Poppins', sans-serif;
        }
        .form-group input:focus {
            outline: none;
            border-color: #e91e63;
        }
        .login-button {
            width: 100%;
            background-color: #e91e63;
            color: white;
            border: none;
            padding: 15px;
            font-size: 18px;
            font-weight: 600;
            border-radius: 30px;
            cursor: pointer;
            margin-top: 20px;
            box-shadow: 0 4px 15px rgba(233, 30, 99, 0.3);
            transition: all 0.3s ease;
        }
        .login-button:hover {
            background-color: #d81b60;
            transform: translateY(-2px);
        }
        .login-button:disabled {
            background-color: #ccc;
            cursor: not-allowed;
            transform: none;
        }
        .register-link {
            text-align: center;
            margin-top: 20px;
            font-size: 14px;
        }
        .register-link a {
            color: #e91e63;
            text-decoration: none;
            font-weight: 600;
        }
        .error-message {
            background-color: #ffebee;
            color: #c62828;
            padding: 12px;
            border-radius: 8px;
            margin-bottom: 20px;
            display: none;
        }
        .success-message {
            background-color: #e8f5e9;
            color: #2e7d32;
            padding: 12px;
            border-radius: 8px;
            margin-bottom: 20px;
            display: none;
        }
    </style>
</head>
<body>
    <div class="slide">
        <div class="header">
            <a href="/booking/${publicLink}" class="back-button">
                <i class="material-icons">arrow_back</i>
            </a>
            <h1>Bem-vindo de volta</h1>
            <p>Entre para gerenciar seus agendamentos</p>
        </div>
        
        <div class="form-container">
            <div class="error-message" id="errorMessage"></div>
            <div class="success-message" id="successMessage"></div>
            
            <form id="loginForm">
                <div class="form-group">
                    <label for="email">Email</label>
                    <input type="email" id="email" name="email" required>
                </div>
                
                <div class="form-group">
                    <label for="password">Senha</label>
                    <input type="password" id="password" name="password" required>
                </div>
                
                <button type="submit" class="login-button" id="loginBtn">
                    Entrar
                </button>
            </form>
            
            <div class="register-link">
                Não tem uma conta? <a href="/booking/${publicLink}/register">Cadastre-se</a>
            </div>
        </div>
    </div>
    
    <script>
        const form = document.getElementById('loginForm');
        const errorMessage = document.getElementById('errorMessage');
        const successMessage = document.getElementById('successMessage');
        const loginBtn = document.getElementById('loginBtn');
        
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;
            
            errorMessage.style.display = 'none';
            successMessage.style.display = 'none';
            loginBtn.disabled = true;
            loginBtn.textContent = 'Entrando...';
            
            try {
                const response = await fetch('/api/client/login/${publicLink}', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email, password })
                });
                
                const data = await response.json();
                
                if (response.ok) {
                    successMessage.textContent = 'Login realizado com sucesso! Redirecionando...';
                    successMessage.style.display = 'block';
                    setTimeout(() => {
                        window.location.href = '/booking/${publicLink}/dashboard';
                    }, 1000);
                } else {
                    errorMessage.textContent = data.message || 'Falha no login. Por favor tente novamente.';
                    errorMessage.style.display = 'block';
                    loginBtn.disabled = false;
                    loginBtn.textContent = 'Entrar';
                }
            } catch (error) {
                errorMessage.textContent = 'Ocorreu um erro. Por favor tente novamente.';
                errorMessage.style.display = 'block';
                loginBtn.disabled = false;
                loginBtn.textContent = 'Entrar';
            }
        });
    </script>
</body>
</html>`;
}

function generateClientRegisterPage(company: any): string {
  const clinicName = company.clinicName || 'Beauty Salon';
  const publicLink = company.publicLink;
  
  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${clinicName} - Criar Conta</title>
    <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&family=Playfair+Display:wght@400;700&display=swap" rel="stylesheet">
    <link href="https://fonts.googleapis.com/icon?family=Material+Icons" rel="stylesheet">
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Poppins', sans-serif; background-color: #f8f8f8; color: #333; }
        .slide {
            width: 720px;
            min-height: 960px;
            margin: 0 auto;
            background-color: #fff;
            display: flex;
            flex-direction: column;
            overflow: hidden;
            position: relative;
        }
        .header {
            padding: 30px;
            background: linear-gradient(135deg, #e91e63 0%, #d81b60 100%);
            color: white;
            text-align: center;
        }
        .header h1 {
            font-family: 'Playfair Display', serif;
            font-size: 28px;
            margin-bottom: 10px;
        }
        .header p { font-size: 14px; opacity: 0.9; }
        .back-button {
            position: absolute;
            top: 30px;
            left: 30px;
            background: rgba(255, 255, 255, 0.2);
            border: none;
            border-radius: 50%;
            width: 40px;
            height: 40px;
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            color: white;
        }
        .form-container {
            flex: 1;
            padding: 40px 30px;
        }
        .form-group {
            margin-bottom: 20px;
        }
        .form-group label {
            display: block;
            font-size: 14px;
            font-weight: 500;
            margin-bottom: 8px;
            color: #333;
        }
        .form-group input {
            width: 100%;
            padding: 12px 15px;
            border: 1px solid #ddd;
            border-radius: 8px;
            font-size: 16px;
            font-family: 'Poppins', sans-serif;
        }
        .form-group input:focus {
            outline: none;
            border-color: #e91e63;
        }
        .register-button {
            width: 100%;
            background-color: #e91e63;
            color: white;
            border: none;
            padding: 15px;
            font-size: 18px;
            font-weight: 600;
            border-radius: 30px;
            cursor: pointer;
            margin-top: 20px;
            box-shadow: 0 4px 15px rgba(233, 30, 99, 0.3);
            transition: all 0.3s ease;
        }
        .register-button:hover {
            background-color: #d81b60;
            transform: translateY(-2px);
        }
        .register-button:disabled {
            background-color: #ccc;
            cursor: not-allowed;
            transform: none;
        }
        .login-link {
            text-align: center;
            margin-top: 20px;
            font-size: 14px;
        }
        .login-link a {
            color: #e91e63;
            text-decoration: none;
            font-weight: 600;
        }
        .error-message {
            background-color: #ffebee;
            color: #c62828;
            padding: 12px;
            border-radius: 8px;
            margin-bottom: 20px;
            display: none;
        }
        .success-message {
            background-color: #e8f5e9;
            color: #2e7d32;
            padding: 12px;
            border-radius: 8px;
            margin-bottom: 20px;
            display: none;
        }
        .password-match {
            font-size: 12px;
            margin-top: 5px;
            display: none;
        }
        .password-match.error { color: #c62828; }
        .password-match.success { color: #2e7d32; }
    </style>
</head>
<body>
    <div class="slide">
        <div class="header">
            <a href="/booking/${publicLink}" class="back-button">
                <i class="material-icons">arrow_back</i>
            </a>
            <h1>Criar Conta</h1>
            <p>Junte-se a nós e gerencie seus agendamentos facilmente</p>
        </div>
        
        <div class="form-container">
            <div class="error-message" id="errorMessage"></div>
            <div class="success-message" id="successMessage"></div>
            
            <form id="registerForm">
                <div class="form-group">
                    <label for="name">Nome Completo *</label>
                    <input type="text" id="name" name="name" required>
                </div>
                
                <div class="form-group">
                    <label for="email">Email *</label>
                    <input type="email" id="email" name="email" required>
                </div>
                
                <div class="form-group">
                    <label for="phone">Telefone</label>
                    <input type="tel" id="phone" name="phone">
                </div>
                
                <div class="form-group">
                    <label for="password">Senha *</label>
                    <input type="password" id="password" name="password" required minlength="6">
                </div>
                
                <div class="form-group">
                    <label for="confirmPassword">Confirmar Senha *</label>
                    <input type="password" id="confirmPassword" name="confirmPassword" required minlength="6">
                    <div class="password-match" id="passwordMatch"></div>
                </div>
                
                <button type="submit" class="register-button" id="registerBtn">
                    Criar Conta
                </button>
            </form>
            
            <div class="login-link">
                Já tem uma conta? <a href="/booking/${publicLink}/login">Entre</a>
            </div>
        </div>
    </div>
    
    <script>
        const form = document.getElementById('registerForm');
        const errorMessage = document.getElementById('errorMessage');
        const successMessage = document.getElementById('successMessage');
        const registerBtn = document.getElementById('registerBtn');
        const password = document.getElementById('password');
        const confirmPassword = document.getElementById('confirmPassword');
        const passwordMatch = document.getElementById('passwordMatch');
        
        // Check password match
        confirmPassword.addEventListener('input', () => {
            if (confirmPassword.value) {
                if (password.value === confirmPassword.value) {
                    passwordMatch.textContent = '✓ Senhas coincidem';
                    passwordMatch.className = 'password-match success';
                    passwordMatch.style.display = 'block';
                } else {
                    passwordMatch.textContent = '✗ Senhas não coincidem';
                    passwordMatch.className = 'password-match error';
                    passwordMatch.style.display = 'block';
                }
            } else {
                passwordMatch.style.display = 'none';
            }
        });
        
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const name = document.getElementById('name').value;
            const email = document.getElementById('email').value;
            const phone = document.getElementById('phone').value;
            const pwd = password.value;
            const confirmPwd = confirmPassword.value;
            
            if (pwd !== confirmPwd) {
                errorMessage.textContent = 'Senhas não coincidem';
                errorMessage.style.display = 'block';
                return;
            }
            
            errorMessage.style.display = 'none';
            successMessage.style.display = 'none';
            registerBtn.disabled = true;
            registerBtn.textContent = 'Criando conta...';
            
            try {
                const response = await fetch('/api/client/register/${publicLink}', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ name, email, phone, password: pwd })
                });
                
                const data = await response.json();
                
                if (response.ok) {
                    successMessage.textContent = 'Conta criada com sucesso! Redirecionando para o login...';
                    successMessage.style.display = 'block';
                    setTimeout(() => {
                        window.location.href = '/booking/${publicLink}/login';
                    }, 1500);
                } else {
                    errorMessage.textContent = data.message || 'Falha no cadastro. Por favor tente novamente.';
                    errorMessage.style.display = 'block';
                    registerBtn.disabled = false;
                    registerBtn.textContent = 'Criar Conta';
                }
            } catch (error) {
                errorMessage.textContent = 'Ocorreu um erro. Por favor tente novamente.';
                errorMessage.style.display = 'block';
                registerBtn.disabled = false;
                registerBtn.textContent = 'Criar Conta';
            }
        });
    </script>
</body>
</html>`;
}

function generateClientDashboardPage(company: any): string {
  const clinicName = company.clinicName || 'Beauty Salon';
  const publicLink = company.publicLink;
  
  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${clinicName} - Meus Agendamentos</title>
    <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&family=Playfair+Display:wght@400;700&display=swap" rel="stylesheet">
    <link href="https://fonts.googleapis.com/icon?family=Material+Icons" rel="stylesheet">
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Poppins', sans-serif; background-color: #f8f8f8; color: #333; }
        .slide {
            width: 720px;
            min-height: 960px;
            margin: 0 auto;
            background-color: #fff;
            display: flex;
            flex-direction: column;
            overflow: hidden;
            position: relative;
        }
        .header {
            padding: 30px;
            background: linear-gradient(135deg, #e91e63 0%, #d81b60 100%);
            color: white;
        }
        .header h1 {
            font-family: 'Playfair Display', serif;
            font-size: 28px;
            margin-bottom: 5px;
        }
        .header .welcome { font-size: 14px; opacity: 0.9; }
        .logout-button {
            position: absolute;
            top: 30px;
            right: 30px;
            background: rgba(255, 255, 255, 0.2);
            border: none;
            padding: 8px 16px;
            border-radius: 20px;
            cursor: pointer;
            color: white;
            font-size: 14px;
        }
        .back-button {
            position: absolute;
            top: 30px;
            left: 30px;
            background: rgba(255, 255, 255, 0.2);
            border: none;
            border-radius: 50%;
            width: 40px;
            height: 40px;
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            color: white;
        }
        .content {
            flex: 1;
            overflow-y: auto;
            padding: 20px 30px;
            padding-bottom: 80px;
        }
        .loading {
            text-align: center;
            padding: 40px;
            color: #666;
        }
        .empty-state {
            text-align: center;
            padding: 60px 20px;
            color: #666;
        }
        .empty-state i {
            font-size: 64px;
            color: #ddd;
            margin-bottom: 20px;
        }
        .appointment-card {
            background-color: #fff;
            border: 1px solid #eee;
            border-radius: 12px;
            padding: 20px;
            margin-bottom: 15px;
            box-shadow: 0 2px 5px rgba(0, 0, 0, 0.05);
        }
        .appointment-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 15px;
        }
        .appointment-date {
            font-size: 18px;
            font-weight: 600;
            color: #333;
        }
        .appointment-status {
            padding: 5px 12px;
            border-radius: 20px;
            font-size: 12px;
            font-weight: 600;
            text-transform: uppercase;
        }
        .status-pending { background-color: #fff3e0; color: #f57c00; }
        .status-confirmed { background-color: #e3f2fd; color: #1976d2; }
        .status-scheduled { background-color: #e8f5e9; color: #388e3c; }
        .status-completed { background-color: #f5f5f5; color: #616161; }
        .status-cancelled { background-color: #ffebee; color: #d32f2f; }
        .appointment-details {
            margin-bottom: 10px;
        }
        .detail-row {
            display: flex;
            align-items: center;
            margin-bottom: 8px;
            font-size: 14px;
        }
        .detail-row i {
            color: #e91e63;
            margin-right: 10px;
            font-size: 18px;
        }
        .procedures-list {
            margin-top: 10px;
            padding-left: 28px;
        }
        .procedure-item {
            font-size: 13px;
            color: #666;
            margin-bottom: 5px;
        }
        .appointment-actions {
            display: flex;
            gap: 10px;
            margin-top: 15px;
        }
        .action-button {
            flex: 1;
            padding: 10px;
            border: none;
            border-radius: 8px;
            cursor: pointer;
            font-size: 14px;
            font-weight: 600;
            transition: all 0.3s ease;
        }
        .cancel-button {
            background-color: #ffebee;
            color: #d32f2f;
        }
        .cancel-button:hover {
            background-color: #ffcdd2;
        }
        .book-new-button {
            position: fixed;
            bottom: 20px;
            left: 50%;
            transform: translateX(-50%);
            width: 660px;
            background-color: #e91e63;
            color: white;
            border: none;
            padding: 15px;
            font-size: 18px;
            font-weight: 600;
            border-radius: 30px;
            cursor: pointer;
            box-shadow: 0 4px 15px rgba(233, 30, 99, 0.3);
        }
    </style>
</head>
<body>
    <div class="slide">
        <div class="header">
            <a href="/booking/${publicLink}" class="back-button">
                <i class="material-icons">arrow_back</i>
            </a>
            <button onclick="logout()" class="logout-button">Sair</button>
            <h1>Meus Agendamentos</h1>
            <p class="welcome" id="welcomeText">Carregando...</p>
        </div>
        
        <div class="content" id="content">
            <div class="loading">
                <i class="material-icons" style="font-size: 48px; color: #e91e63;">hourglass_empty</i>
                <p>Carregando seus agendamentos...</p>
            </div>
        </div>
        
        <a href="/booking/${publicLink}/services" class="book-new-button">
            Agendar Novo Horário
        </a>
    </div>
    
    <script>
        async function loadClientData() {
            try {
                // Get client info
                const meResponse = await fetch('/api/client/me');
                if (!meResponse.ok) {
                    window.location.href = '/booking/${publicLink}/login';
                    return;
                }
                const client = await meResponse.json();
                document.getElementById('welcomeText').textContent = \`Bem-vindo de volta, \${client.name}!\`;
                
                // Get appointments
                const aptsResponse = await fetch('/api/client/appointments');
                const appointments = await aptsResponse.json();
                
                renderAppointments(appointments);
            } catch (error) {
                console.error('Error loading data:', error);
                document.getElementById('content').innerHTML = \`
                    <div class="empty-state">
                        <i class="material-icons">error_outline</i>
                        <h3>Erro ao carregar agendamentos</h3>
                        <p>Por favor tente novamente mais tarde</p>
                    </div>
                \`;
            }
        }
        
        function renderAppointments(appointments) {
            const content = document.getElementById('content');
            
            if (!appointments || appointments.length === 0) {
                content.innerHTML = \`
                    <div class="empty-state">
                        <i class="material-icons">event_available</i>
                        <h3>Nenhum agendamento ainda</h3>
                        <p>Agende seu primeiro horário para começar!</p>
                    </div>
                \`;
                return;
            }
            
            // Separate upcoming and past appointments
            const now = new Date();
            const upcoming = appointments.filter(apt => new Date(apt.appointmentDate) >= now);
            const past = appointments.filter(apt => new Date(apt.appointmentDate) < now);
            
            let html = '';
            
            if (upcoming.length > 0) {
                html += '<h2 style="margin-bottom: 15px; font-size: 20px;">Próximos Agendamentos</h2>';
                upcoming.forEach(apt => {
                    html += renderAppointmentCard(apt, true);
                });
            }
            
            if (past.length > 0) {
                html += '<h2 style="margin-top: 30px; margin-bottom: 15px; font-size: 20px;">Agendamentos Passados</h2>';
                past.forEach(apt => {
                    html += renderAppointmentCard(apt, false);
                });
            }
            
            content.innerHTML = html;
        }
        
        function renderAppointmentCard(apt, isUpcoming) {
            const date = new Date(apt.appointmentDate);
            const dateStr = date.toLocaleDateString('pt-BR', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' });
            const timeStr = date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
            
            const proceduresHtml = apt.procedures.map(proc => 
                \`<div class="procedure-item">• \${proc.procedureName} (\${proc.duration} min - R$\${parseFloat(proc.price).toFixed(2)})</div>\`
            ).join('');
            
            const canCancel = isUpcoming && apt.status !== 'cancelled' && apt.status !== 'completed';
            
            return \`
                <div class="appointment-card">
                    <div class="appointment-header">
                        <div class="appointment-date">\${dateStr}</div>
                        <div class="appointment-status status-\${apt.status}">\${apt.status}</div>
                    </div>
                    <div class="appointment-details">
                        <div class="detail-row">
                            <i class="material-icons">schedule</i>
                            <span>\${timeStr} (\${apt.totalDuration} min)</span>
                        </div>
                        \${apt.staff ? \`
                            <div class="detail-row">
                                <i class="material-icons">person</i>
                                <span>\${apt.staff.name}</span>
                            </div>
                        \` : ''}
                        <div class="detail-row">
                            <i class="material-icons">attach_money</i>
                            <span>R$\${parseFloat(apt.totalPrice).toFixed(2)}</span>
                        </div>
                        \${proceduresHtml ? \`
                            <div class="detail-row">
                                <i class="material-icons">content_cut</i>
                                <span>\${apt.procedureCount} serviço(s):</span>
                            </div>
                            <div class="procedures-list">
                                \${proceduresHtml}
                            </div>
                        \` : ''}
                    </div>
                    \${canCancel ? \`
                        <div class="appointment-actions">
                            <button class="action-button cancel-button" onclick="cancelAppointment(\${apt.id})">
                                Cancelar Agendamento
                            </button>
                        </div>
                    \` : ''}
                </div>
            \`;
        }
        
        async function cancelAppointment(id) {
            if (!confirm('Tem certeza que deseja cancelar este agendamento?')) {
                return;
            }
            
            try {
                const response = await fetch(\`/api/client/appointments/\${id}/cancel\`, {
                    method: 'PUT'
                });
                
                if (response.ok) {
                    alert('Agendamento cancelado com sucesso');
                    loadClientData();
                } else {
                    const data = await response.json();
                    alert(data.message || 'Falha ao cancelar agendamento');
                }
            } catch (error) {
                alert('Ocorreu um erro. Por favor tente novamente.');
            }
        }
        
        async function logout() {
            try {
                await fetch('/api/client/logout', { method: 'POST' });
                window.location.href = '/booking/${publicLink}';
            } catch (error) {
                console.error('Logout error:', error);
            }
        }
        
        // Load data on page load
        loadClientData();
    </script>
</body>
</html>`;
}


export async function registerRoutes(app: Express): Promise<Server> {
  // Setup local authentication (admin and client)
  setupAuth(app);
  // Client auth is configured in clientAuth.ts via passport strategies

  // ========================================
  // PUBLIC BOOKING API ROUTES
  // ========================================

  app.get('/api/public/slots', async (req, res) => {
    try {
      // 1. Validate inputs
      const { publicLink, date, staffId, serviceIds } = req.query;
      
      if (!publicLink || !date) {
        return res.status(400).json({ message: 'Missing required parameters' });
      }

      // 2. Get Company/User
      const [company] = await db.select().from(users).where(eq(users.publicLink, String(publicLink)));
      if (!company) {
        return res.status(404).json({ message: 'Company not found' });
      }

      // 3. Calculate Service Duration
      let totalDuration = 30; // Default 30 mins
      if (serviceIds) {
        const ids = String(serviceIds).split(',').map(Number);
        const servicesData = await db
            .select()
            .from(services)
            .where(inArray(services.id, ids));
        
        // Also check procedures if not found in services
        const proceduresData = await db
            .select()
            .from(procedures)
            .where(inArray(procedures.id, ids));

        const totalServiceDuration = servicesData.reduce((acc, curr) => acc + (curr.duration || 0), 0);
        const totalProcedureDuration = proceduresData.reduce((acc, curr) => acc + (curr.duration || 0), 0);
        
        if (totalServiceDuration + totalProcedureDuration > 0) {
            totalDuration = totalServiceDuration + totalProcedureDuration;
        }
      }

      // 4. Determine Day of Week
      const targetDate = new Date(String(date));
      // Adjust because 'new Date("2023-01-22")' is UTC, which might be previous day in local if using getDay()
      // Safest is to append T00:00:00 to ensure we get the right day component, or use simple mapping
      // Actually, business logic generally expects "YYYY-MM-DD".
      // Let's assume input is "YYYY-MM-DD" and we handle it explicitly.
      const daysOfWeek = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
      // Create date object treating the string as local time component
      const [year, month, day] = String(date).split('-').map(Number);
      const localDate = new Date(year, month - 1, day);
      const dayName = daysOfWeek[localDate.getDay()];

      console.log(`[Slots API] Date: ${date} (${dayName}), Staff: ${staffId}, Duration: ${totalDuration}`);

      // 5. Get Work Schedule (Staff Specific or General)
      let openTime = '09:00';
      let closeTime = '17:00';
      let isWorkingDay = false;

      if (staffId && String(staffId) !== 'undefined') {
        const schedule = await storage.getStaffSchedule(Number(staffId));
        const daySchedule = schedule.find(s => s.dayOfWeek.toLowerCase() === dayName);
        if (daySchedule && daySchedule.isAvailable) {
             openTime = daySchedule.startTime;
             closeTime = daySchedule.endTime;
             isWorkingDay = true;
        }
      } else {
        // Fallback to Company Hours
        const businessHours = await storage.getBusinessHours(company.id.toString());
        const dayHours = businessHours.find(h => h.dayOfWeek.toLowerCase() === dayName);
        if (dayHours && dayHours.isOpen) {
            openTime = dayHours.openTime || '09:00';
            closeTime = dayHours.closeTime || '17:00';
            isWorkingDay = true;
        }
      }

      if (!isWorkingDay) {
        return res.json([]);
      }

      // 6. Get Existing Appointments (Blockers)
      let blockers: { start: number; end: number }[] = [];
      if (staffId && String(staffId) !== 'undefined') {
        const appointments = await storage.getAppointmentsByDate(Number(staffId), localDate);
        
        blockers = appointments.map(apt => {
             const aptDate = new Date(apt.appointmentDate);
             const startMinutes = aptDate.getHours() * 60 + aptDate.getMinutes();
             // Determine duration
             // Prefer totalDuration (new field), fallback to legacy duration, fallback to 30
             const duration = apt.totalDuration || apt.duration || 60; 
             return { start: startMinutes, end: startMinutes + duration };
        });
      }

      // 7. Generate Slots
      const timeToMinutes = (t: string) => {
        const [h, m] = t.split(':').map(Number);
        return h * 60 + m;
      };

      const minutesToTime = (m: number) => {
        const h = Math.floor(m / 60);
        const mins = m % 60;
        return `${h.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
      };

      const startMin = timeToMinutes(openTime);
      const endMin = timeToMinutes(closeTime);
      const slots: string[] = [];

      // Step interval 30 mins
      for (let time = startMin; time < endMin; time += 30) {
        const slotStart = time;
        const slotEnd = time + totalDuration;

        // Check boundary
        if (slotEnd > endMin) continue;

        // Check blockers
        const isBlocked = blockers.some(b => {
             // Overlap: (SlotStart < BlockEnd) AND (SlotEnd > BlockStart)
             return slotStart < b.end && slotEnd > b.start;
        });

        if (!isBlocked) {
            slots.push(minutesToTime(slotStart));
        }
      }

      res.json(slots);

    } catch (error) {
      console.error("Error fetching slots:", error);
      res.status(500).json({ message: 'Internal Server Error' });
    }
  });

  // ========================================
  // PUBLIC BOOKING ROUTES
  // ========================================

  
  // Public booking home page
  app.get('/booking/:publicLink', async (req, res) => {
    try {
      const { publicLink } = req.params;
      const [company] = await db.select().from(users).where(eq(users.publicLink, publicLink));
      if (!company) {
        return res.status(404).send(`<!DOCTYPE html><html><head><title>Not Found</title></head><body><h1>Company Not Found</h1></body></html>`);
      }
      const businessHours = await storage.getBusinessHours(company.id.toString());
      const html = generateBookingPage(company, businessHours);
      res.set('Content-Type', 'text/html');
      res.send(html);
    } catch (error) {
      console.error("Error serving booking page:", error);
      res.status(500).send(`<!DOCTYPE html><html><head><title>Error</title></head><body><h1>Error</h1></body></html>`);
    }
  });

  // Public booking services page
  app.get('/booking/:publicLink/services', async (req, res) => {
    try {
      const { publicLink } = req.params;
      const [company] = await db.select().from(users).where(eq(users.publicLink, publicLink));
      if (!company) {
        return res.status(404).send(`<!DOCTYPE html><html><head><title>Not Found</title></head><body><h1>Company Not Found</h1></body></html>`);
      }
      const procedures = await procedureStorage.getProcedures(company.id.toString());
      const html = generateServicesPage(company, procedures);
      res.set('Content-Type', 'text/html');
      res.send(html);
    } catch (error) {
      console.error("Error serving services page:", error);
      res.status(500).send(`<!DOCTYPE html><html><head><title>Error</title></head><body><h1>Error</h1></body></html>`);
    }
  });

  // Public booking specialists page
  app.get('/booking/:publicLink/specialists', async (req, res) => {
    try {
      const { publicLink } = req.params;
      const [company] = await db.select().from(users).where(eq(users.publicLink, publicLink));
      if (!company) {
        return res.status(404).send(`<!DOCTYPE html><html><head><title>Not Found</title></head><body><h1>Company Not Found</h1></body></html>`);
      }
      const staff = await storage.getStaff(company.id.toString());
      const html = generateSpecialistsPage(company, staff);
      res.set('Content-Type', 'text/html');
      res.send(html);
    } catch (error) {
      console.error("Error serving specialists page:", error);
      res.status(500).send(`<!DOCTYPE html><html><head><title>Error</title></head><body><h1>Error</h1></body></html>`);
    }
  });

  // Public booking datetime page
  app.get('/booking/:publicLink/datetime', async (req, res) => {
    try {
      const { publicLink } = req.params;
      const [company] = await db.select().from(users).where(eq(users.publicLink, publicLink));
      if (!company) {
        return res.status(404).send(`<!DOCTYPE html><html><head><title>Not Found</title></head><body><h1>Company Not Found</h1></body></html>`);
      }
      const businessHours = await storage.getBusinessHours(company.id.toString());
      const html = generateDateTimePage(company, businessHours);
      res.set('Content-Type', 'text/html');
      res.send(html);
    } catch (error) {
      console.error("Error serving datetime page:", error);
      res.status(500).send(`<!DOCTYPE html><html><head><title>Error</title></head><body><h1>Error</h1></body></html>`);
    }
  });

  // Public booking customer info page
  app.get('/booking/:publicLink/customer', async (req, res) => {
    try {
      const { publicLink } = req.params;
      const [company] = await db.select().from(users).where(eq(users.publicLink, publicLink));
      if (!company) {
        return res.status(404).send(`<!DOCTYPE html><html><head><title>Not Found</title></head><body><h1>Company Not Found</h1></body></html>`);
      }
      const html = generateCustomerPage(company);
      res.set('Content-Type', 'text/html');
      res.send(html);
    } catch (error) {
      console.error("Error serving customer page:", error);
      res.status(500).send(`<!DOCTYPE html><html><head><title>Error</title></head><body><h1>Error</h1></body></html>`);
    }
  });

  // Public booking confirmation page
  app.get('/booking/:publicLink/confirmation', async (req, res) => {
    try {
      const { publicLink } = req.params;
      const [company] = await db.select().from(users).where(eq(users.publicLink, publicLink));
      if (!company) {
        return res.status(404).send(`<!DOCTYPE html><html><head><title>Not Found</title></head><body><h1>Company Not Found</h1></body></html>`);
      }
      const html = generateConfirmationPage(company);
      res.set('Content-Type', 'text/html');
      res.send(html);
    } catch (error) {
      console.error("Error serving confirmation page:", error);
      res.status(500).send(`<!DOCTYPE html><html><head><title>Error</title></head><body><h1>Error</h1></body></html>`);
    }
  });

  // ========================================
  // CLIENT PORTAL ROUTES (Login, Register, Dashboard)
  // ========================================

  // Client login page
  app.get('/booking/:publicLink/login', async (req, res) => {
    try {
      const { publicLink } = req.params;
      const [company] = await db.select().from(users).where(eq(users.publicLink, publicLink));
      if (!company) {
        return res.status(404).send(`<!DOCTYPE html><html><head><title>Not Found</title></head><body><h1>Company Not Found</h1></body></html>`);
      }
      const html = generateClientLoginPage(company);
      res.set('Content-Type', 'text/html');
      res.send(html);
    } catch (error) {
      console.error("Error serving login page:", error);
      res.status(500).send(`<!DOCTYPE html><html><head><title>Error</title></head><body><h1>Error</h1></body></html>`);
    }
  });

  // Client register page
  app.get('/booking/:publicLink/register', async (req, res) => {
    try {
      const { publicLink } = req.params;
      const [company] = await db.select().from(users).where(eq(users.publicLink, publicLink));
      if (!company) {
        return res.status(404).send(`<!DOCTYPE html><html><head><title>Not Found</title></head><body><h1>Company Not Found</h1></body></html>`);
      }
      const html = generateClientRegisterPage(company);
      res.set('Content-Type', 'text/html');
      res.send(html);
    } catch (error) {
      console.error("Error serving register page:", error);
      res.status(500).send(`<!DOCTYPE html><html><head><title>Error</title></head><body><h1>Error</h1></body></html>`);
    }
  });

  // Client dashboard page
  app.get('/booking/:publicLink/dashboard', async (req, res) => {
    try {
      const { publicLink } = req.params;
      const [company] = await db.select().from(users).where(eq(users.publicLink, publicLink));
      if (!company) {
        return res.status(404).send(`<!DOCTYPE html><html><head><title>Not Found</title></head><body><h1>Company Not Found</h1></body></html>`);
      }
      const html = generateClientDashboardPage(company);
      res.set('Content-Type', 'text/html');
      res.send(html);
    } catch (error) {
      console.error("Error serving dashboard page:", error);
      res.status(500).send(`<!DOCTYPE html><html><head><title>Error</title></head><body><h1>Error</h1></body></html>`);
    }
  });

  // ========================================
  // END PUBLIC BOOKING ROUTES
  // ========================================

  // Get current user
  // Debug endpoint to check session
  app.get('/api/debug-session', isAuthenticated, async (req: any, res) => {
    res.json({
      session: req.session ? {
        passport: req.session.passport,
        cookie: req.session.cookie
      } : null,
      user: req.user ? {
        id: req.user.id,
        username: req.user.username || req.user.name,
        userType: req.user.userType,
        accessLevel: req.user.accessLevel,
        role: req.user.role,
        keys: Object.keys(req.user)
      } : null,
      isAuthenticated: req.isAuthenticated()
    });
  });

  app.get('/api/user', isAuthenticated, async (req: any, res) => {
    try {
      const user = req.user;
      
      console.log('\n[GET /api/user] ===== REQUEST =====');
      console.log('[GET /api/user] req.session.passport.user:', JSON.stringify(req.session?.passport?.user, null, 2));
      console.log('[GET /api/user] req.user completo:', JSON.stringify(user, null, 2));
      
      // VERIFICAÇÃO CRÍTICA: Se a sessão tem userType 'staff', SEMPRE carregar staff da tabela
      // Isso é a fonte de verdade - a sessão sempre tem os dados corretos
      const sessionUser = req.session?.passport?.user;
      
      if (sessionUser && typeof sessionUser === 'object' && sessionUser.userType === 'staff') {
        console.log('[GET /api/user] ✅ Sessão indica STAFF - carregando da tabela staff (ID:', sessionUser.id, ')');
        const { db } = await import('./db');
        const { staff } = await import('@shared/schema');
        const { eq } = await import('drizzle-orm');
        
        const [staffMember] = await db
          .select()
          .from(staff)
          .where(eq(staff.id, sessionUser.id))
          .limit(1);
        
        if (staffMember) {
          console.log('[GET /api/user] ✅ Staff encontrado - retornando dados de staff');
          const staffData = {
            id: staffMember.id,
            username: staffMember.username,
            name: staffMember.name,
            email: staffMember.email,
            role: staffMember.role || 'therapist',
            accessLevel: staffMember.accessLevel || 'staff',
            userType: 'staff',
            userId: staffMember.userId,
            companyId: staffMember.companyId,
            isActive: staffMember.isActive !== undefined ? staffMember.isActive : true,
          };
          console.log('[GET /api/user] Dados de staff a retornar:', JSON.stringify(staffData, null, 2));
          res.json(staffData);
          return;
        } else {
          console.log('[GET /api/user] ❌ Staff não encontrado na tabela para id:', sessionUser.id);
        }
      } else {
        console.log('[GET /api/user] ⚠️ sessionUser não é staff:', {
          exists: !!sessionUser,
          type: typeof sessionUser,
          userType: sessionUser?.userType,
          id: sessionUser?.id
        });
      }
      
      // VERIFICAÇÃO PRINCIPAL: Se user.userType === 'staff', SEMPRE retornar dados de staff
      // Isso garante que mesmo se houver algum problema no deserializeUser,
      // o endpoint sempre retornará os dados corretos baseado no userType
      if (user && user.userType === 'staff') {
        console.log('[GET /api/user] ✅ User é STAFF - retornando dados de staff');
        res.json({
          id: user.id,
          username: user.username,
          name: user.name,
          email: user.email,
          role: user.role || 'therapist', // 'therapist', 'receptionist', 'manager' (função)
          accessLevel: user.accessLevel || 'staff', // 'admin' ou 'staff' (nível de acesso)
          userType: 'staff',
          userId: user.userId, // Admin ID that owns this staff
          companyId: user.companyId,
          isActive: user.isActive !== undefined ? user.isActive : true,
        });
        return;
      }
      
      // Se não tem userType definido, verificar pela estrutura do objeto
      // Staff tem 'name' mas não tem 'firstName'/'lastName'
      // Admin tem 'firstName'/'lastName' mas não tem 'name'
      if (user && user.name && !user.firstName && !user.lastName) {
        console.log('[GET /api/user] ✅ Detectado como STAFF pela estrutura (tem name, não tem firstName/lastName)');
        res.json({
          id: user.id,
          username: user.username,
          name: user.name,
          email: user.email,
          role: user.role || 'therapist',
          accessLevel: user.accessLevel || 'staff',
          userType: 'staff',
          userId: user.userId,
          companyId: user.companyId,
          isActive: user.isActive !== undefined ? user.isActive : true,
        });
        return;
      }
      
      // Admin user (from users table)
      console.log('[GET /api/user] ⚠️ User é ADMIN - retornando dados de admin');
      res.json({
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        accessLevel: 'admin', // Admin sempre tem acesso total
        userType: user.userType || 'admin',
        parentUserId: user.parentUserId,
        companyId: user.companyId,
        isActive: user.isActive,
        firstName: user.firstName,
        lastName: user.lastName
      });
    } catch (error) {
      console.error("Error fetching current user:", error);
      res.status(500).json({ message: "Failed to fetch current user" });
    }
  });

  // Debug endpoint to check req.user in isAdmin middleware
  app.get('/api/debug-auth', isAuthenticated, isAdmin, async (req: any, res) => {
    res.json({
      message: "Admin access confirmed",
      user: {
        id: req.user?.id,
        username: req.user?.username,
        role: req.user?.role,
        companyId: req.user?.companyId,
        parentUserId: req.user?.parentUserId
      }
    });
  });

  // Update user profile (including banner URLs)
  app.put('/api/user/profile', isAuthenticated, async (req: any, res) => {
    try {
      // Ensure JSON response
      res.setHeader('Content-Type', 'application/json');
      
      const userId = req.user.id;
      const updates = req.body;
      
      console.log("🔵 Profile update request:", { userId, updates });
      
      // Only allow updating specific fields
      const allowedFields = ['loginBannerUrl', 'dashboardBannerUrl', 'firstName', 'lastName', 'email', 'clinicName', 'clinicAddress', 'clinicPhone', 'clinicWhatsapp', 'language', 'currency'];
      const filteredUpdates: any = {};
      
      // Validação simples de idioma e moeda
      if (updates.language) {
        const validLanguages = ['pt-BR', 'en-NZ', 'en-US', 'es-ES'];
        if (validLanguages.includes(updates.language)) {
          filteredUpdates.language = updates.language;
        }
      }
      
      if (updates.currency) {
        const validCurrencies = ['BRL', 'NZD', 'USD', 'EUR', 'GBP', 'MXN', 'ARS', 'CLP', 'COP', 'CAD', 'AUD', 'CHF', 'NOK', 'SEK'];
        if (validCurrencies.includes(updates.currency)) {
          filteredUpdates.currency = updates.currency;
        }
      }
      
      for (const field of allowedFields) {
        if (updates[field] !== undefined && field !== 'language' && field !== 'currency') {
          filteredUpdates[field] = updates[field];
        }
      }
      
      console.log("🔵 Filtered updates:", filteredUpdates);
      
      const updatedUser = await storage.updateUser(userId, filteredUpdates);
      
      console.log("✅ User updated successfully:", { 
        id: updatedUser.id, 
        loginBannerUrl: updatedUser.loginBannerUrl,
        dashboardBannerUrl: updatedUser.dashboardBannerUrl 
      });
      
      return res.json(updatedUser);
    } catch (error: any) {
      console.error("❌ Error updating user profile:", error);
      return res.status(500).json({ 
        message: "Failed to update profile",
        error: error?.message || "Unknown error"
      });
    }
  });

  // Public route to get login banner URL
  app.get('/api/public/login-banner', async (req, res) => {
    try {
      // Ensure JSON response
      res.setHeader('Content-Type', 'application/json');
      
      // Get the first active user with login banner URL
      // First try to get user with loginBannerUrl, if not found, get any active user
      let [user] = await db
        .select({ 
          loginBannerUrl: users.loginBannerUrl 
        })
        .from(users)
        .where(
          and(
            eq(users.isActive, true),
            isNotNull(users.loginBannerUrl)
          )
        )
        .orderBy(desc(users.updatedAt))
        .limit(1);
      
      // If no user with banner, try to get any active user (for fallback)
      if (!user) {
        [user] = await db
          .select({ 
            loginBannerUrl: users.loginBannerUrl 
          })
          .from(users)
          .where(eq(users.isActive, true))
          .limit(1);
      }
      
      console.log("🔵 Login banner query result:", { 
        found: !!user, 
        loginBannerUrl: user?.loginBannerUrl 
      });
      
      if (user?.loginBannerUrl) {
        return res.json({ url: user.loginBannerUrl });
      } else {
        return res.json({ url: null });
      }
    } catch (error: any) {
      console.error("❌ Error fetching login banner:", error);
      return res.status(500).json({ 
        message: "Failed to fetch login banner",
        error: error?.message || "Unknown error"
      });
    }
  });

  // Generate or regenerate public link
  app.post('/api/user/generate-public-link', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const { customLink } = req.body;
      
      let publicLink: string;
      
      if (customLink) {
        // Sanitize custom link: lowercase, replace spaces with hyphens, remove special chars
        publicLink = customLink
          .toLowerCase()
          .trim()
          .replace(/\s+/g, '-')
          .replace(/[^a-z0-9-]/g, '')
          .substring(0, 50);
        
        // Check if this link is already taken by another user
        const [existing] = await db.select()
          .from(users)
          .where(eq(users.publicLink, publicLink));
        
        if (existing && existing.id !== userId) {
          return res.status(400).json({ 
            message: "This link is already taken. Please choose a different one.",
            taken: true
          });
        }
      } else {
        // Generate a unique random link
        publicLink = generateUniqueId();
      }
      
      // Update user with new public link
      await db.update(users)
        .set({ publicLink, updatedAt: new Date() })
        .where(eq(users.id, userId));

      res.json({ publicLink });
    } catch (error) {
      console.error("Error generating public link:", error);
      res.status(500).json({ message: "Failed to generate public link" });
    }
  });

  // Notification routes — server/routes/notifications.ts
  const { registerNotificationRoutes } = await import("./routes/notifications");
  registerNotificationRoutes(app);

  // Dashboard stats
  app.get('/api/dashboard/stats', isAuthenticated, async (req: any, res) => {
    try {
      const userId = getEffectiveUserId(req);
      const stats = await storage.getDashboardStats(userId);
      res.json(stats);
    } catch (error) {
      console.error("Error fetching dashboard stats:", error);
      res.status(500).json({ message: "Failed to fetch dashboard stats" });
    }
  });

    // Staff Users Management routes — server/routes/staff-users.ts
  const { registerStaffUserRoutes } = await import('./routes/staff-users');
  registerStaffUserRoutes(app);

    // Client routes — server/routes/clients.ts
  const { registerClientRoutes } = await import("./routes/clients");
  registerClientRoutes(app);

  // Service routes — server/routes/services.ts
  const { registerServiceRoutes } = await import("./routes/services");
  registerServiceRoutes(app);

  // Appointment + Clinical records routes — server/routes/appointments.ts
  const { registerAppointmentRoutes } = await import('./routes/appointments');
  registerAppointmentRoutes(app);

  // object storage routes — server/routes/object-storage.ts
  const { registerObjectStorageRoutes } = await import("./routes/object-storage");
  registerObjectStorageRoutes(app);

  // public API + client booking routes — server/routes/public.ts
  const { registerPublicRoutes } = await import("./routes/public");
  registerPublicRoutes(app);


  // procedures routes — server/routes/procedures.ts
  const { registerProcedureRoutes } = await import("./routes/procedures");
  registerProcedureRoutes(app);

  // integrations routes — server/routes/integrations.ts
  const { registerIntegrationRoutes } = await import("./routes/integrations");
  registerIntegrationRoutes(app);

  // campaigns routes — server/routes/campaigns.ts
  const { registerCampaignRoutes } = await import("./routes/campaigns");
  registerCampaignRoutes(app);

  // banners routes — server/routes/banners.ts
  const { registerBannerRoutes } = await import("./routes/banners");
  registerBannerRoutes(app);

  // packages routes — server/routes/packages.ts
  const { registerPackageRoutes } = await import("./routes/packages");
  registerPackageRoutes(app);

  // loyalty-settings routes — server/routes/loyalty-settings.ts
  const { registerLoyaltySettingsRoutes } = await import("./routes/loyalty-settings");
  registerLoyaltySettingsRoutes(app);

  // sales routes — server/routes/sales.ts
  const { registerSaleRoutes } = await import("./routes/sales");
  registerSaleRoutes(app);

  // products routes — server/routes/products.ts
  const { registerProductRoutes } = await import("./routes/products");
  registerProductRoutes(app);

  // staff routes — server/routes/staff.ts
  const { registerStaffRoutes } = await import("./routes/staff");
  registerStaffRoutes(app);

  // financial routes — server/routes/financial.ts
  const { registerFinancialRoutes } = await import("./routes/financial");
  registerFinancialRoutes(app);

  // reports routes — server/routes/reports.ts
  const { registerReportsRoutes } = await import("./routes/reports");
  registerReportsRoutes(app);

  // vouchers routes — server/routes/vouchers.ts
  const { registerVoucherRoutes } = await import("./routes/vouchers");
  registerVoucherRoutes(app);

  // inventory routes — server/routes/inventory.ts
  const { registerInventoryRoutes } = await import("./routes/inventory");
  registerInventoryRoutes(app);

  // analytics routes — server/routes/analytics.ts
  const { registerAnalyticsRoutes } = await import("./routes/analytics");
  registerAnalyticsRoutes(app);

  // clinical records routes — server/routes/clinical.ts
  const { registerClinicalRecordRoutes } = await import("./routes/clinical");
  registerClinicalRecordRoutes(app);

  // consumptions routes — server/routes/consumptions.ts
  const { registerConsumptionsRoutes } = await import("./routes/consumptions");
  registerConsumptionsRoutes(app);

  // legacy payment route — server/routes/payments.ts
  const { registerLegacyPaymentRoutes } = await import("./routes/payments");
  registerLegacyPaymentRoutes(app);

  // fiscal routes — server/routes/fiscal.ts
  const { registerFiscalRoutes } = await import('./routes/fiscal');
  registerFiscalRoutes(app);

  const httpServer = createServer(app);
  return httpServer;
}
