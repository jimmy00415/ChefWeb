/**
 * Booking Funnel State Management & Logic
 * Handles multi-step form navigation, real-time price calculation,
 * and validation with sessionStorage persistence
 */

// ==================== STATE MANAGEMENT ====================

const BookingState = {
    currentStep: 1,
    maxStepReached: 1, // Track furthest step user has reached
    formData: {
        // Step 1
        serviceState: '',
        city: '',
        eventDate: '',
        eventTime: '',
        travelFeeStatus: 'tbd', // 'included' | 'estimated' | 'tbd'
        travelFeeAmount: 0,
        
        // Step 2
        numAdults: 10,
        numChildren: 0,
        
        // Step 3 (to be implemented)
        package: 'signature', // 'essential' | 'signature' | 'premium'
        packagePrice: 75,
        
        // Step 4 (to be implemented)
        addons: [],
        addonsTotal: 0,
        
        // Step 5-6 (to be implemented)
        address: '',
        addressLine2: '',
        zipCode: '',
        venueType: '',
        setupRequirements: [],
        specialRequests: '',
        dietaryRestrictions: '',
        allergies: '',
        hasAllergies: false,
        contactName: '',
        contactEmail: '',
        contactPhone: '',
        agreeToTerms: false,
        marketingConsent: false,

        // Step 7
        paymentOption: 'deposit'
    },
    
    // Calculated fields
    get basePrice() {
        const packageData = PackagePricing[this.formData.package];
        if (!packageData) return 0;
        const adults = parseInt(this.formData.numAdults) || 0;
        const children = parseInt(this.formData.numChildren) || 0;
        const adultPrice = adults * packageData.price;
        const childPrice = children * packageData.childPrice;
        return adultPrice + childPrice;
    },
    
    get subtotal() {
        return this.basePrice + this.formData.addonsTotal;
    },
    
    get total() {
        const travel = this.formData.travelFeeStatus === 'included' ? 0 : this.formData.travelFeeAmount;
        return this.subtotal + travel;
    },
    
    get meetsMinimumSpend() {
        return this.subtotal >= 500;
    },
    
    get totalGuests() {
        const adults = parseInt(this.formData.numAdults) || 0;
        const children = parseInt(this.formData.numChildren) || 0;
        return adults + children;
    },
    
    // Save to sessionStorage
    save() {
        sessionStorage.setItem('bookingState', JSON.stringify({
            currentStep: this.currentStep,
            maxStepReached: this.maxStepReached,
            formData: this.formData
        }));
    },
    
    // Load from sessionStorage
    load() {
        const saved = sessionStorage.getItem('bookingState');
        if (saved) {
            const parsed = JSON.parse(saved);
            this.currentStep = parsed.currentStep || 1;
            this.maxStepReached = parsed.maxStepReached || 1;
            this.formData = { ...this.formData, ...parsed.formData };
        }
    },
    
    // Clear all data
    clear() {
        sessionStorage.removeItem('bookingState');
        this.currentStep = 1;
        this.maxStepReached = 1;
        this.formData = {
            serviceState: '',
            city: '',
            eventDate: '',
            eventTime: '',
            travelFeeStatus: 'tbd',
            travelFeeAmount: 0,
            numAdults: 10,
            numChildren: 0,
            package: 'signature',
            packagePrice: 75,
            addons: [],
            addonsTotal: 0,
            address: '',
            addressLine2: '',
            zipCode: '',
            venueType: '',
            setupRequirements: [],
            specialRequests: '',
            dietaryRestrictions: '',
            allergies: '',
            hasAllergies: false,
            contactName: '',
            contactEmail: '',
            contactPhone: '',
            agreeToTerms: false,
            marketingConsent: false,
            paymentOption: 'deposit'
        };
    }
};

// ==================== TRAVEL FEE DATA ====================

const TravelFeeRules = {
    'CA': { status: 'included', amount: 0, note: 'Travel fee included for California' },
    'NY': { status: 'included', amount: 0, note: 'Travel fee included for New York' },
    'TX': { status: 'estimated', amount: 50, note: 'Estimated $50 travel fee' },
    'FL': { status: 'estimated', amount: 75, note: 'Estimated $75 travel fee' },
    'IL': { status: 'estimated', amount: 100, note: 'Estimated $100 travel fee' },
    'PA': { status: 'estimated', amount: 75, note: 'Estimated $75 travel fee' },
    'OH': { status: 'estimated', amount: 100, note: 'Estimated $100 travel fee' },
    'GA': { status: 'estimated', amount: 100, note: 'Estimated $100 travel fee' },
    'NC': { status: 'estimated', amount: 125, note: 'Estimated $125 travel fee' },
    'MI': { status: 'estimated', amount: 125, note: 'Estimated $125 travel fee' }
};

// ==================== PACKAGE PRICING ====================

const PackagePricing = {
    essential: { price: 65, childPrice: 43 },
    signature: { price: 75, childPrice: 50 },
    premium: { price: 95, childPrice: 63 }
};

// ==================== STRIPE STATE ====================

const stripeState = {
    stripe: null,
    elements: null,
    card: null,
    ready: false,
    cardComplete: false
};

// ==================== INITIALIZATION ====================

