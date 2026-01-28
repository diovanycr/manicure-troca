// Utilities Module
class Utils {
  // Calculate next exchange date (28 days from start date or last exchange)
  static calculateNextExchangeDate(startDate) {
    const date = new Date(startDate);
    date.setDate(date.getDate() + 28);
    return date.getTime();
  }

  // Calculate days until exchange
  static calculateDaysUntilExchange(nextExchangeDate) {
    const now = new Date();
    const exchangeDate = new Date(nextExchangeDate);
    const diffTime = exchangeDate - now;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  }

  // Check if exchange is due soon (within 2 days)
  static isDueSoon(nextExchangeDate) {
    const daysUntil = this.calculateDaysUntilExchange(nextExchangeDate);
    return daysUntil <= 2;
  }

  // Format date to Brazilian format (DD/MM/YYYY)
  static formatDate(timestamp) {
    if (!timestamp) return 'N/A';
    const date = new Date(timestamp);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  }

  // Format date and time
  static formatDateTime(timestamp) {
    if (!timestamp) return 'N/A';
    const date = new Date(timestamp);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${day}/${month}/${year} às ${hours}:${minutes}`;
  }

  // Get alerts for manicures due soon
  static getAlerts(manicures) {
    return manicures
      .filter(m => m.status === 'active' && this.isDueSoon(m.nextExchangeDate))
      .sort((a, b) => a.nextExchangeDate - b.nextExchangeDate);
  }

  // Get overdue alerts
  static getOverdueAlerts(manicures) {
    return manicures
      .filter(m => m.status === 'active' && this.calculateDaysUntilExchange(m.nextExchangeDate) <= 0)
      .sort((a, b) => a.nextExchangeDate - b.nextExchangeDate);
  }

  // Get upcoming alerts (1-2 days)
  static getUpcomingAlerts(manicures) {
    return manicures
      .filter(m => {
        const days = this.calculateDaysUntilExchange(m.nextExchangeDate);
        return m.status === 'active' && days > 0 && days <= 2;
      })
      .sort((a, b) => a.nextExchangeDate - b.nextExchangeDate);
  }

  // Validate email
  static isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  // Validate phone
  static isValidPhone(phone) {
    const phoneRegex = /^\(\d{2}\)\s\d{4,5}-\d{4}$/;
    return phoneRegex.test(phone);
  }

  // Format phone input
  static formatPhoneInput(value) {
    const cleaned = value.replace(/\D/g, '');
    if (cleaned.length <= 2) {
      return cleaned;
    } else if (cleaned.length <= 6) {
      return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2)}`;
    } else {
      return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2, 7)}-${cleaned.slice(7, 11)}`;
    }
  }

  // Show toast notification
  static showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;
    document.body.appendChild(toast);

    setTimeout(() => {
      toast.classList.add('show');
    }, 10);

    setTimeout(() => {
      toast.classList.remove('show');
      setTimeout(() => {
        toast.remove();
      }, 300);
    }, 3000);
  }

  // Show loading spinner
  static showLoading() {
    const loader = document.getElementById('loading-spinner');
    if (loader) loader.style.display = 'flex';
  }

  // Hide loading spinner
  static hideLoading() {
    const loader = document.getElementById('loading-spinner');
    if (loader) loader.style.display = 'none';
  }

  // Debounce function
  static debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  }

  // Get plan display name
  static getPlanName(planType) {
    const plans = {
      '12': 'Plano 12',
      '15': 'Plano 15',
      '18': 'Plano 18'
    };
    return plans[planType] || planType;
  }
}
