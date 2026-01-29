/**
 * Confirmation Page Logic
 * Displays booking summary and handles post-submission flow
 */

document.addEventListener('DOMContentLoaded', () => {
    // Check if user came from booking flow
    const bookingComplete = sessionStorage.getItem('bookingComplete');
    const bookingRef = sessionStorage.getItem('bookingReference');
    const bookingState = sessionStorage.getItem('bookingState');
    
    if (!bookingComplete || !bookingRef) {
        // User navigated directly to confirmation page without completing booking
        window.location.href = 'booking.html';
        return;
    }
    
    // Display booking reference
    const bookingRefElement = document.getElementById('bookingReference');
    if (bookingRefElement) {
        bookingRefElement.textContent = bookingRef;
    }
    
    // Parse and display booking summary
    if (bookingState) {
        try {
            const state = JSON.parse(bookingState);
            displayBookingSummary(state);
            displayPaymentSummary(state);
            updatePaymentTimeline(state);
        } catch (error) {
            console.error('Error parsing booking state:', error);
        }
    }
    
    // Clear "bookingComplete" flag so refresh doesn't trigger redirect
    // But keep bookingState for summary display
    sessionStorage.removeItem('bookingComplete');
});

function displayBookingSummary(state) {
    const summaryContainer = document.getElementById('bookingSummaryContent');
    if (!summaryContainer || !state.formData) return;
    
    const data = state.formData;
    
    // Format date
    let dateStr = 'Not specified';
    if (data.eventDate) {
        const date = new Date(data.eventDate);
        dateStr = date.toLocaleDateString('en-US', { 
            weekday: 'long',
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
        });
        if (data.eventTime) {
            dateStr += ` at ${data.eventTime}`;
        }
    }
    
    // Format location
    const location = data.city && data.serviceState 
        ? `${data.city}, ${data.serviceState}`
        : 'Not specified';
    
    // Format address
    let fullAddress = data.address || 'Not specified';
    if (data.addressLine2) {
        fullAddress += `, ${data.addressLine2}`;
    }
    if (data.zipCode) {
        fullAddress += ` ${data.zipCode}`;
    }
    
    // Format party size
    const adults = data.numAdults ?? 0;
    const children = data.numChildren ?? 0;
    const partySize = `${adults} adults${children > 0 ? `, ${children} children` : ''}`;
    
    // Format package
    const packageKey = data.package || 'signature';
    const packageName = packageKey.charAt(0).toUpperCase() + packageKey.slice(1);
    const packagePrice = `$${data.packagePrice || 75}/person`;
    
    // Calculate pricing
    const basePrice = calculateBasePrice(data);
    const addonsTotal = data.addonsTotal || 0;
    const travelFee = data.travelFeeStatus === 'included' ? 0 : (data.travelFeeAmount || 0);
    const subtotal = basePrice + addonsTotal;
    const total = subtotal + (data.travelFeeStatus === 'tbd' ? 0 : travelFee);
    
    // Build HTML
    let html = '<div class="summary-grid">';
    
    // Event Details Section
    html += '<div class="summary-section">';
    html += '<h4 class="summary-section__title">Event Details</h4>';
    html += `<div class="summary-row"><span class="summary-label">Date & Time:</span><span class="summary-value">${dateStr}</span></div>`;
    html += `<div class="summary-row"><span class="summary-label">Location:</span><span class="summary-value">${location}</span></div>`;
    html += `<div class="summary-row"><span class="summary-label">Venue Address:</span><span class="summary-value">${fullAddress}</span></div>`;
    html += `<div class="summary-row"><span class="summary-label">Venue Type:</span><span class="summary-value">${formatVenueType(data.venueType)}</span></div>`;
    html += '</div>';
    
    // Party & Package Section
    html += '<div class="summary-section">';
    html += '<h4 class="summary-section__title">Party & Package</h4>';
    html += `<div class="summary-row"><span class="summary-label">Guest Count:</span><span class="summary-value">${partySize}</span></div>`;
    html += `<div class="summary-row"><span class="summary-label">Package:</span><span class="summary-value">${packageName} ${packagePrice}</span></div>`;
    if (data.addons && data.addons.length > 0) {
        html += `<div class="summary-row"><span class="summary-label">Add-ons:</span><span class="summary-value">${data.addons.length} selected</span></div>`;
    }
    html += '</div>';
    
    // Pricing Section
    html += '<div class="summary-section">';
    html += '<h4 class="summary-section__title">Pricing</h4>';
    html += `<div class="summary-row"><span class="summary-label">Base Price:</span><span class="summary-value">${formatCurrency(basePrice)}</span></div>`;
    if (addonsTotal > 0) {
        html += `<div class="summary-row"><span class="summary-label">Add-ons:</span><span class="summary-value">${formatCurrency(addonsTotal)}</span></div>`;
    }
    html += `<div class="summary-row"><span class="summary-label">Travel Fee:</span><span class="summary-value">${formatTravelFee(data)}</span></div>`;
    html += `<div class="summary-row summary-row--total"><span class="summary-label"><strong>Estimated Total:</strong></span><span class="summary-value"><strong>${formatCurrency(total)}</strong></span></div>`;
    if (data.travelFeeStatus === 'tbd') {
        html += '<p class="text-sm text-muted" style="margin-top: var(--spacing-sm);">Final total will be confirmed after travel fee is determined</p>';
    }
    html += '</div>';
    
    // Contact Info Section
    html += '<div class="summary-section">';
    html += '<h4 class="summary-section__title">Contact Information</h4>';
    html += `<div class="summary-row"><span class="summary-label">Name:</span><span class="summary-value">${data.contactName || 'Not specified'}</span></div>`;
    html += `<div class="summary-row"><span class="summary-label">Email:</span><span class="summary-value">${data.contactEmail || 'Not specified'}</span></div>`;
    html += `<div class="summary-row"><span class="summary-label">Phone:</span><span class="summary-value">${data.contactPhone || 'Not specified'}</span></div>`;
    html += '</div>';
    
    // Dietary Info Section (if provided)
    if (data.dietaryRestrictions || data.allergies) {
        html += '<div class="summary-section">';
        html += '<h4 class="summary-section__title">Dietary Information</h4>';
        if (data.dietaryRestrictions) {
            html += `<div class="summary-row"><span class="summary-label">Restrictions:</span><span class="summary-value">${data.dietaryRestrictions}</span></div>`;
        }
        if (data.allergies) {
            html += `<div class="summary-row"><span class="summary-label">⚠️ Allergies:</span><span class="summary-value">${data.allergies}</span></div>`;
        }
        html += '</div>';
    }
    
    html += '</div>'; // Close summary-grid
    
    summaryContainer.innerHTML = html;
}

