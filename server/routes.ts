import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { procedureStorage } from "./procedures";
import { setupAuth, isAuthenticated } from "./auth";
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
  insertBannerSchema,
  insertPackageSchema,
  insertLoyaltySettingsSchema,
  users,
  clients,
  appointments,
  services,
  notifications,
  procedures,
  staff,
  businessHours,
  clinicalRecords,
  transactions,
  loyalty,
  inventory,
  messages,
  integrations,
  appointmentProcedures,
  products,
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
    <title>${clinicName} - Book Your Appointment</title>
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
            <span>Login</span>
        </a>
        
        <div class="header">
            <div class="logo">
                <i class="material-icons">spa</i>
            </div>
            <h1 class="title">${clinicName}</h1>
            <p class="tagline">${specialties}</p>
        </div>
        
        <a href="/booking/${publicLink}/services" class="cta-button">Book Now</a>
        
        <div class="features">
            <div class="feature">
                <i class="material-icons">star</i>
                <p>Premium Services</p>
            </div>
            <div class="feature">
                <i class="material-icons">people</i>
                <p>Expert Specialists</p>
            </div>
            <div class="feature">
                <i class="material-icons">schedule</i>
                <p>Flexible Booking</p>
            </div>
        </div>
        
        <div class="info-section">
            <div class="info-title">
                <i class="material-icons">location_on</i>
                Contact Information
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
                <span>Home</span>
            </a>
            <a href="#services" class="nav-item">
                <i class="material-icons">content_cut</i>
                <span>Services</span>
            </a>
            <a href="#about" class="nav-item">
                <i class="material-icons">info</i>
                <span>About Us</span>
            </a>
            <a href="#contact" class="nav-item">
                <i class="material-icons">contact_phone</i>
                <span>Contact</span>
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
                    loginBtn.querySelector('span').textContent = 'My Appointments';
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
    const price = proc.price ? `$${parseFloat(proc.price).toFixed(2)}` : 'Price on request';
    const duration = proc.duration ? `${proc.duration} min` : 'Duration varies';
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
    <title>${clinicName} - Our Services</title>
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
            <h1 class="title">Our Services</h1>
            <div class="search-bar">
                <i class="material-icons">search</i>
                <input type="text" id="searchInput" placeholder="Search for services...">
            </div>
        </div>
        
        <div class="categories">
            <div class="category active" data-category="all">All</div>
            ${categories.map(cat => `<div class="category" data-category="${cat}">${cat}</div>`).join('')}
        </div>
        
        <div class="services" id="servicesContainer">
            ${procedureItems}
        </div>
        
        <div class="selected-count" id="selectedCount">
            <span id="countText">0 services selected</span>
        </div>
        
        <button class="continue-button" id="continueBtn" disabled>
            <i class="material-icons">arrow_forward</i>
            Continue
        </button>
        
        <div class="bottom-nav">
            <a href="/booking/${publicLink}" class="nav-item">
                <i class="material-icons">home</i>
                <span>Home</span>
            </a>
            <a href="/booking/${publicLink}/services" class="nav-item active">
                <i class="material-icons">content_cut</i>
                <span>Services</span>
            </a>
            <a href="#" class="nav-item">
                <i class="material-icons">info</i>
                <span>About Us</span>
            </a>
            <a href="#" class="nav-item">
                <i class="material-icons">contact_phone</i>
                <span>Contact</span>
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
            
            countText.textContent = count + (count === 1 ? ' service selected' : ' services selected');
            
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
    <title>${clinicName} - Choose Specialist</title>
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
            <h1 class="title">Choose Your Specialist</h1>
        </div>
        <div class="specialists">${staffItems}</div>
        <button class="continue-button" id="continueBtn" disabled><i class="material-icons">arrow_forward</i>Continue</button>
        <div class="bottom-nav">
            <a href="/booking/${publicLink}" class="nav-item"><i class="material-icons">home</i><span>Home</span></a>
            <a href="/booking/${publicLink}/services" class="nav-item"><i class="material-icons">content_cut</i><span>Services</span></a>
            <a href="#" class="nav-item active"><i class="material-icons">person</i><span>Specialist</span></a>
            <a href="#" class="nav-item"><i class="material-icons">contact_phone</i><span>Contact</span></a>
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
    <title>${clinicName} - Select Date & Time</title>
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
        .time-slots { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; }
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
    </style>
