export const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export const passwordRegex = /^(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{7,}$/;

/**
 * Converts raw Hasura/Postgres error messages into user-friendly messages.
 * Catches unique constraint violations and other common DB errors.
 */
export function friendlyDbError(rawMessage: string): string {
    if (!rawMessage) return "An unexpected error occurred. Please try again.";
    const msg = rawMessage.toLowerCase();
    if (msg.includes("unique") || msg.includes("duplicate key")) {
        if (msg.includes("users_email_key") || msg.includes("email")) {
            return "This email address is already registered. Please use a different email.";
        }
        if (msg.includes("users_contact_number_key") || msg.includes("contact_number")) {
            return "This contact number is already in use. Please use a different number.";
        }
        if (msg.includes("interns_contact_number_key")) {
            return "This contact number is already assigned to another intern. Please use a different number.";
        }
        return "A record with this information already exists. Please check for duplicates.";
    }
    if (msg.includes("foreign key") || msg.includes("not-null")) {
        return "Some required information is missing or invalid. Please check your input.";
    }
    return rawMessage;
}

export function isValidEmail(email: string | undefined | null): boolean {
  if (!email) return false;
  return emailRegex.test(email.trim());
}

export function isValidName(name: string | undefined | null): boolean {
  if (!name) return false;
  return name.trim().length >= 2;
}

export function isValidPassword(password: string | undefined | null): boolean {
  if (!password) return false;
  return passwordRegex.test(password);
}

export function isValidDepartmentName(name: string | undefined | null): boolean {
    if (!name) return false;
    return name.trim().length >= 2;
}

export function isValidContactNumber(num: string | undefined | null): boolean {
    if (!num) return false;
    return /^\d{10}$/.test(num.trim());
}

export function isValidDate(dateStr: string | undefined | null): boolean {
    if (!dateStr) return false;
    const date = new Date(dateStr);
    return !isNaN(date.getTime());
}

/**
 * Check if a date string represents today or a future date.
 * Compares date-only (ignores time) to avoid timezone issues.
 */
export function isFutureOrToday(dateStr: string | undefined | null): boolean {
    if (!dateStr) return false;
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const inputDate = new Date(date);
    inputDate.setHours(0, 0, 0, 0);
    return inputDate >= today;
}

/**
 * Returns today's date as a YYYY-MM-DD string for use as min attribute on date inputs.
 */
export function getTodayStr(): string {
    return new Date().toISOString().split("T")[0];
}

export function validateUserRegistration(data: any): { valid: boolean; message?: string } {
    if (!isValidName(data.name)) return { valid: false, message: "Name must be at least 2 characters long." };
    if (!isValidEmail(data.email)) return { valid: false, message: "Please enter a valid email address." };
    if (!isValidPassword(data.password)) return { valid: false, message: "Password must be at least 7 characters with one uppercase letter, one number, and one special character." };
    
    if (!isValidContactNumber(data.contact_number)) return { valid: false, message: "Contact number must be exactly 10 digits." };

    if (data.role === "manager") {
        if (!data.gender) return { valid: false, message: "Gender is required for managers." };
    }

    return { valid: true };
}

export function validateUserUpdate(data: any): { valid: boolean; message?: string } {
    if (!isValidName(data.name)) return { valid: false, message: "Name must be at least 2 characters long." };
    if (!isValidEmail(data.email)) return { valid: false, message: "Please enter a valid email address." };
    
    if (!isValidContactNumber(data.contact_number)) return { valid: false, message: "Contact number must be exactly 10 digits." };

    if (data.role === "manager") {
        if (!data.gender) return { valid: false, message: "Gender is required for managers." };
    }
    return { valid: true };
}

export function validateLeaveRequest(data: any): { valid: boolean; message?: string } {
    if (!isValidDate(data.start_date)) return { valid: false, message: "Please select a valid start date." };
    if (!isValidDate(data.end_date)) return { valid: false, message: "Please select a valid end date." };
    if (!isFutureOrToday(data.start_date)) return { valid: false, message: "Start date must be today or a future date. You cannot apply for leave in the past." };
    if (!isFutureOrToday(data.end_date)) return { valid: false, message: "End date must be today or a future date." };
    if (new Date(data.start_date) > new Date(data.end_date)) return { valid: false, message: "Start date cannot be after the end date." };
    if (!data.reason || data.reason.trim().length < 5) return { valid: false, message: "Please provide a reason with at least 5 characters." };
    if (!data.leave_type || data.leave_type.trim().length < 2) return { valid: false, message: "Please select a leave category." };
    return { valid: true };
}

export function validateTaskCreation(data: any): { valid: boolean; message?: string } {
    if (!data.title || data.title.trim().length < 3) return { valid: false, message: "Task title must be at least 3 characters long." };
    
    // Support both single UUID string and array of UUID strings
    const hasAssigned = Array.isArray(data.assigned_to) 
        ? data.assigned_to.length > 0 
        : !!data.assigned_to;
        
    if (!hasAssigned) return { valid: false, message: "Please select at least one intern to assign this task to." };
    
    if (data.due_date) {
        if (!isValidDate(data.due_date)) return { valid: false, message: "Please select a valid due date." };
        if (!isFutureOrToday(data.due_date)) return { valid: false, message: "Due date must be today or a future date. Past dates are not allowed." };
    }
    return { valid: true };
}