function displayPaymentSummary(state) {
    const paymentStatusEl = document.getElementById('paymentStatus');
    const paymentAmountEl = document.getElementById('paymentAmount');
    const paymentBalanceEl = document.getElementById('paymentBalance');
    const paymentReferenceEl = document.getElementById('paymentReference');
    const paymentNoteEl = document.getElementById('paymentNote');

    if (!paymentStatusEl || !paymentAmountEl || !paymentBalanceEl || !paymentReferenceEl || !paymentNoteEl) {
        return;
    }

    const data = state.formData || {};
    const total = calculateEstimatedTotal(data);
    const deposit = Math.round(total * 0.25);
    const paymentOption = data.paymentOption || 'deposit';
    const paymentIntentId = sessionStorage.getItem('paymentIntentId');

    let amountPaid = 0;
    let status = 'Pending';
    let note = 'We will email your secure payment link within 24 hours.';

    if (paymentOption === 'full') {
        amountPaid = total;
        status = 'Paid in Full';
        note = 'Thank you! Your booking is fully paid.';
    } else if (paymentOption === 'deposit') {
        amountPaid = deposit;
        status = 'Deposit Paid';
        note = 'Deposit received. Remaining balance is due before your event.';
    } else if (paymentOption === 'later') {
        amountPaid = 0;
        status = 'Payment Pending';
        note = 'We’ll send a secure payment link shortly to secure your date.';
    }

    const balanceDue = Math.max(total - amountPaid, 0);

    paymentStatusEl.textContent = status;
    paymentAmountEl.textContent = formatCurrency(amountPaid);
    paymentBalanceEl.textContent = formatCurrency(balanceDue);
    paymentReferenceEl.textContent = paymentIntentId || 'Not available';
    paymentNoteEl.textContent = note;
}