document.addEventListener('DOMContentLoaded', () => {
    // Load saved state
    BookingState.load();
    
    // Check for URL parameters (e.g., ?package=essential, ?state=CA&city=Los Angeles)
    const urlParams = new URLSearchParams(window.location.search);
    
    // Handle package pre-selection
    const packageParam = urlParams.get('package');
    if (packageParam && ['essential', 'signature', 'premium'].includes(packageParam)) {
        BookingState.formData.package = packageParam;
        BookingState.formData.packagePrice = PackagePricing[packageParam].price;
    }
    
    // Handle state pre-selection (from service areas page)
    const stateParam = urlParams.get('state');
    if (stateParam) {
        BookingState.formData.serviceState = stateParam;
    }
    
    // Handle city pre-fill
    const cityParam = urlParams.get('city');
    if (cityParam) {
        BookingState.formData.city = decodeURIComponent(cityParam);
    }
    
    // Pre-fill from home quick booking if available (lower priority than URL params)
    const quickBooking = sessionStorage.getItem('quickBookingData');
    if (quickBooking) {
        const quick = JSON.parse(quickBooking);
        if (quick.serviceState && !stateParam) BookingState.formData.serviceState = quick.serviceState;
        if (quick.eventDate) BookingState.formData.eventDate = quick.eventDate;
        if (quick.numAdults) BookingState.formData.numAdults = parseInt(quick.numAdults);
        if (quick.numChildren) BookingState.formData.numChildren = parseInt(quick.numChildren) || 0;
    }
    
    // Initialize form with saved data
    populateFormFields();
    
    // Set minimum date (3 days from today)
    const eventDateInput = document.getElementById('eventDate');
    if (eventDateInput) {
        const minDate = new Date();
        minDate.setDate(minDate.getDate() + 3);
        eventDateInput.min = minDate.toISOString().split('T')[0];
    }
    
    // Show correct step
    showStep(BookingState.currentStep);
    
    // Attach event listeners
    attachStepNavigationListeners();
    attachStep1Listeners();
    attachStep2Listeners();
    attachStep3Listeners();
    attachStep4Listeners();
    attachStep5Listeners();
    attachStep6Listeners();
    attachStep7Listeners();
    attachFormSubmitHandler();
    
    // Initialize price summary
    updatePriceSummary();
    updatePaymentSummary();
    
    // Mobile price summary toggle
    initMobilePriceSummary();

    // Initialize Stripe Elements
    initStripeElements();
});

// ==================== FORM POPULATION ====================

function populateFormFields() {
    const fields = {
        'serviceState': BookingState.formData.serviceState,
        'city': BookingState.formData.city,
        'eventDate': BookingState.formData.eventDate,
        'eventTime': BookingState.formData.eventTime,
        'numAdults': BookingState.formData.numAdults,
        'numChildren': BookingState.formData.numChildren
    };
    
    Object.entries(fields).forEach(([id, value]) => {
        const input = document.getElementById(id);
        if (input && value) {
            input.value = value;
        }
    });
}

// ==================== STEP NAVIGATION ====================

function showStep(stepNumber) {
    // Hide all steps
    document.querySelectorAll('.booking-step').forEach(step => {
        step.classList.remove('booking-step--active');
    });
    
    // Show target step
    const targetStep = document.querySelector(`.booking-step[data-step="${stepNumber}"]`);
    if (targetStep) {
        targetStep.classList.add('booking-step--active');
    }
    
    // Update stepper
    updateStepper(stepNumber);
    
    // Update state
    BookingState.currentStep = stepNumber;
    if (stepNumber > BookingState.maxStepReached) {
        BookingState.maxStepReached = stepNumber;
    }
    BookingState.save();
    
    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function updateStepper(currentStep) {
    document.querySelectorAll('.stepper__step').forEach(step => {
        const stepNum = parseInt(step.dataset.step);
        
        // Remove all state classes
        step.classList.remove('stepper__step--active', 'stepper__step--completed');
        
        // Add appropriate class
        if (stepNum < currentStep) {
            step.classList.add('stepper__step--completed');
        } else if (stepNum === currentStep) {
            step.classList.add('stepper__step--active');
        }
    });
}

function attachStepNavigationListeners() {
    // Next buttons
    document.querySelectorAll('.booking-nav__next').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            const nextStep = parseInt(btn.dataset.nextStep);
            const currentStep = BookingState.currentStep;
            
            // Validate current step before proceeding
            if (validateStep(currentStep)) {
                showStep(nextStep);
                updatePriceSummary();
            }
        });
    });
    
    // Back buttons
    document.querySelectorAll('.booking-nav__back').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            const prevStep = parseInt(btn.dataset.prevStep);
            if (prevStep) {
                showStep(prevStep);
            }
        });
    });
}

// ==================== STEP 1: LOCATION & DATE ====================

function attachStep1Listeners() {
    const stateSelect = document.getElementById('serviceState');
    const cityInput = document.getElementById('city');
    const dateInput = document.getElementById('eventDate');
    const timeSelect = document.getElementById('eventTime');
    
    if (stateSelect) {
        stateSelect.addEventListener('change', (e) => {
            BookingState.formData.serviceState = e.target.value;
            updateTravelFeeInfo(e.target.value);
            BookingState.save();
            updatePriceSummary();
        });
        
        // Trigger on load if value exists
        if (stateSelect.value) {
            updateTravelFeeInfo(stateSelect.value);
        }
    }
    
    if (cityInput) {
        cityInput.addEventListener('blur', (e) => {
            BookingState.formData.city = e.target.value;
            BookingState.save();
            updatePriceSummary();
        });
    }
    
    if (dateInput) {
        dateInput.addEventListener('change', (e) => {
            BookingState.formData.eventDate = e.target.value;
            BookingState.save();
            updatePriceSummary();
        });
    }
    
    if (timeSelect) {
        timeSelect.addEventListener('change', (e) => {
            BookingState.formData.eventTime = e.target.value;
            BookingState.save();
            updatePriceSummary();
        });
    }
}

function updateTravelFeeInfo(state) {
    const travelFeeInfo = document.getElementById('travelFeeInfo');
    const travelFeeText = document.getElementById('travelFeeText');
    
    if (!state || !TravelFeeRules[state]) {
        if (travelFeeInfo) travelFeeInfo.classList.add('hidden');
        BookingState.formData.travelFeeStatus = 'tbd';
        BookingState.formData.travelFeeAmount = 0;
        return;
    }
    
    const rule = TravelFeeRules[state];
    BookingState.formData.travelFeeStatus = rule.status;
    BookingState.formData.travelFeeAmount = rule.amount;
    
    if (travelFeeInfo) travelFeeInfo.classList.remove('hidden');
    if (travelFeeText) travelFeeText.textContent = rule.note;
}