</head>
<body>
    <div class="slide">
        <div class="header">
            <h1 class="title">Select Date & Time</h1>
        </div>
        <div class="content">
            <div class="calendar">
                <div class="section-title">Select Date</div>
                <input type="date" class="date-input" id="dateInput" min="${new Date().toISOString().split('T')[0]}">
            </div>
            <div class="section-title">Available Time Slots</div>
            <div class="time-slots" id="timeSlots">
                <div class="time-slot" data-time="09:00">9:00 AM</div>
                <div class="time-slot" data-time="10:00">10:00 AM</div>
                <div class="time-slot" data-time="11:00">11:00 AM</div>
                <div class="time-slot" data-time="12:00">12:00 PM</div>
                <div class="time-slot" data-time="13:00">1:00 PM</div>
                <div class="time-slot" data-time="14:00">2:00 PM</div>
                <div class="time-slot" data-time="15:00">3:00 PM</div>
                <div class="time-slot" data-time="16:00">4:00 PM</div>
                <div class="time-slot" data-time="17:00">5:00 PM</div>
            </div>
        </div>
        <button class="continue-button" id="continueBtn" disabled><i class="material-icons">arrow_forward</i>Continue</button>
        <div class="bottom-nav">
            <a href="/booking/${publicLink}" class="nav-item"><i class="material-icons">home</i><span>Home</span></a>
            <a href="/booking/${publicLink}/services" class="nav-item"><i class="material-icons">content_cut</i><span>Services</span></a>
            <a href="#" class="nav-item active"><i class="material-icons">schedule</i><span>Date/Time</span></a>
            <a href="#" class="nav-item"><i class="material-icons">contact_phone</i><span>Contact</span></a>
        </div>
    </div>
    <script>
        let selectedDate = null;
        let selectedTime = null;
        document.getElementById('dateInput').addEventListener('change', function() {
            selectedDate = this.value;
            updateContinueButton();
        });
        document.querySelectorAll('.time-slot').forEach(slot => {
            slot.addEventListener('click', function() {
                document.querySelectorAll('.time-slot').forEach(s => s.classList.remove('selected'));
                this.classList.add('selected');
                selectedTime = this.getAttribute('data-time');
                updateContinueButton();
            });
        });
        function updateContinueButton() {
            document.getElementById('continueBtn').disabled = !(selectedDate && selectedTime);
        }
        document.getElementById('continueBtn').addEventListener('click', function() {
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
    <title>${clinicName} - Your Information</title>
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
            <h1 class="title">Your Information</h1>
        </div>
        <div class="content">
            <div class="login-link" id="loginLink" style="display: none;">
                Already have an account? <a href="/booking/${publicLink}/login">Login</a> to pre-fill your information
            </div>
            <form id="customerForm">
                <div class="form-group">
                    <label class="form-label">Full Name *</label>
                    <input type="text" class="form-input" id="name" required>
                </div>
                <div class="form-group">
                    <label class="form-label">Email *</label>
                    <input type="email" class="form-input" id="email" required>
                </div>
                <div class="form-group">
                    <label class="form-label">Phone *</label>
                    <input type="tel" class="form-input" id="phone" required>
                </div>
                <div class="form-group">
                    <label class="form-label">Notes (Optional)</label>
                    <textarea class="form-input" id="notes" rows="4" placeholder="Any special requirements or notes..."></textarea>
                </div>
            </form>
        </div>
        <button class="continue-button" id="continueBtn"><i class="material-icons">arrow_forward</i>Continue</button>
        <div class="bottom-nav">
            <a href="/booking/${publicLink}" class="nav-item"><i class="material-icons">home</i><span>Home</span></a>
            <a href="/booking/${publicLink}/services" class="nav-item"><i class="material-icons">content_cut</i><span>Services</span></a>
            <a href="#" class="nav-item active"><i class="material-icons">person</i><span>Your Info</span></a>
            <a href="#" class="nav-item"><i class="material-icons">contact_phone</i><span>Contact</span></a>
        </div>
    </div>
    <script>
        // Check if client is logged in and auto-fill data
        fetch('/api/client/me')
            .then(res => res.ok ? res.json() : null)
            .then(client => {
                if (client) {
                    // Client is logged in - auto-fill data
                    document.getElementById('name').value = client.name || '';
                    document.getElementById('email').value = client.email || '';
                    document.getElementById('phone').value = client.phone || '';
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
                alert('Please fill in all required fields');
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
    <title>${clinicName} - Confirmation</title>
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
            <h1 class="title">Review Your Booking</h1>
        </div>
        <div class="content">
            <div class="summary" id="summary">
                <div class="summary-item">
                    <div class="summary-label">Services</div>
                    <div class="summary-value" id="servicesText">Loading...</div>
                </div>
                <div class="summary-item">
                    <div class="summary-label">Specialist</div>
                    <div class="summary-value" id="specialistText">Loading...</div>
                </div>
                <div class="summary-item">
                    <div class="summary-label">Date & Time</div>
                    <div class="summary-value" id="datetimeText">Loading...</div>
                </div>
                <div class="summary-item">
                    <div class="summary-label">Your Information</div>
                    <div class="summary-value" id="customerText">Loading...</div>
                </div>
            </div>
            <div class="info-box">
                <p><strong>${clinicName}</strong></p>
                <p>${address}</p>
                <p>Phone: ${phone}</p>
            </div>
        </div>
        <button class="confirm-button" id="confirmBtn"><i class="material-icons">check_circle</i>Confirm Booking</button>
        <div class="bottom-nav">
            <a href="/booking/${publicLink}" class="nav-item"><i class="material-icons">home</i><span>Home</span></a>
            <a href="/booking/${publicLink}/services" class="nav-item"><i class="material-icons">content_cut</i><span>Services</span></a>
            <a href="#" class="nav-item active"><i class="material-icons">check_circle</i><span>Confirm</span></a>
            <a href="#" class="nav-item"><i class="material-icons">contact_phone</i><span>Contact</span></a>
        </div>
    </div>
    <script>
        // Load booking data from sessionStorage
        const selectedServices = JSON.parse(sessionStorage.getItem('selectedServices') || '[]');
        const selectedSpecialist = sessionStorage.getItem('selectedSpecialist');
        const selectedDate = sessionStorage.getItem('selectedDate');
        const selectedTime = sessionStorage.getItem('selectedTime');
        const customerInfo = JSON.parse(sessionStorage.getItem('customerInfo') || '{}');
        
        document.getElementById('servicesText').textContent = selectedServices.length + ' service(s) selected';
        document.getElementById('specialistText').textContent = selectedSpecialist ? 'Specialist ID: ' + selectedSpecialist : 'Not selected';
        document.getElementById('datetimeText').textContent = selectedDate && selectedTime ? selectedDate + ' at ' + selectedTime : 'Not selected';
        document.getElementById('customerText').textContent = customerInfo.name ? customerInfo.name + ' - ' + customerInfo.email : 'Not provided';
        
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
                    alert('Booking confirmed! We will contact you soon.');
                    sessionStorage.clear();
                    window.location.href = '/booking/${publicLink}';
                } else {
                    const errorData = await response.json();
                    alert('Error creating booking: ' + (errorData.message || 'Please try again.'));
                }
            } catch (error) {
                alert('Error creating booking. Please try again.');
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
    <title>${clinicName} - Client Login</title>
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
            <h1>Welcome Back</h1>
            <p>Login to manage your appointments</p>
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
                    <label for="password">Password</label>
                    <input type="password" id="password" name="password" required>
                </div>
                
                <button type="submit" class="login-button" id="loginBtn">
                    Login
                </button>
            </form>
            
            <div class="register-link">
                Don't have an account? <a href="/booking/${publicLink}/register">Register</a>
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
            loginBtn.textContent = 'Logging in...';
            
            try {
                const response = await fetch('/api/client/login/${publicLink}', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email, password })
                });
                
                const data = await response.json();
                
                if (response.ok) {
                    successMessage.textContent = 'Login successful! Redirecting...';
                    successMessage.style.display = 'block';
                    setTimeout(() => {
                        window.location.href = '/booking/${publicLink}/dashboard';
                    }, 1000);
                } else {
                    errorMessage.textContent = data.message || 'Login failed. Please try again.';
                    errorMessage.style.display = 'block';
                    loginBtn.disabled = false;
                    loginBtn.textContent = 'Login';
                }
            } catch (error) {
                errorMessage.textContent = 'An error occurred. Please try again.';
                errorMessage.style.display = 'block';
                loginBtn.disabled = false;
                loginBtn.textContent = 'Login';
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
    <title>${clinicName} - Create Account</title>
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
            <h1>Create Account</h1>
            <p>Join us and manage your appointments easily</p>
        </div>
        
        <div class="form-container">
            <div class="error-message" id="errorMessage"></div>
            <div class="success-message" id="successMessage"></div>
            
            <form id="registerForm">
                <div class="form-group">
                    <label for="name">Full Name *</label>
                    <input type="text" id="name" name="name" required>
                </div>
                
                <div class="form-group">
                    <label for="email">Email *</label>
                    <input type="email" id="email" name="email" required>
                </div>
                
                <div class="form-group">
                    <label for="phone">Phone</label>
                    <input type="tel" id="phone" name="phone">
                </div>
                
                <div class="form-group">
                    <label for="password">Password *</label>
                    <input type="password" id="password" name="password" required minlength="6">
                </div>
                
                <div class="form-group">
                    <label for="confirmPassword">Confirm Password *</label>
                    <input type="password" id="confirmPassword" name="confirmPassword" required minlength="6">
                    <div class="password-match" id="passwordMatch"></div>
                </div>
                
                <button type="submit" class="register-button" id="registerBtn">
                    Create Account
                </button>
            </form>
            
            <div class="login-link">
                Already have an account? <a href="/booking/${publicLink}/login">Login</a>
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
                    passwordMatch.textContent = '✓ Passwords match';
                    passwordMatch.className = 'password-match success';
                    passwordMatch.style.display = 'block';
                } else {
                    passwordMatch.textContent = '✗ Passwords do not match';
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
                errorMessage.textContent = 'Passwords do not match';
                errorMessage.style.display = 'block';
                return;
            }
            
            errorMessage.style.display = 'none';
            successMessage.style.display = 'none';
            registerBtn.disabled = true;
            registerBtn.textContent = 'Creating account...';
            
            try {
                const response = await fetch('/api/client/register/${publicLink}', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ name, email, phone, password: pwd })
                });
                
                const data = await response.json();
                
                if (response.ok) {
                    successMessage.textContent = 'Account created successfully! Redirecting to login...';
                    successMessage.style.display = 'block';
                    setTimeout(() => {
                        window.location.href = '/booking/${publicLink}/login';
                    }, 1500);
                } else {
                    errorMessage.textContent = data.message || 'Registration failed. Please try again.';
                    errorMessage.style.display = 'block';
                    registerBtn.disabled = false;
                    registerBtn.textContent = 'Create Account';
                }
            } catch (error) {
                errorMessage.textContent = 'An error occurred. Please try again.';
                errorMessage.style.display = 'block';
                registerBtn.disabled = false;
                registerBtn.textContent = 'Create Account';
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
    <title>${clinicName} - My Appointments</title>
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
            <button onclick="logout()" class="logout-button">Logout</button>
            <h1>My Appointments</h1>
            <p class="welcome" id="welcomeText">Loading...</p>
        </div>
        
        <div class="content" id="content">
            <div class="loading">
                <i class="material-icons" style="font-size: 48px; color: #e91e63;">hourglass_empty</i>
                <p>Loading your appointments...</p>
            </div>
        </div>
        
        <a href="/booking/${publicLink}/services" class="book-new-button">
            Book New Appointment
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
                document.getElementById('welcomeText').textContent = \`Welcome back, \${client.name}!\`;
                
                // Get appointments
                const aptsResponse = await fetch('/api/client/appointments');
                const appointments = await aptsResponse.json();
                
                renderAppointments(appointments);
            } catch (error) {
                console.error('Error loading data:', error);
                document.getElementById('content').innerHTML = \`
                    <div class="empty-state">
                        <i class="material-icons">error_outline</i>
                        <h3>Error loading appointments</h3>
                        <p>Please try again later</p>
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
                        <h3>No appointments yet</h3>
                        <p>Book your first appointment to get started!</p>
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
                html += '<h2 style="margin-bottom: 15px; font-size: 20px;">Upcoming Appointments</h2>';
                upcoming.forEach(apt => {
                    html += renderAppointmentCard(apt, true);
                });
            }
            
            if (past.length > 0) {
                html += '<h2 style="margin-top: 30px; margin-bottom: 15px; font-size: 20px;">Past Appointments</h2>';
                past.forEach(apt => {
                    html += renderAppointmentCard(apt, false);
                });
            }
            
            content.innerHTML = html;
        }
        
        function renderAppointmentCard(apt, isUpcoming) {
            const date = new Date(apt.appointmentDate);
            const dateStr = date.toLocaleDateString('en-US', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' });
            const timeStr = date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
            
            const proceduresHtml = apt.procedures.map(proc => 
                \`<div class="procedure-item">• \${proc.procedureName} (\${proc.duration} min - $\${parseFloat(proc.price).toFixed(2)})</div>\`
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
                            <span>$\${parseFloat(apt.totalPrice).toFixed(2)}</span>
                        </div>
                        \${proceduresHtml ? \`
                            <div class="detail-row">
                                <i class="material-icons">content_cut</i>
                                <span>\${apt.procedureCount} service(s):</span>
                            </div>
                            <div class="procedures-list">
                                \${proceduresHtml}
                            </div>
                        \` : ''}
                    </div>
                    \${canCancel ? \`
                        <div class="appointment-actions">
                            <button class="action-button cancel-button" onclick="cancelAppointment(\${apt.id})">
                                Cancel Appointment
                            </button>
                        </div>
                    \` : ''}
                </div>
            \`;
        }
        
        async function cancelAppointment(id) {
            if (!confirm('Are you sure you want to cancel this appointment?')) {
                return;
            }
            
            try {
                const response = await fetch(\`/api/client/appointments/\${id}/cancel\`, {
                    method: 'PUT'
                });
                
                if (response.ok) {
                    alert('Appointment cancelled successfully');
                    loadClientData();
                } else {
                    const data = await response.json();
                    alert(data.message || 'Failed to cancel appointment');
                }
            } catch (error) {
                alert('An error occurred. Please try again.');
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

async function fetchUserNotifications(userId: number) {
  return db
    .select()
    .from(notifications)
    .where(eq(notifications.userId, userId))
    .orderBy(desc(notifications.createdAt));
}

async function markAllNotificationsRead(userId: number) {
  const now = new Date();
  const updated = await db
    .update(notifications)
    .set({
      status: 'read',
      isRead: true,
      readAt: now,
      updatedAt: now,
    })
    .where(and(eq(notifications.userId, userId), eq(notifications.isRead, false)))
    .returning({ id: notifications.id });

  return updated.length;
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Setup local authentication (admin and client)
  setupAuth(app);
  // Client auth is configured in clientAuth.ts via passport strategies

  // ========================================
  // PUBLIC BOOKING ROUTES (MUST BE FIRST!)
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

  // Notifications
  app.get('/api/notifications', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const items = await fetchUserNotifications(userId);
      res.json(items);
    } catch (error) {
      console.error('Error fetching notifications:', error);
      res.status(500).json({ message: 'Failed to fetch notifications' });
    }
  });

  app.post('/api/notifications/mark-read', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const updatedCount = await markAllNotificationsRead(userId);
      res.json({ updated: updatedCount });
    } catch (error) {
      console.error('Error marking notifications as read:', error);
      res.status(500).json({ message: 'Failed to mark notifications as read' });
    }
  });

  app.post('/api/notifications/:id/read', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const notificationId = parseInt(req.params.id, 10);

      if (Number.isNaN(notificationId)) {
        return res.status(400).json({ message: 'Invalid notification id' });
      }

      const now = new Date();
      const [updated] = await db
        .update(notifications)
        .set({
          status: 'read',
          isRead: true,
          readAt: now,
          updatedAt: now,
        })
        .where(
          and(
            eq(notifications.id, notificationId),
            eq(notifications.userId, userId),
          ),
        )
        .returning();

      if (!updated) {
        return res.status(404).json({ message: 'Notification not found' });
      }

      res.json(updated);
    } catch (error) {
      console.error('Error marking notification as read:', error);
      res.status(500).json({ message: 'Failed to update notification' });
    }
  });

  // Dashboard stats
  app.get('/api/dashboard/stats', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const stats = await storage.getDashboardStats(userId);
      res.json(stats);
    } catch (error) {
      console.error("Error fetching dashboard stats:", error);
      res.status(500).json({ message: "Failed to fetch dashboard stats" });
    }
  });

  // Client routes
  app.get('/api/clients', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const clients = await storage.getClients(userId);
      res.json(clients);
    } catch (error) {
      console.error("Error fetching clients:", error);
      res.status(500).json({ message: "Failed to fetch clients" });
    }
  });

  app.get('/api/clients/:clientId/appointments', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const clientId = parseInt(req.params.clientId);
      const appointments = await storage.getClientAppointments(userId, clientId);
      res.json(appointments);
    } catch (error) {
      console.error("Error fetching client appointments:", error);
      res.status(500).json({ message: "Failed to fetch client appointments" });
    }
  });

  app.post('/api/clients', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const clientData = insertClientSchema.parse({ ...req.body, userId });
      const client = await storage.createClient(clientData);
      res.json(client);
    } catch (error) {
      console.error("Error creating client:", error);
      res.status(500).json({ message: "Failed to create client" });
    }
  });

  app.put('/api/clients/:id', isAuthenticated, async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      const updates = insertClientSchema.partial().parse(req.body);
      const client = await storage.updateClient(id, updates);
      res.json(client);
    } catch (error) {
      console.error("Error updating client:", error);
      res.status(500).json({ message: "Failed to update client" });
    }
  });

  // Service routes
  app.get('/api/services', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const services = await storage.getServices(userId);
      res.json(services);
    } catch (error) {
      console.error("Error fetching services:", error);
      res.status(500).json({ message: "Failed to fetch services" });
    }
  });

  app.post('/api/services', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const serviceData = insertServiceSchema.parse({ ...req.body, userId });
      const service = await storage.createService(serviceData);
      res.json(service);
    } catch (error) {
      console.error("Error creating service:", error);
      res.status(500).json({ message: "Failed to create service" });
    }
  });

  // Appointment routes
  app.get('/api/appointments', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const date = req.query.date ? new Date(req.query.date as string) : undefined;
      const appointments = await storage.getAppointments(userId, date);
      res.json(appointments);
    } catch (error) {
      console.error("Error fetching appointments:", error);
      res.status(500).json({ message: "Failed to fetch appointments" });
    }
  });

  app.get('/api/appointments/all', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const appointments = await storage.getAppointments(userId);
      res.json(appointments);
    } catch (error) {
      console.error("Error fetching all appointments:", error);
      res.status(500).json({ message: "Failed to fetch appointments" });
    }
  });

  app.get('/api/appointments/:date', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      // Parse date string (YYYY-MM-DD) and create date in local timezone
      const dateStr = req.params.date;
      const [year, month, day] = dateStr.split('-').map(Number);
      const date = new Date(year, month - 1, day); // month is 0-indexed
      console.log(`📅 API: Fetching appointments for date: ${dateStr} -> ${date.toISOString()}`);
      const appointments = await storage.getAppointments(userId, date);
      console.log(`📅 API: Found ${appointments.length} appointments for ${dateStr}`);
      res.json(appointments);
    } catch (error) {
      console.error("Error fetching appointments by date:", error);
      res.status(500).json({ message: "Failed to fetch appointments" });
    }
  });

  // Helper function to check appointment conflicts
  async function checkAppointmentConflict(
    userId: number,
    staffId: number | null | undefined,
    appointmentDate: Date,
    durationMinutes: number,
    excludeAppointmentId?: number
  ): Promise<{ hasConflict: boolean; conflictingAppointment?: any }> {
    try {
      const startTime = new Date(appointmentDate);
      const endTime = new Date(startTime.getTime() + durationMinutes * 60000);
      
      console.log('🔍 Checking conflict for:', {
        startTime: startTime.toISOString(),
        endTime: endTime.toISOString(),
        durationMinutes,
        staffId,
        userId
      });
      
      // Get all appointments for the user
      const appointments = await storage.getAppointments(userId);
      console.log('📅 Total appointments found:', appointments.length);
      
      // Filter appointments for same staff (or any staff if staffId is null)
      const relevantAppointments = appointments.filter((apt: any) => {
        // Skip the appointment being updated
        if (excludeAppointmentId && apt.id === excludeAppointmentId) {
          console.log('⏭️ Skipping appointment being updated:', apt.id);
          return false;
        }
        
        // Skip cancelled appointments
        if (apt.status === 'cancelled') {
          console.log('⏭️ Skipping cancelled appointment:', apt.id);
          return false;
        }
        
        // If staffId provided, only check that staff's appointments
        if (staffId && apt.staffId !== staffId) {
          console.log('⏭️ Skipping different staff appointment:', apt.id, 'staff:', apt.staffId, 'requested:', staffId);
          return false;
        }

        // Only check appointments for the same date
        const aptDate = new Date(apt.appointmentDate);
        const requestDate = new Date(appointmentDate);
        
        // Simple date comparison (same day)
        const aptDateStr = aptDate.toISOString().split('T')[0];
        const requestDateStr = requestDate.toISOString().split('T')[0];
        
        if (aptDateStr !== requestDateStr) {
          console.log('⏭️ Skipping different date appointment:', apt.id, 'aptDate:', aptDateStr, 'requestDate:', requestDateStr);
          return false;
        }
        
        return true;
      });
      
      console.log('🎯 Relevant appointments to check:', relevantAppointments.length);
      
      // Check for time overlap
      for (const apt of relevantAppointments) {
        const aptStart = new Date(apt.appointmentDate);
        const aptDuration = apt.totalDuration || apt.duration || 60;
        const aptEnd = new Date(aptStart.getTime() + aptDuration * 60000);
        
        console.log('🕐 Checking appointment:', {
          id: apt.id,
          start: aptStart.toISOString(),
          end: aptEnd.toISOString(),
          duration: aptDuration,
          status: apt.status
        });
        
        // Check if times overlap (more precise logic)
        // Two appointments conflict if one starts before the other ends
        const hasOverlap = (startTime < aptEnd && endTime > aptStart);
        
        if (hasOverlap) {
          console.log('⚠️ CONFLICT FOUND!', {
            newStart: startTime.toISOString(),
            newEnd: endTime.toISOString(),
            existingStart: aptStart.toISOString(),
            existingEnd: aptEnd.toISOString(),
            appointmentId: apt.id,
            clientName: apt.client?.name
          });
          return { hasConflict: true, conflictingAppointment: apt };
        }
      }
      
      console.log('✅ No conflicts found');
      return { hasConflict: false };
    } catch (error) {
      console.error('❌ Error in checkAppointmentConflict:', error);
      return { hasConflict: false }; // Allow on error to not block user
    }
  }

  // Check availability endpoint
  app.post('/api/appointments/check-availability', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const { appointmentDate, duration, staffId } = req.body;
      
      console.log('📅 Checking availability:', { appointmentDate, duration, staffId, userId });
      
      if (!appointmentDate || !duration) {
        console.log('❌ Missing required fields');
        return res.status(400).json({ message: 'appointmentDate and duration are required' });
      }
      
      const conflict = await checkAppointmentConflict(
        userId,
        staffId ? parseInt(staffId) : null,
        new Date(appointmentDate),
        parseInt(duration)
      );
      
      console.log('🔍 Conflict check result:', conflict);
      
      if (conflict.hasConflict) {
        console.log('⚠️ Conflict found!');
        return res.json({
          available: false,
          conflictingAppointment: {
            id: conflict.conflictingAppointment.id,
            clientName: conflict.conflictingAppointment.client?.name,
            time: conflict.conflictingAppointment.appointmentDate,
            duration: conflict.conflictingAppointment.totalDuration || conflict.conflictingAppointment.duration
          }
        });
      }
      
      console.log('✅ No conflict - available!');
      res.json({ available: true });
    } catch (error) {
      console.error("❌ Error checking availability:", error);
      res.status(500).json({ message: "Failed to check availability" });
    }
  });

  app.post('/api/appointments', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      
      // Validate image data if present
      const { beforeImages = [], afterImages = [], ...restData } = req.body;
      
      // Validate image arrays
      const validateImages = (images: any[], type: string) => {
        if (!Array.isArray(images)) {
          throw new Error(`${type} must be an array`);
        }
        return images.filter(img => typeof img === 'string' && img.startsWith('data:image/'));
      };
      
      const validBeforeImages = validateImages(beforeImages, 'beforeImages');
      const validAfterImages = validateImages(afterImages, 'afterImages');
      
      // Convert appointmentDate string to Date object
      const appointmentDate = restData.appointmentDate ? new Date(restData.appointmentDate) : undefined;
      
      // Check for appointment conflicts
      if (appointmentDate) {
        const duration = restData.duration || 60;
        const conflict = await checkAppointmentConflict(
          userId,
          restData.staffId ? parseInt(restData.staffId) : null,
          appointmentDate,
          duration
        );
        
        if (conflict.hasConflict) {
          return res.status(409).json({
            message: 'Time slot not available',
            conflictingAppointment: {
              clientName: conflict.conflictingAppointment.client?.name,
              time: conflict.conflictingAppointment.appointmentDate
            }
          });
        }
      }
      
      // Calculate total amount based on service/procedure price
      let totalAmount = 0;
      if (restData.serviceType === 'procedure') {
        const procedure = await procedureStorage.getProcedure(restData.serviceId, userId);
        totalAmount = parseFloat(procedure?.price || '0');
      } else {
        const services = await storage.getServices(userId);
        const selectedService = services.find(s => s.id === restData.serviceId);
        totalAmount = parseFloat(selectedService?.price || '0');
      }
      
      const appointmentData = insertAppointmentSchema.parse({ 
        ...restData, 
        appointmentDate,
        userId,
        totalAmount: totalAmount.toString(),
        paidAmount: '0',
        paymentStatus: 'pending',
        beforeImages: validBeforeImages,
        afterImages: validAfterImages
      });
      
      const appointment = await storage.createAppointment(appointmentData);
      res.json(appointment);
    } catch (error) {
      console.error("Error creating appointment:", error);
      res.status(500).json({ message: "Failed to create appointment" });
    }
  });

  app.put('/api/appointments/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const id = parseInt(req.params.id);
      const updates = insertAppointmentSchema.partial().parse(req.body);
      
      // If appointment is being marked as completed, deduct materials from inventory
      if (updates.status === 'completed') {
        const appointments = await storage.getAppointments(userId);
        const appointment = appointments.find(a => a.id === id);
        
        if (appointment && appointment.service && appointment.service.name) {
          const procedures = await procedureStorage.getProcedures(userId);
          const matchingProcedure = procedures.find(p => 
            p.name.toLowerCase() === appointment.service.name.toLowerCase()
          );
          
          if (matchingProcedure) {
            await procedureStorage.deductMaterialsForProcedure(matchingProcedure.id, userId);
          }
        }
      }
      
      const appointment = await storage.updateAppointment(id, updates);
      res.json(appointment);
    } catch (error) {
      console.error("Error updating appointment:", error);
      res.status(500).json({ message: "Failed to update appointment" });
    }
  });

  // New route for multiple procedures appointments
  app.post('/api/appointments/with-procedures', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const { procedureIds, clientId, appointmentDate, staffId, notes, status = 'pending' } = req.body;

      if (!Array.isArray(procedureIds) || procedureIds.length === 0) {
        return res.status(400).json({ message: 'procedureIds must be a non-empty array' });
      }

      if (!clientId || !appointmentDate) {
        return res.status(400).json({ message: 'clientId and appointmentDate are required' });
      }

      // Calculate total duration from procedures and check for conflicts
      const procedures = await procedureStorage.getProcedures(userId);
      const selectedProcedures = procedures.filter((p: any) => procedureIds.includes(p.id));
      const totalDuration = selectedProcedures.reduce((sum: number, p: any) => sum + (p.duration || 60), 0);
      
      // Check for appointment conflicts
      const conflict = await checkAppointmentConflict(
        userId,
        staffId ? parseInt(staffId) : null,
        new Date(appointmentDate),
        totalDuration
      );
      
      if (conflict.hasConflict) {
        return res.status(409).json({
          message: 'Time slot not available',
          conflictingAppointment: {
            clientName: conflict.conflictingAppointment.client?.name,
            time: conflict.conflictingAppointment.appointmentDate
          }
        });
      }

      const appointmentData = {
        userId,
        clientId: parseInt(clientId),
        appointmentDate: new Date(appointmentDate),
        staffId: staffId ? parseInt(staffId) : undefined,
        status,
        notes: notes || '',
        paidAmount: '0',
        paymentStatus: 'pending' as const,
        beforeImages: [],
        afterImages: [],
      };

      const result = await storage.createAppointmentWithProcedures(
        appointmentData,
        procedureIds.map((id: any) => parseInt(id)),
        userId
      );

      // Automatically deduct materials from inventory
      await storage.deductMaterialsForAppointment(result.appointment.id, userId);

      res.json(result);
    } catch (error) {
      console.error("Error creating appointment with procedures:", error);
      res.status(500).json({ message: "Failed to create appointment with procedures" });
    }
  });

  // Get appointment with all procedures
  app.get('/api/appointments/:id/with-procedures', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const appointmentId = parseInt(req.params.id);

      const result = await storage.getAppointmentWithProcedures(appointmentId, userId);

      if (!result) {
        return res.status(404).json({ message: 'Appointment not found' });
      }

      res.json(result);
    } catch (error) {
      console.error("Error fetching appointment with procedures:", error);
      res.status(500).json({ message: "Failed to fetch appointment" });
    }
  });

  // Record payment for appointment
  app.post('/api/appointments/:id/payment', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const appointmentId = parseInt(req.params.id);
      const { amount, fullPayment } = req.body;
      
      // Get the appointment
      const appointments = await storage.getAppointments(userId);
      const appointment = appointments.find(a => a.id === appointmentId);
      
      if (!appointment) {
        return res.status(404).json({ message: 'Appointment not found' });
      }
      
      const totalAmount = parseFloat(appointment.totalAmount || '0');
      const currentPaid = parseFloat(appointment.paidAmount || '0');
      
      // Check if appointment is already fully paid
      if (currentPaid >= totalAmount && totalAmount > 0) {
        return res.status(400).json({ 
          message: 'Appointment is already fully paid',
          currentPaid,
          totalAmount 
        });
      }
      
      const paymentAmount = fullPayment ? (totalAmount - currentPaid) : parseFloat(amount);
      
      // Validate payment amount
      if (paymentAmount <= 0) {
        return res.status(400).json({ message: 'Payment amount must be greater than zero' });
      }
      
      // Check if payment exceeds outstanding balance
      const outstandingBalance = totalAmount - currentPaid;
      if (paymentAmount > outstandingBalance) {
        return res.status(400).json({ 
          message: `Payment amount (${paymentAmount}) exceeds outstanding balance (${outstandingBalance})`,
          outstandingBalance,
          paymentAmount 
        });
      }
      
      const newPaidAmount = currentPaid + paymentAmount;
      
      // Update appointment payment status
      let paymentStatus = 'partial';
      if (newPaidAmount >= totalAmount) {
        paymentStatus = 'paid';
      }
      
      // Update appointment
      const updatedAppointment = await storage.updateAppointment(appointmentId, {
        paidAmount: newPaidAmount.toString(),
        paymentStatus,
      });
      
      // Create financial transaction
      const serviceDescription = appointment.allProcedures && appointment.allProcedures.length > 0
        ? appointment.allProcedures.map((p: any) => p.name).join(', ')
        : appointment.service.name;
      
      await storage.createTransaction({
        userId,
        clientId: appointment.clientId,
        appointmentId,
        type: 'income',
        description: `Payment for ${serviceDescription} - ${appointment.client.name}`,
        amount: paymentAmount.toString(),
        transactionDate: new Date().toISOString().split('T')[0],
        category: 'Service Payment',
        isPaid: true,
      });
      
      res.json(updatedAppointment);
    } catch (error) {
      console.error('Error recording payment:', error);
      res.status(500).json({ message: 'Failed to record payment' });
    }
  });

  // Clinical records routes
  app.get('/api/clinical-records', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const clientId = req.query.clientId ? parseInt(req.query.clientId as string) : undefined;
      const records = await storage.getClinicalRecords(userId, clientId);
      res.json(records);
    } catch (error) {
      console.error("Error fetching clinical records:", error);
      res.status(500).json({ message: "Failed to fetch clinical records" });
    }
  });

  app.post('/api/clinical-records', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const recordData = insertClinicalRecordSchema.parse({ ...req.body, userId });
      const record = await storage.createClinicalRecord(recordData);
      res.json(record);
    } catch (error) {
      console.error("Error creating clinical record:", error);
      res.status(500).json({ message: "Failed to create clinical record" });
    }
  });

  // Transaction routes
  app.get('/api/transactions', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const startDate = req.query.startDate ? new Date(req.query.startDate as string) : undefined;
      const endDate = req.query.endDate ? new Date(req.query.endDate as string) : undefined;
      const transactions = await storage.getTransactions(userId, startDate, endDate);
      res.json(transactions);
    } catch (error) {
      console.error("Error fetching transactions:", error);
      res.status(500).json({ message: "Failed to fetch transactions" });
    }
  });

  app.post('/api/transactions', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const transactionData = insertTransactionSchema.parse({ ...req.body, userId });
      const transaction = await storage.createTransaction(transactionData);
      res.json(transaction);
    } catch (error) {
      console.error("Error creating transaction:", error);
      res.status(500).json({ message: "Failed to create transaction" });
    }
  });

  // Message routes
  app.get('/api/messages', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const messages = await storage.getMessages(userId);
      res.json(messages);
    } catch (error) {
      console.error("Error fetching messages:", error);
      res.status(500).json({ message: "Failed to fetch messages" });
    }
  });

  app.post('/api/messages', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const messageData = insertMessageSchema.parse({ ...req.body, userId });
      const message = await storage.createMessage(messageData);
      res.json(message);
    } catch (error) {
      console.error("Error creating message:", error);
      res.status(500).json({ message: "Failed to create message" });
    }
  });

  // Feedback routes
  app.get('/api/feedback', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const feedback = await storage.getFeedback(userId);
      res.json(feedback);
    } catch (error) {
      console.error("Error fetching feedback:", error);
      res.status(500).json({ message: "Failed to fetch feedback" });
    }
  });

  app.post('/api/feedback', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const feedbackData = insertFeedbackSchema.parse({ ...req.body, userId });
      const feedback = await storage.createFeedback(feedbackData);
      res.json(feedback);
    } catch (error) {
      console.error("Error creating feedback:", error);
      res.status(500).json({ message: "Failed to create feedback" });
    }
  });

  // Inventory routes
  app.get('/api/inventory', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const inventory = await storage.getInventory(userId);
      res.json(inventory);
    } catch (error) {
      console.error("Error fetching inventory:", error);
      res.status(500).json({ message: "Failed to fetch inventory" });
    }
  });

  app.post('/api/inventory', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const itemData = insertInventorySchema.parse({ ...req.body, userId });
      const item = await storage.createInventoryItem(itemData);
      res.json(item);
    } catch (error) {
      console.error("Error creating inventory item:", error);
      res.status(500).json({ message: "Failed to create inventory item" });
    }
  });

  app.put('/api/inventory/:id', isAuthenticated, async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      const updates = insertInventorySchema.partial().parse(req.body);
      const item = await storage.updateInventoryItem(id, updates);
      res.json(item);
    } catch (error) {
      console.error("Error updating inventory item:", error);
      res.status(500).json({ message: "Failed to update inventory item" });
    }
  });

  // Products routes
  app.get('/api/products', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      console.log('📦 GET /api/products - userId:', userId);
      
      const allProducts = await db
        .select()
        .from(products)
        .where(eq(products.userId, userId))
        .orderBy(desc(products.createdAt));
      
      console.log(`📦 Found ${allProducts.length} products for userId ${userId}`);
      if (allProducts.length > 0) {
        console.log('📦 First product:', allProducts[0]);
      }
      
      res.json(allProducts);
    } catch (error: any) {
      console.error("❌ Error fetching products:", error);
      console.error("Error message:", error.message);
      res.status(500).json({ message: "Failed to fetch products" });
    }
  });

  app.post('/api/products', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      console.log('📦 POST /api/products - Received data:', req.body);
      console.log('📦 userId:', userId);
      
      const productData = insertProductSchema.parse({ ...req.body, userId });
      console.log('📦 Validated productData:', productData);
      
      const [newProduct] = await db.insert(products).values(productData as any).returning();
      console.log('✅ Product inserted:', newProduct);
      
      res.json(newProduct);
    } catch (error: any) {
      console.error("❌ Error creating product:", error);
      console.error("Error details:", error.message);
      if (error.issues) {
        console.error("Validation issues:", error.issues);
      }
      res.status(500).json({ message: "Failed to create product", error: error.message });
    }
  });

  app.put('/api/products/:id', isAuthenticated, async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      const userId = req.user.id;
      const updates = updateProductSchema.parse(req.body);
      
      const [updatedProduct] = await db
        .update(products)
        .set({ ...updates, updatedAt: new Date() })
        .where(and(
          eq(products.id, id),
          eq(products.userId, userId)
        ))
        .returning();
      
      if (!updatedProduct) {
        return res.status(404).json({ message: "Product not found" });
      }
      
      res.json(updatedProduct);
    } catch (error) {
      console.error("Error updating product:", error);
      res.status(500).json({ message: "Failed to update product" });
    }
  });

  app.delete('/api/products/:id', isAuthenticated, async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      const userId = req.user.id;
      
      await db
        .delete(products)
        .where(and(
          eq(products.id, id),
          eq(products.userId, userId)
        ));
      
      res.json({ success: true, message: "Product deleted successfully" });
    } catch (error) {
      console.error("Error deleting product:", error);
      res.status(500).json({ message: "Failed to delete product" });
    }
  });

  // Loyalty package routes
  app.get('/api/loyalty-packages', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const packages = await storage.getLoyaltyPackages(userId);
      res.json(packages);
    } catch (error) {
      console.error("Error fetching loyalty packages:", error);
      res.status(500).json({ message: "Failed to fetch loyalty packages" });
    }
  });

  app.post('/api/loyalty-packages', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const packageData = insertLoyaltyPackageSchema.parse({ ...req.body, userId });
      const loyaltyPackage = await storage.createLoyaltyPackage(packageData);
      res.json(loyaltyPackage);
    } catch (error) {
      console.error("Error creating loyalty package:", error);
      res.status(500).json({ message: "Failed to create loyalty package" });
    }
  });

  app.get('/api/client-packages', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const clientPackages = await storage.getClientPackages(userId);
      res.json(clientPackages);
    } catch (error) {
      console.error("Error fetching client packages:", error);
      res.status(500).json({ message: "Failed to fetch client packages" });
    }
  });

  // Staff routes
  app.get('/api/staff', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const staff = await storage.getStaff(userId);
      res.json(staff);
    } catch (error) {
      console.error("Error fetching staff:", error);
      res.status(500).json({ message: "Failed to fetch staff" });
    }
  });

  app.post('/api/staff', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const staffData = insertStaffSchema.parse({ ...req.body, userId });
      const staff = await storage.createStaff(staffData);
      res.json(staff);
    } catch (error) {
      console.error("Error creating staff:", error);
      res.status(500).json({ message: "Failed to create staff" });
    }
  });

  app.put('/api/staff/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const staffId = parseInt(req.params.id);
      const staffData = insertStaffSchema.omit({ userId: true }).parse(req.body);
      const updatedStaff = await storage.updateStaff(staffId, userId, staffData);
      res.json(updatedStaff);
    } catch (error) {
      console.error("Error updating staff:", error);
      res.status(500).json({ message: "Failed to update staff" });
    }
  });

  app.delete('/api/staff/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const staffId = parseInt(req.params.id);
      await storage.deleteStaff(staffId, userId);
      res.json({ message: "Staff member deleted successfully" });
    } catch (error) {
      console.error("Error deleting staff:", error);
      res.status(500).json({ message: "Failed to delete staff" });
    }
  });

  // Staff schedules routes
  app.get('/api/staff-schedules', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const schedules = await storage.getStaffSchedules(userId);
      res.json(schedules);
    } catch (error) {
      console.error("Error fetching staff schedules:", error);
      res.status(500).json({ message: "Failed to fetch staff schedules" });
    }
  });

  app.post('/api/staff-schedules', isAuthenticated, async (req: any, res) => {
    try {
      const scheduleData = insertStaffScheduleSchema.parse(req.body);
      const schedule = await storage.createStaffSchedule(scheduleData);
      res.json(schedule);
    } catch (error) {
      console.error("Error creating staff schedule:", error);
      res.status(500).json({ message: "Failed to create staff schedule" });
    }
  });

  // Payslip routes
  app.get('/api/payslip', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const staffId = req.query.staffId ? parseInt(req.query.staffId as string) : undefined;
      const startDate = req.query.startDate ? new Date(req.query.startDate as string) : undefined;
      const endDate = req.query.endDate ? new Date(req.query.endDate as string) : undefined;

      const payslipData = await storage.getPayslipData(userId, staffId, startDate, endDate);
      res.json(payslipData);
    } catch (error) {
      console.error("Error fetching payslip data:", error);
      res.status(500).json({ message: "Failed to fetch payslip data" });
    }
  });

  // Marketing campaigns routes
  app.get('/api/marketing-campaigns', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const campaigns = await storage.getMarketingCampaigns(userId);
      res.json(campaigns);
    } catch (error) {
      console.error("Error fetching marketing campaigns:", error);
      res.status(500).json({ message: "Failed to fetch marketing campaigns" });
    }
  });

  app.post('/api/marketing-campaigns', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const campaignData = insertMarketingCampaignSchema.parse({ ...req.body, userId });
      const campaign = await storage.createMarketingCampaign(campaignData);
      res.json(campaign);
    } catch (error) {
      console.error("Error creating marketing campaign:", error);
      res.status(500).json({ message: "Failed to create marketing campaign" });
    }
  });



  // Analytics routes
  app.get('/api/analytics', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const dateRange = req.query.dateRange as string;
      const analytics = await storage.getAnalytics(userId, dateRange);
      res.json(analytics);
    } catch (error) {
      console.error("Error fetching analytics:", error);
      res.status(500).json({ message: "Failed to fetch analytics" });
    }
  });

  // Business hours routes
  app.get('/api/business-hours', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const hours = await storage.getBusinessHours(userId);
      res.json(hours);
    } catch (error) {
      console.error("Error fetching business hours:", error);
      res.status(500).json({ message: "Failed to fetch business hours" });
    }
  });

  app.post('/api/business-hours', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const { hours } = req.body;
      
      if (!Array.isArray(hours)) {
        return res.status(400).json({ message: "Hours must be an array" });
      }
      
      const hoursArray = hours.map((hour: any) => ({
        ...hour,
        userId,
      }));
      const savedHours = await storage.upsertBusinessHours(hoursArray);
      res.json(savedHours);
    } catch (error) {
      console.error("Error saving business hours:", error);
      res.status(500).json({ message: "Failed to save business hours" });
    }
  });

  // Object storage routes for photo upload
  app.post('/api/objects/upload', isAuthenticated, async (req, res) => {
    try {
      console.log('Getting upload URL for user:', req.user?.claims?.sub);
      const objectStorageService = new ObjectStorageService();
      const uploadURL = await objectStorageService.getObjectEntityUploadURL();
      console.log('Generated upload URL:', uploadURL);
      res.json({ uploadURL });
    } catch (error) {
      console.error('Error getting upload URL:', error);
      res.status(500).json({ message: 'Failed to get upload URL', error: error.message });
    }
  });

  app.put('/api/profile-image', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const { profileImageUrl } = req.body;
      
      if (!profileImageUrl) {
        return res.status(400).json({ message: 'Profile image URL is required' });
      }

      const objectStorageService = new ObjectStorageService();
      const objectPath = await objectStorageService.trySetObjectEntityAclPolicy(
        profileImageUrl,
        {
          owner: userId,
          visibility: "public",
        },
      );

      // Update user profile with new image URL
      await storage.updateUserProfileImage(userId, objectPath);
      
      res.json({ message: 'Profile image updated successfully', objectPath });
    } catch (error) {
      console.error('Error updating profile image:', error);
      res.status(500).json({ message: 'Failed to update profile image' });
    }
  });

  app.put('/api/hero-image', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const { heroImageUrl } = req.body;
      
      console.log('Updating hero image for user:', userId, 'with URL:', heroImageUrl);
      
      if (!heroImageUrl) {
        return res.status(400).json({ message: 'Hero image URL is required' });
      }

      const objectStorageService = new ObjectStorageService();
      const objectPath = await objectStorageService.trySetObjectEntityAclPolicy(
        heroImageUrl,
        {
          owner: userId,
          visibility: "public",
        },
      );

      console.log('Object path after ACL policy:', objectPath);

      // Update user profile with new hero image URL
      await storage.updateUserHeroImage(userId, objectPath);
      
      console.log('Hero image updated successfully in database');
      res.json({ message: 'Hero image updated successfully', objectPath });
    } catch (error) {
      console.error('Error updating hero image:', error);
      res.status(500).json({ message: 'Failed to update hero image', error: error.message });
    }
  });

  app.get("/objects/:objectPath(*)", isAuthenticated, async (req: any, res) => {
    const userId = req.user?.claims?.sub;
    const objectStorageService = new ObjectStorageService();
    try {
      const objectFile = await objectStorageService.getObjectEntityFile(
        req.path,
      );
      const canAccess = await objectStorageService.canAccessObjectEntity({
        objectFile,
        userId: userId,
        requestedPermission: "READ" as any,
      });
      if (!canAccess) {
        return res.sendStatus(401);
      }
      objectStorageService.downloadObject(objectFile, res);
    } catch (error) {
      console.error("Error checking object access:", error);
      if (error instanceof ObjectNotFoundError) {
        return res.sendStatus(404);
      }
      return res.sendStatus(500);
    }
  });

  // Public API routes for client access (no authentication required)


  app.post('/api/public/company/:publicLink/booking', async (req, res) => {
    try {
      const { publicLink } = req.params;
      const bookingData = req.body;
      
      // Get company by public link
      const company = await storage.getUserByPublicLink(publicLink);
      if (!company) {
        return res.status(404).json({ message: 'Company not found' });
      }

      // Create or find client
      let client = await db.select().from(clients)
        .where(and(
          eq(clients.email, bookingData.email),
          eq(clients.userId, company.id)
        ));

      if (client.length === 0) {
        // Create new client
        const [newClient] = await db.insert(clients).values({
          userId: company.id,
          name: bookingData.name,
          email: bookingData.email,
          phone: bookingData.phone,
          birthDate: bookingData.dateOfBirth || null,
        }).returning();
        client = [newClient];
      }

      // Create appointment request (pending status) - using procedure instead of service
      const appointmentData = {
        userId: company.id,
        clientId: client[0].id,
        serviceId: parseInt(bookingData.serviceId), // This will be procedure ID
        serviceType: 'procedure' as const, // Mark as procedure type
        appointmentDate: new Date(bookingData.preferredDate),
        startTime: bookingData.preferredTime,
        endTime: bookingData.preferredTime, // Will be calculated based on procedure duration
        status: 'pending' as const,
        notes: bookingData.notes || '',
      };

      console.log('Creating appointment with data:', appointmentData);
      const appointment = await storage.createAppointment(appointmentData);
      console.log('Appointment created:', appointment);

      res.json({ 
        message: 'Booking request submitted successfully',
        appointmentId: appointment.id 
      });
    } catch (error) {
      console.error("Error creating booking:", error);
      res.status(500).json({ message: "Failed to create booking request" });
    }
  });

  // Public company info endpoint
  app.get('/api/public/company/:publicLink', async (req, res) => {
    try {
      const { publicLink } = req.params;
      
      // Find company by public link
      const [company] = await db.select().from(users).where(eq(users.publicLink, publicLink));
      
      if (!company) {
        return res.status(404).json({ message: "Company not found" });
      }

      // Return public company information
      res.json({
        clinicName: company.clinicName,
        clinicAddress: company.clinicAddress,
        clinicPhone: company.clinicPhone,
        clinicWhatsapp: company.clinicWhatsapp,
        email: company.email,
        profileImageUrl: company.profileImageUrl,
        heroImageUrl: company.heroImageUrl,
        publicLink: company.publicLink,
        specialties: company.specialties
      });
    } catch (error) {
      console.error("Error fetching company info:", error);
      res.status(500).json({ message: "Failed to fetch company information" });
    }
  });

  // Find user by email endpoint
  app.get('/api/public/user-by-email/:email', async (req, res) => {
    try {
      const { email } = req.params;
      
      // Find user by email
      const [user] = await db.select().from(users).where(eq(users.email, email));
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Return public user information
      res.json({
        id: user.id,
        clinicName: user.clinicName,
        clinicAddress: user.clinicAddress,
        clinicPhone: user.clinicPhone,
        clinicWhatsapp: user.clinicWhatsapp,
        email: user.email,
        profileImageUrl: user.profileImageUrl,
        heroImageUrl: user.heroImageUrl,
        publicLink: user.publicLink,
        specialties: user.specialties
      });
    } catch (error) {
      console.error("Error fetching user by email:", error);
      res.status(500).json({ message: "Failed to fetch user information" });
    }
  });

  // Public procedures endpoint (replacing services for client booking)
  app.get('/api/public/procedures/:publicLink', async (req, res) => {
    try {
      const { publicLink } = req.params;
      
      // Find company by public link
      const [company] = await db.select().from(users).where(eq(users.publicLink, publicLink));
      
      if (!company) {
        return res.status(404).json({ message: "Company not found" });
      }

      // Get procedures instead of services
      const procedures = await procedureStorage.getProcedures(company.id.toString());
      res.json(procedures);
    } catch (error) {
      console.error("Error fetching procedures:", error);
      res.status(500).json({ message: "Failed to fetch procedures" });
    }
  });

  // Public business hours endpoint
  app.get('/api/public/business-hours/:publicLink', async (req, res) => {
    try {
      const { publicLink } = req.params;
      
      // Find company by public link
      const [company] = await db.select().from(users).where(eq(users.publicLink, publicLink));
      
      if (!company) {
        return res.status(404).json({ message: "Company not found" });
      }

      // Get business hours for this company
      const businessHours = await storage.getBusinessHours(company.id.toString());
      res.json(businessHours);
    } catch (error) {
      console.error("Error fetching business hours:", error);
      res.status(500).json({ message: "Failed to fetch business hours" });
    }
  });

  // Public staff endpoint (for client booking professional selection)
  app.get('/api/public/staff/:publicLink', async (req, res) => {
    try {
      const { publicLink } = req.params;
      
      // Find company by public link
      const [company] = await db.select().from(users).where(eq(users.publicLink, publicLink));
      
      if (!company) {
        return res.status(404).json({ message: "Company not found" });
      }

      // Get staff members for this company
      const staff = await storage.getStaff(company.id.toString());
      res.json(staff.map(member => ({
        id: member.id,
        name: member.name,
        specialties: Array.isArray(member.specialties) ? member.specialties : [],
        profileImage: null // Will be added later when staff upload photos
      })));
    } catch (error) {
      console.error("Error fetching staff:", error);
      res.status(500).json({ message: "Failed to fetch staff" });
    }
  });


  // Public appointment booking endpoint
  app.post('/api/public/appointments/:publicLink', async (req, res) => {
    try {
      const { publicLink } = req.params;

      const {
        name,
        phone,
        email,
        notes,
        selectedServices,
        selectedProfessional,
        selectedDate,
        selectedTime
      } = req.body;



      // Validate required fields
      if (!name || !phone || !email || !selectedServices || !selectedProfessional || !selectedDate || !selectedTime) {
        return res.status(400).json({ message: "Missing required fields" });
      }

      if (!selectedServices.length) {
        return res.status(400).json({ message: "Please select at least one service" });
      }
      
      // Find company by public link
      const [company] = await db.select().from(users).where(eq(users.publicLink, publicLink));
      
      if (!company) {
        return res.status(404).json({ message: "Company not found" });
      }

      // Create client if not exists
      let client = await db.select().from(clients).where(
        and(
          eq(clients.userId, company.id),
          eq(clients.email, email)
        )
      ).limit(1);

      if (client.length === 0) {
        const [newClient] = await db.insert(clients).values({
          userId: company.id,
          name,
          phone,
          email
        }).returning();
        client = [newClient];
      }

      // Calculate total duration and price from selected services
      const serviceIds = selectedServices.map((id: string) => parseInt(id)).filter(id => !isNaN(id));
      
      if (serviceIds.length === 0) {
        return res.status(400).json({ message: "No valid services selected" });
      }

      const selectedProcedures = await db.select().from(procedures).where(
        and(
          eq(procedures.userId, company.id),
          inArray(procedures.id, serviceIds)
        )
      );

      if (selectedProcedures.length === 0) {
        return res.status(400).json({ message: "Selected procedures not found" });
      }

      const appointmentDateTime = new Date(`${selectedDate}T${selectedTime}:00`);
      const professionalId = parseInt(selectedProfessional);
      
      if (isNaN(professionalId)) {
        return res.status(400).json({ message: "Invalid professional selection" });
      }

      // Create appointment data
      const appointmentData = {
        userId: company.id,
        clientId: client[0].id,
        staffId: professionalId,
        appointmentDate: appointmentDateTime,
        status: 'pending' as const,
        notes: notes || ''
      };

      // Use the new multi-procedure system
      const result = await storage.createAppointmentWithProcedures(
        appointmentData,
        serviceIds,
        company.id
      );

      const appointment = result.appointment;

      // Automatically deduct materials from inventory
      await storage.deductMaterialsForAppointment(appointment.id, company.id.toString());

      res.json({ 
        success: true, 
        appointmentId: appointment.id,
        message: "Appointment request submitted successfully" 
      });
    } catch (error: any) {
      console.error("Error creating appointment:", error);
      console.error("Error details:", error.message, error.stack);
      res.status(500).json({ 
        message: "Failed to create appointment",
        error: error.message 
      });
    }
  });

  // ==============================================
  // CLIENT AUTHENTICATION ROUTES (Multi-tenant)
  // ==============================================

  // Client registration
  app.post('/api/client/register/:publicLink', async (req, res) => {
    try {
      const { publicLink } = req.params;
      const { name, email, phone, password } = req.body;

      // Validate required fields
      if (!name || !email || !password) {
        return res.status(400).json({ message: 'Name, email, and password are required' });
      }

      // Find company by public link
      const [company] = await db.select().from(users).where(eq(users.publicLink, publicLink));
      
      if (!company) {
        return res.status(404).json({ message: 'Salon not found' });
      }

      // Check if client already exists with this email for this salon
      const existingClient = await db.select().from(clients).where(
        and(
          eq(clients.email, email),
          eq(clients.userId, company.id)
        )
      ).limit(1);

      if (existingClient.length > 0) {
        if (existingClient[0].password) {
          return res.status(400).json({ message: 'An account with this email already exists. Please login.' });
        } else {
          // Client exists but no password - update with password
          const hashedPassword = hashPassword(password);
          const [updatedClient] = await db
            .update(clients)
            .set({ 
              password: hashedPassword,
              phone: phone || existingClient[0].phone,
              name: name || existingClient[0].name
            })
            .where(eq(clients.id, existingClient[0].id))
            .returning();

          return res.json({ 
            success: true,
            message: 'Account activated successfully',
            client: {
              id: updatedClient.id,
              name: updatedClient.name,
              email: updatedClient.email,
              phone: updatedClient.phone
            }
          });
        }
      }

      // Create new client with password
      const hashedPassword = hashPassword(password);
      const [newClient] = await db.insert(clients).values({
        userId: company.id,
        name,
        email,
        phone: phone || '',
        password: hashedPassword,
        isActive: true
      }).returning();

      res.json({ 
        success: true,
        message: 'Account created successfully',
        client: {
          id: newClient.id,
          name: newClient.name,
          email: newClient.email,
          phone: newClient.phone
        }
      });
    } catch (error: any) {
      console.error('Client registration error:', error);
      res.status(500).json({ 
        message: 'Failed to create account',
        error: error.message 
      });
    }
  });

  // Client login
  app.post('/api/client/login/:publicLink', async (req, res, next) => {
    try {
      const { publicLink } = req.params;
      const { email, password } = req.body;

      // Find company by public link
      const [company] = await db.select().from(users).where(eq(users.publicLink, publicLink));
      
      if (!company) {
        return res.status(404).json({ message: 'Salon not found' });
      }

      // Add salonId to req.body for passport strategy
      req.body.salonId = company.id;

      // Use passport client strategy
      passport.authenticate('client-local', (err: any, user: any, info: any) => {
        if (err) {
          console.error('Client login error:', err);
          return res.status(500).json({ message: 'Login failed' });
        }

        if (!user) {
          return res.status(401).json({ message: info?.message || 'Invalid credentials' });
        }

        req.logIn(user, (err) => {
          if (err) {
            console.error('Session error:', err);
            return res.status(500).json({ message: 'Failed to create session' });
          }

          res.json({
            success: true,
            message: 'Login successful',
            client: {
              id: user.id,
              name: user.name,
              email: user.email,
              phone: user.phone,
              salonId: user.userId
            }
          });
        });
      })(req, res, next);
    } catch (error: any) {
      console.error('Client login error:', error);
      res.status(500).json({ 
        message: 'Failed to login',
        error: error.message 
      });
    }
  });

  // Get current logged-in client
  app.get('/api/client/me', isClientAuthenticated, async (req: any, res) => {
    try {
      const client = req.user;
      res.json({
        id: client.id,
        name: client.name,
        email: client.email,
        phone: client.phone,
        salonId: client.userId,
        loyaltyPoints: client.loyaltyPoints,
        lastLogin: client.lastLogin
      });
    } catch (error) {
      console.error('Error fetching client info:', error);
      res.status(500).json({ message: 'Failed to fetch client info' });
    }
  });

  // Client logout
  app.post('/api/client/logout', (req: any, res) => {
    req.logout((err: any) => {
      if (err) {
        return res.status(500).json({ message: 'Logout failed' });
      }
      res.json({ success: true, message: 'Logged out successfully' });
    });
  });

  // Get client's appointments
  app.get('/api/client/appointments', isClientAuthenticated, async (req: any, res) => {
    try {
      const clientId = req.user.id;
      const salonId = req.user.userId;

      // Get all appointments for this client at this salon
      const clientAppointments = await db
        .select({
          id: appointments.id,
          appointmentDate: appointments.appointmentDate,
          status: appointments.status,
          notes: appointments.notes,
          totalPrice: appointments.totalPrice,
          totalDuration: appointments.totalDuration,
          procedureCount: appointments.procedureCount,
          staffId: appointments.staffId,
          createdAt: appointments.createdAt
        })
        .from(appointments)
        .where(
          and(
            eq(appointments.clientId, clientId),
            eq(appointments.userId, salonId)
          )
        )
        .orderBy(desc(appointments.appointmentDate));

      // Get staff info and procedures for each appointment
      const appointmentsWithDetails = await Promise.all(
        clientAppointments.map(async (apt) => {
          // Get staff info
          let staffInfo = null;
          if (apt.staffId) {
            const [staffMember] = await db
              .select({ id: staff.id, name: staff.name })
              .from(staff)
              .where(eq(staff.id, apt.staffId))
              .limit(1);
            staffInfo = staffMember || null;
          }

          // Get procedures
          const aptProcedures = await db
            .select({
              id: appointmentProcedures.id,
              procedureName: appointmentProcedures.procedureName,
              procedureCategory: appointmentProcedures.procedureCategory,
              price: appointmentProcedures.price,
              duration: appointmentProcedures.duration,
              order: appointmentProcedures.order
            })
            .from(appointmentProcedures)
            .where(eq(appointmentProcedures.appointmentId, apt.id))
            .orderBy(appointmentProcedures.order);

          return {
            ...apt,
            staff: staffInfo,
            procedures: aptProcedures
          };
        })
      );

      res.json(appointmentsWithDetails);
    } catch (error) {
      console.error('Error fetching client appointments:', error);
      res.status(500).json({ message: 'Failed to fetch appointments' });
    }
  });

  // Cancel appointment (client can only cancel their own)
  app.put('/api/client/appointments/:id/cancel', isClientAuthenticated, async (req: any, res) => {
    try {
      const appointmentId = parseInt(req.params.id);
      const clientId = req.user.id;
      const salonId = req.user.userId;

      // Verify appointment belongs to this client
      const [appointment] = await db
        .select()
        .from(appointments)
        .where(
          and(
            eq(appointments.id, appointmentId),
            eq(appointments.clientId, clientId),
            eq(appointments.userId, salonId)
          )
        )
        .limit(1);

      if (!appointment) {
        return res.status(404).json({ message: 'Appointment not found' });
      }

      if (appointment.status === 'cancelled' || appointment.status === 'completed') {
        return res.status(400).json({ 
          message: `Cannot cancel appointment with status: ${appointment.status}` 
        });
      }

      // Update appointment status
      const [updated] = await db
        .update(appointments)
        .set({ status: 'cancelled' })
        .where(eq(appointments.id, appointmentId))
        .returning();

      res.json({ 
        success: true,
        message: 'Appointment cancelled successfully',
        appointment: updated
      });
    } catch (error) {
      console.error('Error cancelling appointment:', error);
      res.status(500).json({ message: 'Failed to cancel appointment' });
    }
  });

  // Procedures routes
  app.get('/api/procedures', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const procedures = await procedureStorage.getProcedures(userId);
      res.json(procedures);
    } catch (error) {
      console.error("Error fetching procedures:", error);
      res.status(500).json({ message: "Failed to fetch procedures" });
    }
  });

  app.post('/api/procedures', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const procedureData = insertProcedureSchema.parse({ ...req.body, userId });
      const procedure = await procedureStorage.createProcedure(userId, procedureData);
      res.json(procedure);
    } catch (error) {
      console.error("Error creating procedure:", error);
      res.status(500).json({ message: "Failed to create procedure" });
    }
  });

  app.put('/api/procedures/:id', isAuthenticated, async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      const userId = req.user.id;
      const updates = updateProcedureSchema.parse(req.body);
      const procedure = await procedureStorage.updateProcedure(id, userId, updates);
      res.json(procedure);
    } catch (error) {
      console.error("Error updating procedure:", error);
      res.status(500).json({ message: "Failed to update procedure" });
    }
  });

  // Public booked slots endpoint for client booking
  app.get('/api/public/booked-slots/:publicLink/:date', async (req, res) => {
    try {
      const { publicLink, date } = req.params;
      
      // Find company by public link
      const [company] = await db.select().from(users).where(eq(users.publicLink, publicLink));
      
      if (!company) {
        return res.status(404).json({ message: "Company not found" });
      }

      // Get booked appointments for the selected date
      const selectedDate = new Date(date);
      const startOfDay = new Date(selectedDate);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(selectedDate);
      endOfDay.setHours(23, 59, 59, 999);

      const bookedAppointments = await db
        .select({
          appointmentDate: appointments.appointmentDate,
          duration: appointments.duration,
        })
        .from(appointments)
        .where(
          and(
            eq(appointments.userId, company.id),
            gte(appointments.appointmentDate, startOfDay),
            lte(appointments.appointmentDate, endOfDay),
            or(
              eq(appointments.status, 'confirmed'),
              eq(appointments.status, 'scheduled')
            )
          )
        );

      res.json(bookedAppointments);
    } catch (error) {
      console.error("Error fetching booked slots:", error);
      res.status(500).json({ message: "Failed to fetch booked slots" });
    }
  });

  // API endpoint to deduct materials when appointment is completed
  app.post('/api/appointments/:id/complete', isAuthenticated, async (req: any, res) => {
    try {
      const appointmentId = parseInt(req.params.id);
      const userId = req.user.id;
      const { procedureId } = req.body;

      // Update appointment status to completed
      await storage.updateAppointment(appointmentId, { status: 'completed' });

      // If procedure ID is provided, deduct materials
      if (procedureId) {
        await procedureStorage.deductMaterialsForProcedure(procedureId, userId);
      }

      res.json({ message: 'Appointment completed and materials deducted successfully' });
    } catch (error) {
      console.error("Error completing appointment:", error);
      res.status(500).json({ message: "Failed to complete appointment" });
    }
  });

  // Integrations routes
  app.get('/api/integrations', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const userIntegrations = await db
        .select()
        .from(integrations)
        .where(eq(integrations.userId, userId))
        .orderBy(desc(integrations.createdAt));
      
      res.json(userIntegrations);
    } catch (error) {
      console.error("Error fetching integrations:", error);
      res.status(500).json({ message: "Failed to fetch integrations" });
    }
  });

  app.post('/api/integrations', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const validatedData = insertIntegrationSchema.parse(req.body);
      
      const [newIntegration] = await db
        .insert(integrations)
        .values({
          ...validatedData,
          userId,
        })
        .returning();
      
      res.status(201).json(newIntegration);
    } catch (error) {
      console.error("Error creating integration:", error);
      res.status(500).json({ message: "Failed to create integration" });
    }
  });

  app.delete('/api/integrations/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const integrationId = parseInt(req.params.id);
      
      await db
        .delete(integrations)
        .where(
          and(
            eq(integrations.id, integrationId),
            eq(integrations.userId, userId)
          )
        );
      
      res.json({ message: 'Integration deleted successfully' });
    } catch (error) {
      console.error("Error deleting integration:", error);
      res.status(500).json({ message: "Failed to delete integration" });
    }
  });

  app.patch('/api/integrations/:id/test-payload', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const integrationId = parseInt(req.params.id);
      const { testPayload } = req.body;
      
      const [updated] = await db
        .update(integrations)
        .set({ testPayload })
        .where(
          and(
            eq(integrations.id, integrationId),
            eq(integrations.userId, userId)
          )
        )
        .returning();
      
      res.json(updated);
    } catch (error) {
      console.error("Error updating test payload:", error);
      res.status(500).json({ message: "Failed to update test payload" });
    }
  });

  app.post('/api/integrations/:id/test', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const integrationId = parseInt(req.params.id);
      
      const [integration] = await db
        .select()
        .from(integrations)
        .where(
          and(
            eq(integrations.id, integrationId),
            eq(integrations.userId, userId)
          )
        );

      if (!integration) {
        return res.status(404).json({ message: "Integration not found" });
      }

      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };

      // Apply authentication based on type
      if (integration.authType === 'Bearer' && integration.authData) {
        headers['Authorization'] = `Bearer ${integration.authData}`;
      } else if (integration.authType === 'Basic' && integration.username && integration.password) {
        const credentials = Buffer.from(`${integration.username}:${integration.password}`).toString('base64');
        headers['Authorization'] = `Basic ${credentials}`;
      } else if (integration.authType === 'API Key' && integration.authData) {
        headers['X-API-Key'] = integration.authData;
      } else if (integration.authData) {
        // Custom auth - try to parse as JSON for headers
        try {
          const customHeaders = JSON.parse(integration.authData);
          Object.assign(headers, customHeaders);
        } catch {
          headers['Authorization'] = integration.authData;
        }
      }

      const payload = integration.testPayload ? JSON.parse(integration.testPayload) : {};

      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 300000); // 5 minutes timeout

      const response = await fetch(integration.url, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload),
        signal: controller.signal,
      });

      clearTimeout(timeout);

      const responseText = await response.text();
      let responseData;
      try {
        responseData = JSON.parse(responseText);
      } catch {
        responseData = responseText;
      }

      res.json({
        success: true,
        status: response.status,
        statusText: response.statusText,
        data: responseData,
      });
    } catch (error: any) {
      console.error("Error testing integration:", error);
      res.status(500).json({ 
        success: false,
        message: error.message || "Failed to test integration",
        error: error.toString(),
      });
    }
  });

  // Test route for inactive clients detection (development only)
  app.post('/api/test/inactive-clients', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      console.log('[Test] Running inactive clients detection for user:', userId);
      
      await storage.populateInactiveClients(userId);
      const inactiveClients = await storage.getInactiveClients(userId);
      
      console.log('[Test] Found', inactiveClients.length, 'inactive clients');
      res.json({ 
        success: true, 
        count: inactiveClients.length,
        inactiveClients 
      });
    } catch (error) {
      console.error("Error testing inactive clients detection:", error);
      res.status(500).json({ message: "Failed to test inactive clients detection" });
    }
  });

  // Test route for appointment reminders (development only)
  app.post('/api/test/appointment-reminders', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      console.log('[Test] Running appointment reminders task for user:', userId);
      
      await storage.populateAppointmentReminders(userId);
      const reminders = await storage.getAppointmentReminders(userId, 0); // status = 0 (pending)
      
      console.log('[Test] Found', reminders.length, 'pending appointment reminders');
      res.json({ 
        success: true, 
        count: reminders.length,
        reminders 
      });
    } catch (error) {
      console.error("Error testing appointment reminders:", error);
      res.status(500).json({ message: "Failed to test appointment reminders" });
    }
  });

  // Campaign routes
  app.get('/api/campaigns', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const campaigns = await storage.getCampaigns(userId);
      res.json(campaigns);
    } catch (error) {
      console.error("Error fetching campaigns:", error);
      res.status(500).json({ message: "Failed to fetch campaigns" });
    }
  });

  app.post('/api/campaigns', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const campaignData = insertCampaignSchema.parse(req.body);
      const campaign = await storage.createCampaign(userId, campaignData);
      res.json(campaign);
    } catch (error) {
      console.error("Error creating campaign:", error);
      res.status(500).json({ message: "Failed to create campaign" });
    }
  });

  app.get('/api/campaigns/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const campaignId = parseInt(req.params.id);
      const campaign = await storage.getCampaign(campaignId, userId);
      
      if (!campaign) {
        return res.status(404).json({ message: "Campaign not found" });
      }
      
      res.json(campaign);
    } catch (error) {
      console.error("Error fetching campaign:", error);
      res.status(500).json({ message: "Failed to fetch campaign" });
    }
  });

  app.post('/api/campaigns/:id/send', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const campaignId = parseInt(req.params.id);
      
      // Verificar se a campanha pertence ao usuário
      const campaign = await storage.getCampaign(campaignId, userId);
      if (!campaign) {
        return res.status(404).json({ message: "Campaign not found" });
      }
      
      // Enviar a campanha
      await storage.sendCampaign(campaignId);
      
      res.json({ message: "Campaign sent successfully" });
    } catch (error) {
      console.error("Error sending campaign:", error);
      res.status(500).json({ message: "Failed to send campaign" });
    }
  });

  app.delete('/api/campaigns/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const campaignId = parseInt(req.params.id);
      
      // Verificar se a campanha pertence ao usuário
      const campaign = await storage.getCampaign(campaignId, userId);
      if (!campaign) {
        return res.status(404).json({ message: "Campaign not found" });
      }
      
      await storage.deleteCampaign(campaignId, userId);
      res.json({ message: "Campaign deleted successfully" });
    } catch (error) {
      console.error("Error deleting campaign:", error);
      res.status(500).json({ message: "Failed to delete campaign" });
    }
  });

  // Banner routes (only for admin)
  app.get('/api/banners', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const banners = await storage.getBanners(userId);
      res.json(banners);
    } catch (error) {
      console.error("Error fetching banners:", error);
      res.status(500).json({ message: "Failed to fetch banners" });
    }
  });

  app.get('/api/banners/active', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const banner = await storage.getActiveBanner(userId);
      res.json(banner);
    } catch (error) {
      console.error("Error fetching active banner:", error);
      res.status(500).json({ message: "Failed to fetch active banner" });
    }
  });

  app.get('/api/banners/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const bannerId = parseInt(req.params.id);
      const banners = await storage.getBanners(userId);
      const banner = banners.find(b => b.id === bannerId);
      
      if (!banner) {
        return res.status(404).json({ message: "Banner not found" });
      }
      
      res.json(banner);
    } catch (error) {
      console.error("Error fetching banner:", error);
      res.status(500).json({ message: "Failed to fetch banner" });
    }
  });

  app.post('/api/banners', isAuthenticated, async (req: any, res) => {
    try {
      // Verificar se é admin
      if (req.user.role !== 'admin') {
        return res.status(403).json({ message: "Only admins can create banners" });
      }

      const userId = req.user.id;
      const bannerData = insertBannerSchema.parse({
        ...req.body,
        userId,
      });
      const banner = await storage.createBanner(bannerData);
      res.json(banner);
    } catch (error) {
      console.error("Error creating banner:", error);
      res.status(500).json({ message: "Failed to create banner" });
    }
  });

  app.put('/api/banners/:id', isAuthenticated, async (req: any, res) => {
    try {
      // Verificar se é admin
      if (req.user.role !== 'admin') {
        return res.status(403).json({ message: "Only admins can update banners" });
      }

      const userId = req.user.id;
      const bannerId = parseInt(req.params.id);
      
      // Verificar se o banner pertence ao usuário
      const banners = await storage.getBanners(userId);
      const banner = banners.find(b => b.id === bannerId);
      
      if (!banner) {
        return res.status(404).json({ message: "Banner not found" });
      }

      const bannerData = insertBannerSchema.partial().parse(req.body);
      const updatedBanner = await storage.updateBanner(bannerId, bannerData);
      res.json(updatedBanner);
    } catch (error) {
      console.error("Error updating banner:", error);
      res.status(500).json({ message: "Failed to update banner" });
    }
  });

  app.delete('/api/banners/:id', isAuthenticated, async (req: any, res) => {
    try {
      // Verificar se é admin
      if (req.user.role !== 'admin') {
        return res.status(403).json({ message: "Only admins can delete banners" });
      }

      const userId = req.user.id;
      const bannerId = parseInt(req.params.id);
      
      // Verificar se o banner pertence ao usuário
      const banners = await storage.getBanners(userId);
      const banner = banners.find(b => b.id === bannerId);
      
      if (!banner) {
        return res.status(404).json({ message: "Banner not found" });
      }
      
      await storage.deleteBanner(bannerId);
      res.json({ message: "Banner deleted successfully" });
    } catch (error) {
      console.error("Error deleting banner:", error);
      res.status(500).json({ message: "Failed to delete banner" });
    }
  });

  // Public route for login banner (no authentication required)
  app.get('/api/public/login-banner', async (req, res) => {
    try {
      const banner = await storage.getPublicLoginBanner();
      res.json(banner);
    } catch (error) {
      console.error("Error fetching public login banner:", error);
      res.status(500).json({ message: "Failed to fetch login banner" });
    }
  });

  // Package routes
  app.get('/api/packages', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const packagesList = await storage.getPackages(userId);
      res.json(packagesList);
    } catch (error) {
      console.error("Error fetching packages:", error);
      res.status(500).json({ message: "Failed to fetch packages" });
    }
  });

  app.get('/api/packages/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const packageId = parseInt(req.params.id);
      const packageData = await storage.getPackage(packageId, userId);
      
      if (!packageData) {
        return res.status(404).json({ message: "Package not found" });
      }
      
      res.json(packageData);
    } catch (error) {
      console.error("Error fetching package:", error);
      res.status(500).json({ message: "Failed to fetch package" });
    }
  });

  app.post('/api/packages', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const packageData = insertPackageSchema.parse({
        ...req.body,
        userId,
      });
      const newPackage = await storage.createPackage(packageData);
      res.json(newPackage);
    } catch (error: any) {
      console.error("Error creating package:", error);
      res.status(500).json({ message: error.message || "Failed to create package" });
    }
  });

  app.put('/api/packages/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const packageId = parseInt(req.params.id);
      
      // Verify package belongs to user
      const existingPackage = await storage.getPackage(packageId, userId);
      if (!existingPackage) {
        return res.status(404).json({ message: "Package not found" });
      }

      const packageData = insertPackageSchema.partial().parse(req.body);
      const updatedPackage = await storage.updatePackage(packageId, packageData);
      res.json(updatedPackage);
    } catch (error: any) {
      console.error("Error updating package:", error);
      res.status(500).json({ message: error.message || "Failed to update package" });
    }
  });

  app.delete('/api/packages/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const packageId = parseInt(req.params.id);
      
      // Verify package belongs to user
      const existingPackage = await storage.getPackage(packageId, userId);
      if (!existingPackage) {
        return res.status(404).json({ message: "Package not found" });
      }
      
      await storage.deletePackage(packageId);
      res.json({ message: "Package deleted successfully" });
    } catch (error) {
      console.error("Error deleting package:", error);
      res.status(500).json({ message: "Failed to delete package" });
    }
  });

  // Loyalty Settings routes
  app.get('/api/loyalty-settings', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const settings = await storage.getLoyaltySettings(userId);
      res.json(settings);
    } catch (error) {
      console.error("Error fetching loyalty settings:", error);
      res.status(500).json({ message: "Failed to fetch loyalty settings" });
    }
  });

  app.post('/api/loyalty-settings', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const settingsData = insertLoyaltySettingsSchema.parse(req.body);
      const settings = await storage.upsertLoyaltySettings(userId, settingsData);
      res.json(settings);
    } catch (error: any) {
      console.error("Error saving loyalty settings:", error);
      res.status(500).json({ message: error.message || "Failed to save loyalty settings" });
    }
  });

  app.put('/api/loyalty-settings', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const settingsData = insertLoyaltySettingsSchema.partial().parse(req.body);
      const settings = await storage.upsertLoyaltySettings(userId, settingsData);
      res.json(settings);
    } catch (error: any) {
      console.error("Error updating loyalty settings:", error);
      res.status(500).json({ message: error.message || "Failed to update loyalty settings" });
    }
  });

  // Calculate loyalty points for a client
  app.get('/api/loyalty-points/:clientId', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const clientId = parseInt(req.params.clientId);
      const points = await storage.calculateClientLoyaltyPoints(clientId, userId);
      res.json({ points });
    } catch (error) {
      console.error("Error calculating loyalty points:", error);
      res.status(500).json({ message: "Failed to calculate loyalty points" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