function updatePaymentTimeline(state) {
    const title = document.getElementById('paymentTimelineTitle');
    const description = document.getElementById('paymentTimelineDescription');
    if (!title || !description) return;

    const option = state.formData?.paymentOption || 'deposit';

    if (option === 'later') {
        title.textContent = 'Secure Payment Link';
        description.textContent = 'We’ll email a secure payment link within 24 hours to confirm your booking.';
        return;
    }

    if (option === 'full') {
        title.textContent = 'Payment Confirmation';
        description.textContent = 'Your payment is confirmed. A receipt is on the way.';
        return;
    }

    title.textContent = 'Deposit Confirmed';
    description.textContent = 'Your deposit is confirmed. We’ll remind you about the remaining balance before your event.';
}

function calculateEstimatedTotal(data) {
    const basePrice = calculateBasePrice(data);
    const addonsTotal = data.addonsTotal || 0;
    const travelFee = data.travelFeeStatus === 'included' ? 0 : (data.travelFeeAmount || 0);
    if (data.travelFeeStatus === 'tbd') {
        return basePrice + addonsTotal;
    }
    return basePrice + addonsTotal + travelFee;
}

function calculateBasePrice(data) {
    const packagePrices = {
        essential: { adult: 65, child: 43 },
        signature: { adult: 75, child: 50 },
        premium: { adult: 95, child: 63 }
    };
    
    const prices = packagePrices[data.package] || packagePrices.signature;
    const adults = data.numAdults ?? 0;
    const children = data.numChildren ?? 0;
    return (adults * prices.adult) + (children * prices.child);
}

function formatVenueType(type) {
    const types = {
        'home': 'Private Home',
        'backyard': 'Backyard/Outdoor',
        'community-center': 'Community Center',
        'office': 'Office/Corporate Space',
        'rental-venue': 'Rental Venue',
        'other': 'Other'
    };
    return types[type] || type;
}

function formatTravelFee(data) {
    if (data.travelFeeStatus === 'included') {
        return 'Included';
    } else if (data.travelFeeStatus === 'estimated') {
        return `~${formatCurrency(data.travelFeeAmount)} (estimated)`;
    } else {
        return 'To be determined';
    }
}

function formatCurrency(amount) {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    }).format(amount);
}

/**
 * Calendar Download (.ics file generation) and Calendar Links
 */
document.addEventListener('DOMContentLoaded', () => {
    const downloadBtn = document.getElementById('downloadCalendarBtn');
    if (downloadBtn) {
        downloadBtn.addEventListener('click', generateCalendarFile);
    }
    
    // Generate calendar links
    generateCalendarLinks();
});

/**
 * Generate links for Google Calendar, Outlook, and Yahoo
 */
function generateCalendarLinks() {
    const bookingState = sessionStorage.getItem('bookingState');
    if (!bookingState) return;
    
    try {
        const state = JSON.parse(bookingState);
        const data = state.formData;
        const bookingRef = sessionStorage.getItem('bookingReference') || 'PENDING';
        
        if (!data.eventDate) return;
        
        // Parse event date and time
        const eventDate = new Date(data.eventDate);
        const eventTime = data.eventTime || '18:00';
        const [hours, minutes] = parseEventTime(eventTime);
        eventDate.setHours(hours, minutes, 0, 0);
        
        // End time (2.5 hours later)
        const endDate = new Date(eventDate);
        endDate.setHours(endDate.getHours() + 2, endDate.getMinutes() + 30);
        
        // Event details
        const packageName = data.package ? data.package.charAt(0).toUpperCase() + data.package.slice(1) : 'Signature';
        const title = `🍳 POP Habachi - ${packageName} Package`;
        
        const adults = data.numAdults || 0;
        const children = data.numChildren || 0;
        const guestStr = `${adults} adults${children > 0 ? `, ${children} children` : ''}`;
        
        let description = `POP Habachi Private Chef Experience\n\n`;
        description += `Confirmation: ${bookingRef}\n`;
        description += `Package: ${packageName}\n`;
        description += `Guests: ${guestStr}\n\n`;
        description += `Your chef arrives 30-45 min early for setup.\n`;
        description += `Questions? Email: info@pophabachi.com`;
        
        // Location
        let location = data.address || '';
        if (data.city && data.serviceState) {
            location += location ? `, ${data.city}, ${data.serviceState}` : `${data.city}, ${data.serviceState}`;
        }
        if (data.zipCode) {
            location += ` ${data.zipCode}`;
        }
        
        // Google Calendar Link
        const googleLink = document.getElementById('googleCalendarLink');
        if (googleLink) {
            const googleUrl = generateGoogleCalendarUrl(title, description, location, eventDate, endDate);
            googleLink.href = googleUrl;
        }
        
        // Outlook Calendar Link
        const outlookLink = document.getElementById('outlookCalendarLink');
        if (outlookLink) {
            const outlookUrl = generateOutlookCalendarUrl(title, description, location, eventDate, endDate);
            outlookLink.href = outlookUrl;
        }
        
        // Yahoo Calendar Link
        const yahooLink = document.getElementById('yahooCalendarLink');
        if (yahooLink) {
            const yahooUrl = generateYahooCalendarUrl(title, description, location, eventDate, endDate);
            yahooLink.href = yahooUrl;
        }
        
    } catch (error) {
        console.error('Error generating calendar links:', error);
    }
}