function validateStep1() {
    let isValid = true;
    
    // Validate state
    const stateSelect = document.getElementById('serviceState');
    const stateError = document.getElementById('serviceStateError');
    if (!BookingState.formData.serviceState) {
        if (stateError) stateError.textContent = 'Please select your service state';
        if (stateSelect) stateSelect.classList.add('form-input--error');
        isValid = false;
    } else {
        if (stateError) stateError.textContent = '';
        if (stateSelect) stateSelect.classList.remove('form-input--error');
    }
    
    // Validate city
    const cityInput = document.getElementById('city');
    const cityError = document.getElementById('cityError');
    if (!BookingState.formData.city || BookingState.formData.city.length < 2) {
        if (cityError) cityError.textContent = 'Please enter your city';
        if (cityInput) cityInput.classList.add('form-input--error');
        isValid = false;
    } else {
        if (cityError) cityError.textContent = '';
        if (cityInput) cityInput.classList.remove('form-input--error');
    }
    
    // Validate date
    const dateInput = document.getElementById('eventDate');
    const dateError = document.getElementById('eventDateError');
    if (!BookingState.formData.eventDate) {
        if (dateError) dateError.textContent = 'Please select an event date';
        if (dateInput) dateInput.classList.add('form-input--error');
        isValid = false;
    } else {
        const selectedDate = new Date(BookingState.formData.eventDate);
        const minDate = new Date();
        minDate.setDate(minDate.getDate() + 3);
        
        if (selectedDate < minDate) {
            if (dateError) dateError.textContent = 'Event must be at least 3 days in advance';
            if (dateInput) dateInput.classList.add('form-input--error');
            isValid = false;
        } else {
            if (dateError) dateError.textContent = '';
            if (dateInput) dateInput.classList.remove('form-input--error');
        }
    }
    
    // Validate time
    const timeSelect = document.getElementById('eventTime');
    const timeError = document.getElementById('eventTimeError');
    if (!BookingState.formData.eventTime) {
        if (timeError) timeError.textContent = 'Please select a preferred time';
        if (timeSelect) timeSelect.classList.add('form-input--error');
        isValid = false;
    } else {
        if (timeError) timeError.textContent = '';
        if (timeSelect) timeSelect.classList.remove('form-input--error');
    }
    
    return isValid;
}

// ==================== STEP 2: PARTY SIZE ====================

function attachStep2Listeners() {
    const adultsInput = document.getElementById('numAdults');
    const childrenInput = document.getElementById('numChildren');
    const requestQuoteBtn = document.getElementById('requestQuoteBtn');
    const continueStandardBtn = document.getElementById('continueStandardBtn');
    
    if (adultsInput) {
        adultsInput.addEventListener('input', () => {
            updatePartySizePreview();
        });
        adultsInput.addEventListener('blur', () => {
            BookingState.formData.numAdults = parseInt(adultsInput.value) || 0;
            BookingState.save();
            updatePriceSummary();
        });
        
        // Initialize preview
        updatePartySizePreview();
    }
    
    if (childrenInput) {
        childrenInput.addEventListener('input', () => {
            updatePartySizePreview();
        });
        childrenInput.addEventListener('blur', () => {
            BookingState.formData.numChildren = parseInt(childrenInput.value) || 0;
            BookingState.save();
            updatePriceSummary();
        });
    }
    
    if (requestQuoteBtn) {
        requestQuoteBtn.addEventListener('click', () => {
            // Redirect to custom quote page
            window.location.href = 'contact.html?large-event=true';
        });
    }
    
    if (continueStandardBtn) {
        continueStandardBtn.addEventListener('click', () => {
            const largeEventNotice = document.getElementById('largeEventNotice');
            if (largeEventNotice) largeEventNotice.classList.add('hidden');
        });
    }
}

function updatePartySizePreview() {
    const adultsInput = document.getElementById('numAdults');
    const childrenInput = document.getElementById('numChildren');
    
    const numAdults = parseInt(adultsInput.value) || 0;
    const numChildren = parseInt(childrenInput.value) || 0;
    const totalGuests = numAdults + numChildren;
    
    // Update preview counts
    document.getElementById('previewAdults').textContent = numAdults;
    document.getElementById('previewChildren').textContent = numChildren;
    
    // Calculate pricing (using Signature package default)
    const adultTotal = numAdults * 75;
    const childTotal = numChildren * 50;
    const subtotal = adultTotal + childTotal;
    
    document.getElementById('previewAdultTotal').textContent = formatCurrency(adultTotal);
    document.getElementById('previewChildTotal').textContent = formatCurrency(childTotal);
    document.getElementById('previewSubtotal').textContent = formatCurrency(subtotal);
    
    // Check minimum spend
    const minimumSpendMessage = document.getElementById('minimumSpendMessage');
    if (subtotal < 500) {
        minimumSpendMessage.innerHTML = `
            <div class="validation-message validation-message--error">
                <span class="validation-message__icon">⚠️</span>
                <div>
                    <strong>Minimum Spend Not Met:</strong> Your current selection totals ${formatCurrency(subtotal)}. 
                    We require a minimum spend of $500 per event. Please add ${Math.ceil((500 - subtotal) / 75)} more adult(s) 
                    or select a higher-tier package.
                </div>
            </div>
        `;
        minimumSpendMessage.classList.remove('hidden');
    } else {
        minimumSpendMessage.innerHTML = `
            <div class="validation-message validation-message--success">
                <span class="validation-message__icon">✓</span>
                <div>
                    <strong>Minimum Spend Met:</strong> Your booking meets our $500 minimum.
                </div>
            </div>
        `;
        minimumSpendMessage.classList.remove('hidden');
    }
    
    // Large event notice (50+ guests)
    const largeEventNotice = document.getElementById('largeEventNotice');
    if (totalGuests >= 50) {
        largeEventNotice.classList.remove('hidden');
    } else {
        largeEventNotice.classList.add('hidden');
    }
    
    // Additional chef notice (30-49 guests)
    const additionalChefNotice = document.getElementById('additionalChefNotice');
    if (totalGuests >= 30 && totalGuests < 50) {
        additionalChefNotice.classList.remove('hidden');
    } else {
        additionalChefNotice.classList.add('hidden');
    }
}

function validateStep2() {
    let isValid = true;
    
    const adultsInput = document.getElementById('numAdults');
    const adultsError = document.getElementById('numAdultsError');
    const numAdults = parseInt(adultsInput.value) || 0;
    
    if (numAdults < 1) {
        adultsError.textContent = 'Please enter number of adults';
        adultsInput.classList.add('form-input--error');
        isValid = false;
    } else if (numAdults < 10) {
        adultsError.textContent = 'We recommend a minimum of 10 adults for optimal experience';
        adultsInput.classList.add('form-input--warning');
        // Still allow continuation with warning
    } else {
        adultsError.textContent = '';
        adultsInput.classList.remove('form-input--error', 'form-input--warning');
    }
    
    const childrenInput = document.getElementById('numChildren');
    const childrenError = document.getElementById('numChildrenError');
    const numChildren = parseInt(childrenInput.value) || 0;
    
    if (numChildren < 0) {
        childrenError.textContent = 'Number of children cannot be negative';
        childrenInput.classList.add('form-input--error');
        isValid = false;
    } else {
        childrenError.textContent = '';
        childrenInput.classList.remove('form-input--error');
    }
    
    // Check minimum spend (using current pricing estimate)
    const adultTotal = numAdults * 75;
    const childTotal = numChildren * 50;
    const subtotal = adultTotal + childTotal;
    
    if (subtotal < 500) {
        adultsError.textContent = `Minimum spend of $500 not met (current: ${formatCurrency(subtotal)}). Add more guests or select a higher-tier package in next step.`;
        adultsInput.classList.add('form-input--warning');
        // Allow continuation but show warning
    }
    
    return isValid;
}

// ==================== STEP 3: PACKAGE SELECTION ====================

function attachStep3Listeners() {
    const packageCards = document.querySelectorAll('.package-card--selectable');
    
    packageCards.forEach(card => {
        card.addEventListener('click', () => {
            const packageType = card.dataset.package;
            const radioInput = card.querySelector('.package-card__radio');
            
            // Update radio button
            if (radioInput) {
                radioInput.checked = true;
            }
            
            // Update visual selection
            packageCards.forEach(c => c.classList.remove('package-card--selected'));
            card.classList.add('package-card--selected');
            
            // Update state
            BookingState.formData.package = packageType;
            BookingState.formData.packagePrice = PackagePricing[packageType].price;
            BookingState.save();
            
            // Update price summary
            updatePriceSummary();
        });
        
        // Also handle direct radio input clicks
        const radioInput = card.querySelector('.package-card__radio');
        if (radioInput) {
            radioInput.addEventListener('change', () => {
                if (radioInput.checked) {
                    const packageType = card.dataset.package;
                    
                    packageCards.forEach(c => c.classList.remove('package-card--selected'));
                    card.classList.add('package-card--selected');
                    
                    BookingState.formData.package = packageType;
                    BookingState.formData.packagePrice = PackagePricing[packageType].price;
                    BookingState.save();
                    updatePriceSummary();
                }
            });
        }
    });
}

function validateStep3() {
    // Package is always selected (defaults to signature), so always valid
    return true;
}

// ==================== STEP 4: ADD-ONS ====================

function attachStep4Listeners() {
    const addonChips = document.querySelectorAll('.chip--addon');
    
    addonChips.forEach(chip => {
        const plusBtn = chip.querySelector('.chip__btn--plus');
        const minusBtn = chip.querySelector('.chip__btn--minus');
        const quantitySpan = chip.querySelector('.chip__quantity');
        
        const addonId = chip.dataset.addonId;
        const addonPrice = parseFloat(chip.dataset.addonPrice);
        const isPerPerson = chip.dataset.addonPerPerson === 'true';
        const addonName = chip.querySelector('.chip__name').textContent;
        
        // Initialize quantity from saved state
        const savedAddon = BookingState.formData.addons.find(a => a.id === addonId);
        if (savedAddon) {
            quantitySpan.textContent = savedAddon.quantity;
            if (savedAddon.quantity > 0) {
                chip.classList.add('chip--active');
            }
        }
        
        // Plus button
        plusBtn.addEventListener('click', () => {
            let currentQty = parseInt(quantitySpan.textContent) || 0;
            currentQty++;
            quantitySpan.textContent = currentQty;
            chip.classList.add('chip--active');
            
            updateAddonInState(addonId, addonName, addonPrice, currentQty, isPerPerson);
            updateAddonsDisplay();
            updatePriceSummary();
        });
        
        // Minus button
        minusBtn.addEventListener('click', () => {
            let currentQty = parseInt(quantitySpan.textContent) || 0;
            if (currentQty > 0) {
                currentQty--;
                quantitySpan.textContent = currentQty;
                
                if (currentQty === 0) {
                    chip.classList.remove('chip--active');
                }
                
                updateAddonInState(addonId, addonName, addonPrice, currentQty, isPerPerson);
                updateAddonsDisplay();
                updatePriceSummary();
            }
        });
    });
    
    // Initialize display
    updateAddonsDisplay();
}

function updateAddonInState(id, name, price, quantity, isPerPerson) {
    const existingIndex = BookingState.formData.addons.findIndex(a => a.id === id);
    
    if (quantity === 0) {
        // Remove addon
        if (existingIndex !== -1) {
            BookingState.formData.addons.splice(existingIndex, 1);
        }
    } else {
        // Add or update addon
        const addon = {
            id,
            name,
            price,
            quantity,
            isPerPerson
        };
        
        if (existingIndex !== -1) {
            BookingState.formData.addons[existingIndex] = addon;
        } else {
            BookingState.formData.addons.push(addon);
        }
    }
    
    // Recalculate addons total
    BookingState.formData.addonsTotal = BookingState.formData.addons.reduce((sum, addon) => {
        if (addon.isPerPerson) {
            return sum + (addon.price * addon.quantity * BookingState.totalGuests);
        } else {
            return sum + (addon.price * addon.quantity);
        }
    }, 0);
    
    BookingState.save();
}