/**
 * Parse event time string to hours and minutes
 */
function parseEventTime(timeStr) {
    let hours = 18;
    let minutes = 0;
    
    const match = timeStr.match(/(\d{1,2}):(\d{2})/);
    if (match) {
        hours = parseInt(match[1], 10);
        minutes = parseInt(match[2], 10);
        
        if (timeStr.toLowerCase().includes('pm') && hours < 12) {
            hours += 12;
        } else if (timeStr.toLowerCase().includes('am') && hours === 12) {
            hours = 0;
        }
    }
    
    return [hours, minutes];
}

/**
 * Format date for Google Calendar (YYYYMMDDTHHMMSSZ)
 */
function formatGoogleDate(date) {
    return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
}

/**
 * Generate Google Calendar URL
 */
function generateGoogleCalendarUrl(title, description, location, startDate, endDate) {
    const params = new URLSearchParams({
        action: 'TEMPLATE',
        text: title,
        dates: `${formatGoogleDate(startDate)}/${formatGoogleDate(endDate)}`,
        details: description,
        location: location,
        sf: 'true',
        output: 'xml'
    });
    
    return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

/**
 * Generate Outlook Calendar URL (Outlook.com/Office 365)
 */
function generateOutlookCalendarUrl(title, description, location, startDate, endDate) {
    const params = new URLSearchParams({
        path: '/calendar/action/compose',
        rru: 'addevent',
        subject: title,
        body: description.replace(/\n/g, '<br>'),
        location: location,
        startdt: startDate.toISOString(),
        enddt: endDate.toISOString()
    });
    
    return `https://outlook.live.com/calendar/0/deeplink/compose?${params.toString()}`;
}

/**
 * Generate Yahoo Calendar URL
 */
function generateYahooCalendarUrl(title, description, location, startDate, endDate) {
    // Yahoo uses a different date format
    const formatYahooDate = (date) => {
        return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    };
    
    // Calculate duration in hours and minutes
    const durationMs = endDate - startDate;
    const durationHours = Math.floor(durationMs / (1000 * 60 * 60));
    const durationMinutes = Math.floor((durationMs % (1000 * 60 * 60)) / (1000 * 60));
    const duration = `${String(durationHours).padStart(2, '0')}${String(durationMinutes).padStart(2, '0')}`;
    
    const params = new URLSearchParams({
        v: '60',
        title: title,
        st: formatYahooDate(startDate),
        dur: duration,
        desc: description,
        in_loc: location
    });
    
    return `https://calendar.yahoo.com/?${params.toString()}`;
}

function generateCalendarFile() {
    const bookingState = sessionStorage.getItem('bookingState');
    if (!bookingState) {
        alert('Booking data not found. Please contact support.');
        return;
    }

    try {
        const state = JSON.parse(bookingState);
        const data = state.formData;
        const bookingRef = sessionStorage.getItem('bookingReference') || 'PENDING';

        // Build .ics file content
        const ics = [];
        ics.push('BEGIN:VCALENDAR');
        ics.push('VERSION:2.0');
        ics.push('PRODID:-//ChefWeb//Booking Calendar//EN');
        ics.push('CALSCALE:GREGORIAN');
        ics.push('METHOD:PUBLISH');
        ics.push('X-WR-CALNAME:ChefWeb Booking');
        ics.push('X-WR-TIMEZONE:America/New_York');
        ics.push('BEGIN:VEVENT');
        
        // Generate unique ID
        const uid = `${bookingRef}@chefweb.com`;
        ics.push(`UID:${uid}`);
        
        // Date and time
        if (data.eventDate) {
            const eventDate = new Date(data.eventDate);
            let startTime = data.eventTime || '18:00';
            
            // Parse time (format: "18:00" or "6:00 PM")
            const timeMatch = startTime.match(/(\\d{1,2}):(\\d{2})/);
            if (timeMatch) {
                let hours = parseInt(timeMatch[1]);
                const minutes = timeMatch[2];
                
                // Handle AM/PM if present
                if (startTime.includes('PM') && hours < 12) {
                    hours += 12;
                } else if (startTime.includes('AM') && hours === 12) {
                    hours = 0;
                }
                
                // Start time (assume 2.5 hour event duration)
                const startDateTime = new Date(eventDate);
                startDateTime.setHours(hours, parseInt(minutes), 0);
                
                const endDateTime = new Date(startDateTime);
                endDateTime.setHours(startDateTime.getHours() + 2, startDateTime.getMinutes() + 30);
                
                // Format for .ics (YYYYMMDDTHHMMSS)
                const formatIcsDate = (date) => {
                    const year = date.getFullYear();
                    const month = String(date.getMonth() + 1).padStart(2, '0');
                    const day = String(date.getDate()).padStart(2, '0');
                    const hours = String(date.getHours()).padStart(2, '0');
                    const minutes = String(date.getMinutes()).padStart(2, '0');
                    const seconds = String(date.getSeconds()).padStart(2, '0');
                    return `${year}${month}${day}T${hours}${minutes}${seconds}`;
                };
                
                ics.push(`DTSTART:${formatIcsDate(startDateTime)}`);
                ics.push(`DTEND:${formatIcsDate(endDateTime)}`);
            }
        }
        
        // Event summary
        const packageName = data.package ? data.package.charAt(0).toUpperCase() + data.package.slice(1) : 'Standard';
        const summary = `ChefWeb Private Hibachi Chef - ${packageName} Package`;
        ics.push(`SUMMARY:${summary}`);
        
        // Description
        const partySize = `${data.numAdults || 0} adults${(data.numChildren && data.numChildren > 0) ? `, ${data.numChildren} children` : ''}`;
        let description = `ChefWeb Booking ${bookingRef}\\\\n\\\\n`;
        description += `Package: ${packageName}\\\\n`;
        description += `Party Size: ${partySize}\\\\n`;
        if (data.eventType) {
            description += `Event Type: ${data.eventType}\\\\n`;
        }
        description += `\\\\nContact: book@chefweb.com | 1-888-555-CHEF\\\\n`;
        description += `Emergency (day-of): (888) 555-9911`;
        ics.push(`DESCRIPTION:${description}`);
        
        // Location
        if (data.address) {
            let location = data.address;
            if (data.city && data.serviceState) {
                location += `, ${data.city}, ${data.serviceState}`;
            }
            if (data.zipCode) {
                location += ` ${data.zipCode}`;
            }
            ics.push(`LOCATION:${location}`);
        }
        
        // Status and other properties
        ics.push('STATUS:CONFIRMED');
        ics.push('SEQUENCE:0');
        
        // Timestamp
        const now = new Date();
        const timestamp = now.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
        ics.push(`DTSTAMP:${timestamp}`);
        
        // Reminder: 1 day before
        ics.push('BEGIN:VALARM');
        ics.push('TRIGGER:-P1D');
        ics.push('ACTION:DISPLAY');
        ics.push('DESCRIPTION:Reminder: ChefWeb event tomorrow!');
        ics.push('END:VALARM');
        
        ics.push('END:VEVENT');
        ics.push('END:VCALENDAR');
        
        // Create blob and download
        const icsContent = ics.join('\\r\\n');
        const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
        const link = document.createElement('a');
        link.href = window.URL.createObjectURL(blob);
        link.download = `chefweb-booking-${bookingRef}.ics`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        // Show success message
        alert('Calendar event downloaded! Open the file to add it to your calendar app.');
        
    } catch (error) {
        console.error('Error generating calendar file:', error);
        alert('Error creating calendar file. Please contact support.');
    }
}