function updateAddonsDisplay() {
    const addonsSummary = document.getElementById('addonsSummary');
    const addonsList = document.getElementById('addonsList');
    
    if (BookingState.formData.addons.length === 0) {
        addonsSummary.classList.add('hidden');
        return;
    }
    
    addonsSummary.classList.remove('hidden');
    
    // Build list
    let listHTML = '';
    BookingState.formData.addons.forEach(addon => {
        const totalPrice = addon.isPerPerson 
            ? addon.price * addon.quantity * BookingState.totalGuests
            : addon.price * addon.quantity;
        
        const qtyText = addon.quantity > 1 ? ` × ${addon.quantity}` : '';
        const perPersonText = addon.isPerPerson ? ` (${BookingState.totalGuests} guests)` : '';
        
        listHTML += `<li>${addon.name}${qtyText}${perPersonText}: ${formatCurrency(totalPrice)}</li>`;
    });
    
    addonsList.innerHTML = listHTML;
}

function validateStep4() {
    // Add-ons are optional, so always valid
    return true;
}

// ==================== STEP 5: EVENT DETAILS ====================

function attachStep5Listeners() {
    const streetAddress = document.getElementById('streetAddress');
    const addressLine2 = document.getElementById('addressLine2');
    const zipCode = document.getElementById('zipCode');
    const venueType = document.getElementById('venueType');
    const specialRequests = document.getElementById('specialRequests');
    const setupCheckboxes = document.querySelectorAll('input[name="setup[]"]');
    
    // Address fields
    if (streetAddress) {
        streetAddress.addEventListener('blur', () => {
            BookingState.formData.address = streetAddress.value;
            BookingState.save();
        });
    }
    
    if (addressLine2) {
        addressLine2.addEventListener('blur', () => {
            BookingState.formData.addressLine2 = addressLine2.value;
            BookingState.save();
        });
    }
    
    if (zipCode) {
        zipCode.addEventListener('blur', () => {
            BookingState.formData.zipCode = zipCode.value;
            BookingState.save();
        });
    }
    
    if (venueType) {
        venueType.addEventListener('change', () => {
            BookingState.formData.venueType = venueType.value;
            BookingState.save();
        });
    }
    
    if (specialRequests) {
        specialRequests.addEventListener('blur', () => {
            BookingState.formData.specialRequests = specialRequests.value;
            BookingState.save();
        });
    }
    
    // Setup checkboxes
    setupCheckboxes.forEach(checkbox => {
        checkbox.addEventListener('change', () => {
            BookingState.formData.setupRequirements = Array.from(
                document.querySelectorAll('input[name="setup[]"]:checked')
            ).map(cb => cb.value);
            BookingState.save();
        });
    });
}

function validateStep5() {
    let isValid = true;
    
    // Validate street address
    const streetAddress = document.getElementById('streetAddress');
    const streetAddressError = document.getElementById('streetAddressError');
    if (!BookingState.formData.address || BookingState.formData.address.length < 5) {
        streetAddressError.textContent = 'Please enter a valid street address';
        streetAddress.classList.add('form-input--error');
        isValid = false;
    } else {
        streetAddressError.textContent = '';
        streetAddress.classList.remove('form-input--error');
    }
    
    // Validate ZIP code
    const zipCode = document.getElementById('zipCode');
    const zipCodeError = document.getElementById('zipCodeError');
    const zipPattern = /^\d{5}(-\d{4})?$/;
    if (!BookingState.formData.zipCode || !zipPattern.test(BookingState.formData.zipCode)) {
        zipCodeError.textContent = 'Please enter a valid ZIP code (e.g., 12345 or 12345-6789)';
        zipCode.classList.add('form-input--error');
        isValid = false;
    } else {
        zipCodeError.textContent = '';
        zipCode.classList.remove('form-input--error');
    }
    
    // Validate venue type
    const venueType = document.getElementById('venueType');
    const venueTypeError = document.getElementById('venueTypeError');
    if (!BookingState.formData.venueType) {
        venueTypeError.textContent = 'Please select a venue type';
        venueType.classList.add('form-select--error');
        isValid = false;
    } else {
        venueTypeError.textContent = '';
        venueType.classList.remove('form-select--error');
    }
    
    return isValid;
}

// ==================== STEP 6: CONTACT & DIETARY ====================

function attachStep6Listeners() {
    const contactName = document.getElementById('contactName');
    const contactEmail = document.getElementById('contactEmail');
    const contactPhone = document.getElementById('contactPhone');
    const dietaryRestrictions = document.getElementById('dietaryRestrictions');
    const hasAllergies = document.getElementById('hasAllergies');
    const allergies = document.getElementById('allergies');
    const allergiesGroup = document.getElementById('allergiesGroup');
    const agreeToTerms = document.getElementById('agreeToTerms');
    const marketingConsent = document.getElementById('marketingConsent');
    
    // Contact fields
    if (contactName) {
        contactName.addEventListener('blur', () => {
            BookingState.formData.contactName = contactName.value;
            BookingState.save();
        });
    }
    
    if (contactEmail) {
        contactEmail.addEventListener('blur', () => {
            BookingState.formData.contactEmail = contactEmail.value;
            BookingState.save();
        });
    }
    
    if (contactPhone) {
        contactPhone.addEventListener('blur', () => {
            BookingState.formData.contactPhone = contactPhone.value;
            BookingState.save();
        });
    }
    
    // Dietary fields
    if (dietaryRestrictions) {
        dietaryRestrictions.addEventListener('blur', () => {
            BookingState.formData.dietaryRestrictions = dietaryRestrictions.value;
            BookingState.save();
        });
    }
    
    // Allergies toggle
    if (hasAllergies && allergiesGroup) {
        hasAllergies.addEventListener('change', () => {
            BookingState.formData.hasAllergies = hasAllergies.checked;
            if (hasAllergies.checked) {
                allergiesGroup.classList.remove('hidden');
                allergies.required = true;
            } else {
                allergiesGroup.classList.add('hidden');
                allergies.required = false;
                allergies.value = '';
                BookingState.formData.allergies = '';
            }
            BookingState.save();
        });
    }
    
    if (allergies) {
        allergies.addEventListener('blur', () => {
            BookingState.formData.allergies = allergies.value;
            BookingState.save();
        });
    }
    
    // Terms checkbox
    if (agreeToTerms) {
        agreeToTerms.addEventListener('change', () => {
            BookingState.formData.agreeToTerms = agreeToTerms.checked;
            BookingState.save();
        });
    }
    
    if (marketingConsent) {
        marketingConsent.addEventListener('change', () => {
            BookingState.formData.marketingConsent = marketingConsent.checked;
            BookingState.save();
        });
    }
}

// ==================== STEP 7: PAYMENT ====================

function attachStep7Listeners() {
    const paymentOptions = document.querySelectorAll('input[name="paymentOption"]');
    const paymentMethod = document.getElementById('paymentMethod');

    paymentOptions.forEach(option => {
        option.addEventListener('change', () => {
            BookingState.formData.paymentOption = option.value;
            syncPaymentUI();
        });
    });

    syncPaymentUI();
}

function updatePaymentSummary() {
    const total = BookingState.total || 0;
    const deposit = Math.round(total * 0.25);
    const option = BookingState.formData.paymentOption || 'deposit';
    const dueToday = option === 'full' ? total : option === 'later' ? 0 : deposit;
    const remaining = Math.max(total - dueToday, 0);

    const depositEl = document.getElementById('depositAmount');
    const fullEl = document.getElementById('fullPaymentAmount');
    const totalEl = document.getElementById('paymentTotal');
    const dueEl = document.getElementById('paymentAmountDueToday');
    const balanceEl = document.getElementById('paymentBalanceDue');

    if (depositEl) depositEl.textContent = Utils ? Utils.formatCurrency(deposit) : `$${deposit}`;
    if (fullEl) fullEl.textContent = Utils ? Utils.formatCurrency(total) : `$${total}`;
    if (totalEl) totalEl.textContent = Utils ? Utils.formatCurrency(total) : `$${total}`;
    if (dueEl) dueEl.textContent = Utils ? Utils.formatCurrency(dueToday) : `$${dueToday}`;
    if (balanceEl) balanceEl.textContent = Utils ? Utils.formatCurrency(remaining) : `$${remaining}`;
}

function syncPaymentUI() {
    const paymentOptions = document.querySelectorAll('input[name="paymentOption"]');
    const paymentMethod = document.getElementById('paymentMethod');
    const submitBtn = document.getElementById('submitBookingBtn');
    const selected = BookingState.formData.paymentOption || 'deposit';

    paymentOptions.forEach(option => {
        option.checked = option.value === selected;
        const parentCard = option.closest('.payment-option-card');
        if (parentCard) {
            parentCard.classList.toggle('payment-option-card--selected', option.value === selected);
        }
    });

    if (paymentMethod) {
        if (selected === 'later') {
            paymentMethod.classList.add('hidden');
        } else {
            paymentMethod.classList.remove('hidden');
        }
    }

    if (submitBtn) {
        if (selected === 'later') {
            submitBtn.textContent = 'Submit Booking Request →';
        } else if (selected === 'full') {
            submitBtn.textContent = 'Pay in Full →';
        } else {
            submitBtn.textContent = 'Pay Deposit →';
        }
    }

    updatePaymentSummary();
}

function validateStep6() {
    let isValid = true;
    
    // Validate contact name
    const contactName = document.getElementById('contactName');
    const contactNameError = document.getElementById('contactNameError');
    if (!BookingState.formData.contactName || BookingState.formData.contactName.length < 2) {
        contactNameError.textContent = 'Please enter your full name';
        contactName.classList.add('form-input--error');
        isValid = false;
    } else {
        contactNameError.textContent = '';
        contactName.classList.remove('form-input--error');
    }
    
    // Validate email
    const contactEmail = document.getElementById('contactEmail');
    const contactEmailError = document.getElementById('contactEmailError');
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!BookingState.formData.contactEmail || !emailPattern.test(BookingState.formData.contactEmail)) {
        contactEmailError.textContent = 'Please enter a valid email address';
        contactEmail.classList.add('form-input--error');
        isValid = false;
    } else {
        contactEmailError.textContent = '';
        contactEmail.classList.remove('form-input--error');
    }
    
    // Validate phone
    const contactPhone = document.getElementById('contactPhone');
    const contactPhoneError = document.getElementById('contactPhoneError');
    const phonePattern = /^[\d\s\-\(\)]+$/;
    if (!BookingState.formData.contactPhone || BookingState.formData.contactPhone.length < 10 || !phonePattern.test(BookingState.formData.contactPhone)) {
        contactPhoneError.textContent = 'Please enter a valid phone number';
        contactPhone.classList.add('form-input--error');
        isValid = false;
    } else {
        contactPhoneError.textContent = '';
        contactPhone.classList.remove('form-input--error');
    }
    
    // Validate allergies if checkbox is checked
    const hasAllergies = document.getElementById('hasAllergies');
    if (hasAllergies && hasAllergies.checked) {
        const allergies = document.getElementById('allergies');
        const allergiesError = document.getElementById('allergiesError');
        if (!BookingState.formData.allergies || BookingState.formData.allergies.trim().length < 3) {
            allergiesError.textContent = 'Please specify the food allergies';
            allergies.classList.add('form-textarea--error');
            isValid = false;
        } else {
            allergiesError.textContent = '';
            allergies.classList.remove('form-textarea--error');
        }
    }
    
    // Validate terms agreement
    const agreeToTerms = document.getElementById('agreeToTerms');
    const agreeToTermsError = document.getElementById('agreeToTermsError');
    if (!BookingState.formData.agreeToTerms) {
        agreeToTermsError.textContent = 'You must agree to the terms to continue';
        isValid = false;
    } else {
        agreeToTermsError.textContent = '';
    }
    
    return isValid;
}

function validateStep7() {
    const paymentOption = BookingState.formData.paymentOption;
    if (paymentOption === 'later') {
        return true;
    }

    const cardholderName = document.getElementById('cardholderName');
    const paymentError = document.getElementById('paymentError');

    if (!stripeState.ready) {
        if (paymentError) {
            paymentError.textContent = 'Payment system is temporarily unavailable. Please choose Pay Later.';
        }
        return false;
    }

    if (cardholderName && !cardholderName.value.trim()) {
        if (paymentError) {
            paymentError.textContent = 'Please enter the cardholder name.';
        }
        cardholderName.classList.add('form-input--error');
        return false;
    }

    if (!stripeState.cardComplete) {
        if (paymentError) {
            paymentError.textContent = 'Please complete your card details.';
        }
        return false;
    }

    if (paymentError) {
        paymentError.textContent = '';
    }
    if (cardholderName) {
        cardholderName.classList.remove('form-input--error');
    }

    return true;
}

// ==================== FORM SUBMISSION ====================

function attachFormSubmitHandler() {
    const bookingForm = document.getElementById('bookingForm');
    
    if (bookingForm) {
        bookingForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            // Validate final step
            if (!validateStep6() || !validateStep7()) {
                return;
            }
            
            // Show loading state
            const submitBtn = document.getElementById('submitBookingBtn');
            const originalText = submitBtn.textContent;
            submitBtn.disabled = true;
            submitBtn.textContent = 'Submitting...';
            
            try {
                const paymentOption = BookingState.formData.paymentOption || 'deposit';
                let paymentResult = null;

                if (paymentOption !== 'later') {
                    paymentResult = await processStripePayment();
                }

                // Simulate booking API call
                await new Promise(resolve => setTimeout(resolve, 800));
                
                // Generate booking reference
                const bookingRef = generateBookingReference();
                sessionStorage.setItem('bookingReference', bookingRef);
                sessionStorage.setItem('bookingComplete', 'true');
                if (paymentResult) {
                    sessionStorage.setItem('paymentIntentId', paymentResult.paymentIntentId || '');
                }
                
                // Redirect to confirmation page
                window.location.href = 'confirmation.html';
            } catch (error) {
                // Handle error
                alert('There was an error submitting your booking. Please try again or contact us directly.');
                submitBtn.disabled = false;
                submitBtn.textContent = originalText;
            }
        });
    }
}

async function initStripeElements() {
    const cardElement = document.getElementById('stripeCardElement');
    if (!cardElement) return;

    if (!window.Stripe) {
        showPaymentError('Payment system unavailable. Please choose Pay Later.');
        return;
    }

    try {
        const configResponse = await fetch('../api/config/stripe');
        if (!configResponse.ok) {
            throw new Error('Stripe config failed');
        }
        const config = await configResponse.json();
        if (!config.publishableKey) {
            throw new Error('Stripe key missing');
        }

        stripeState.stripe = window.Stripe(config.publishableKey);
        stripeState.elements = stripeState.stripe.elements({
            appearance: { theme: 'stripe' }
        });

        stripeState.card = stripeState.elements.create('card');
        stripeState.card.mount('#stripeCardElement');

        stripeState.card.on('change', (event) => {
            stripeState.cardComplete = event.complete;
            if (event.error) {
                showPaymentError(event.error.message);
            } else {
                showPaymentError('');
            }
        });

        stripeState.ready = true;
    } catch (error) {
        showPaymentError('Payment system unavailable. Please choose Pay Later.');
    }
}

async function processStripePayment() {
    if (!stripeState.ready || !stripeState.card) {
        throw new Error('Stripe not ready');
    }

    const paymentOption = BookingState.formData.paymentOption || 'deposit';
    const total = BookingState.total || 0;
    const deposit = Math.round(total * 0.25);
    const amount = paymentOption === 'full' ? total : deposit;

    const response = await fetch('../api/payments/create-intent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            amount: Math.round(amount * 100),
            currency: 'usd',
            paymentType: paymentOption,
            bookingData: BookingState.formData
        })
    });

    if (!response.ok) {
        throw new Error('Unable to start payment');
    }

    const data = await response.json();
    const clientSecret = data.clientSecret || data.client_secret;

    if (!clientSecret) {
        throw new Error('Missing payment token');
    }

    const cardholderName = document.getElementById('cardholderName');
    const { error, paymentIntent } = await stripeState.stripe.confirmCardPayment(clientSecret, {
        payment_method: {
            card: stripeState.card,
            billing_details: {
                name: cardholderName ? cardholderName.value : ''
            }
        }
    });

    if (error) {
        showPaymentError(error.message || 'Payment failed.');
        throw error;
    }

    return {
        paymentIntentId: paymentIntent ? paymentIntent.id : ''
    };
}

function showPaymentError(message) {
    const paymentError = document.getElementById('paymentError');
    if (!paymentError) return;
    paymentError.textContent = message;
}

function generateBookingReference() {
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 1000);
    return `BK${timestamp.toString().slice(-6)}${random.toString().padStart(3, '0')}`;
}

// ==================== VALIDATION ORCHESTRATION ====================

function validateStep(stepNumber) {
    switch (stepNumber) {
        case 1:
            return validateStep1();
        case 2:
            return validateStep2();
        case 3:
            return validateStep3();
        case 4:
            return validateStep4();
        case 5:
            return validateStep5();
        case 6:
            return validateStep6();
        case 7:
            return validateStep7();
        default:
            return true;
    }
}

// ==================== PRICE SUMMARY UPDATES ====================

function updatePriceSummary() {
    // Location
    const locationText = BookingState.formData.city && BookingState.formData.serviceState
        ? `${BookingState.formData.city}, ${BookingState.formData.serviceState}`
        : 'Not selected';
    
    document.getElementById('summaryLocation').textContent = locationText;
    document.getElementById('summaryLocationMobile').textContent = locationText;
    
    // Date & Time
    let dateTimeText = 'Not selected';
    if (BookingState.formData.eventDate && BookingState.formData.eventTime) {
        const date = new Date(BookingState.formData.eventDate);
        const dateStr = date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
        dateTimeText = `${dateStr} at ${BookingState.formData.eventTime}`;
    } else if (BookingState.formData.eventDate) {
        const date = new Date(BookingState.formData.eventDate);
        dateTimeText = date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
    }
    
    document.getElementById('summaryDateTime').textContent = dateTimeText;
    document.getElementById('summaryDateTimeMobile').textContent = dateTimeText;
    
    // Party Size
    const partySizeText = BookingState.totalGuests > 0
        ? `${BookingState.totalGuests} guest${BookingState.totalGuests !== 1 ? 's' : ''} (${BookingState.formData.numAdults} adults, ${BookingState.formData.numChildren} children)`
        : '0 guests';
    
    document.getElementById('summaryPartySize').textContent = partySizeText;
    document.getElementById('summaryPartySizeMobile').textContent = partySizeText;
    
    // Package
    const packageText = BookingState.formData.package.charAt(0).toUpperCase() + BookingState.formData.package.slice(1);
    document.getElementById('summaryPackage').textContent = `${packageText} ($${BookingState.formData.packagePrice}/person)`;
    
    // Base Price
    const basePrice = BookingState.basePrice;
    document.getElementById('summaryBasePrice').textContent = formatCurrency(basePrice);
    document.getElementById('summaryBasePriceMobile').textContent = formatCurrency(basePrice);
    
    // Travel Fee
    const travelFeeBadge = document.getElementById('travelFeeBadge');
    const travelFeeValue = document.getElementById('summaryTravelFee');
    const travelFeeValueMobile = document.getElementById('summaryTravelFeeMobile');
    
    if (BookingState.formData.travelFeeStatus === 'included') {
        travelFeeBadge.textContent = 'INCLUDED';
        travelFeeBadge.className = 'travel-fee-badge travel-fee-badge--included';
        travelFeeValue.textContent = 'Included';
        travelFeeValueMobile.textContent = 'Included';
    } else if (BookingState.formData.travelFeeStatus === 'estimated') {
        travelFeeBadge.textContent = 'ESTIMATED';
        travelFeeBadge.className = 'travel-fee-badge travel-fee-badge--estimated';
        travelFeeValue.textContent = formatCurrency(BookingState.formData.travelFeeAmount);
        travelFeeValueMobile.textContent = formatCurrency(BookingState.formData.travelFeeAmount);
    } else {
        travelFeeBadge.textContent = 'TBD';
        travelFeeBadge.className = 'travel-fee-badge travel-fee-badge--tbd';
        travelFeeValue.textContent = 'TBD';
        travelFeeValueMobile.textContent = 'TBD';
    }
    
    // Add-ons (show row only if addons exist)
    const addonsRow = document.getElementById('addonsRow');
    const addonsRowMobile = document.getElementById('addonsRowMobile');
    
    if (BookingState.formData.addonsTotal > 0) {
        if (addonsRow) {
            addonsRow.style.display = 'flex';
            document.getElementById('summaryAddons').textContent = formatCurrency(BookingState.formData.addonsTotal);
        }
        if (addonsRowMobile) {
            addonsRowMobile.style.display = 'flex';
            document.getElementById('summaryAddonsMobile').textContent = formatCurrency(BookingState.formData.addonsTotal);
        }
    } else {
        if (addonsRow) addonsRow.style.display = 'none';
        if (addonsRowMobile) addonsRowMobile.style.display = 'none';
    }
    
    // Total
    const total = BookingState.formData.travelFeeStatus === 'tbd'
        ? basePrice + BookingState.formData.addonsTotal
        : BookingState.total;
    
    const totalText = BookingState.formData.travelFeeStatus === 'tbd'
        ? `${formatCurrency(total)}+`
        : formatCurrency(total);
    
    document.getElementById('summaryTotal').textContent = totalText;
    document.getElementById('summaryTotalMobile').textContent = totalText;
    
    // Minimum spend notice
    const minimumSpendNotice = document.getElementById('minimumSpendNotice');
    if (BookingState.subtotal < 500) {
        minimumSpendNotice.innerHTML = `
            <strong>⚠️ Minimum Spend:</strong> $500 per event<br>
            <span style="color: var(--color-error);">Current: ${formatCurrency(BookingState.subtotal)} - Add ${formatCurrency(500 - BookingState.subtotal)} more</span>
        `;
        minimumSpendNotice.style.color = 'var(--color-error)';
    } else {
        minimumSpendNotice.innerHTML = `
            <strong>✓ Minimum Spend:</strong> $500 per event<br>
            <span style="color: var(--color-success);">Requirement met</span>
        `;
        minimumSpendNotice.style.color = 'var(--color-success)';
    }
}

// ==================== MOBILE PRICE SUMMARY ====================

function initMobilePriceSummary() {
    const toggle = document.getElementById('priceSummaryToggle');
    const drawer = document.getElementById('priceSummaryMobile');
    const toggleIcon = document.getElementById('toggleIcon');
    
    if (toggle && drawer) {
        toggle.addEventListener('click', () => {
            const isCollapsed = drawer.classList.toggle('price-summary-mobile--collapsed');
            toggleIcon.textContent = isCollapsed ? '▲' : '▼';
        });
    }
}

// ==================== UTILITY FUNCTIONS ====================

function formatCurrency(amount) {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    }).format(amount);
}
