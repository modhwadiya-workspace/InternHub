export const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export const passwordRegex = /^(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{7,}$/;

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

export function validateUserRegistration(data: any): { valid: boolean; message?: string } {
    if (!isValidName(data.name)) return { valid: false, message: "Name must be at least 2 characters long." };
    if (!isValidEmail(data.email)) return { valid: false, message: "Invalid email format." };
    if (!isValidPassword(data.password)) return { valid: false, message: "Password must be at least 7 characters long and contain one uppercase letter, one number, and one special character." };
    
    if (!isValidContactNumber(data.contact_number)) return { valid: false, message: "Contact number must be exactly 10 digits." };

    if (data.role === "manager") {
        if (!data.gender) return { valid: false, message: "Gender is required for managers." };
    }

    return { valid: true };
}

export function validateUserUpdate(data: any): { valid: boolean; message?: string } {
    if (!isValidName(data.name)) return { valid: false, message: "Name must be at least 2 characters long." };
    if (!isValidEmail(data.email)) return { valid: false, message: "Invalid email format." };
    
    if (!isValidContactNumber(data.contact_number)) return { valid: false, message: "Contact number must be exactly 10 digits." };

    if (data.role === "manager") {
        if (!data.gender) return { valid: false, message: "Gender is required for managers." };
    }
    return { valid: true };
}

export function isValidDate(dateStr: string | undefined | null): boolean {
    if (!dateStr) return false;
    const date = new Date(dateStr);
    return !isNaN(date.getTime());
}

export function validateLeaveRequest(data: any): { valid: boolean; message?: string } {
    if (!isValidDate(data.start_date)) return { valid: false, message: "Invalid start date." };
    if (!isValidDate(data.end_date)) return { valid: false, message: "Invalid end date." };
    if (new Date(data.start_date) > new Date(data.end_date)) return { valid: false, message: "Start date cannot be after end date." };
    if (!data.reason || data.reason.trim().length < 5) return { valid: false, message: "Reason must be at least 5 characters long." };
    if (!data.leave_type || data.leave_type.trim().length < 2) return { valid: false, message: "Leave type is required." };
    return { valid: true };
}

export function validateTaskCreation(data: any): { valid: boolean; message?: string } {
    if (!data.title || data.title.trim().length < 3) return { valid: false, message: "Title must be at least 3 characters long." };
    
    // Support both single UUID string and array of UUID strings
    const hasAssigned = Array.isArray(data.assigned_to) 
        ? data.assigned_to.length > 0 
        : !!data.assigned_to;
        
    if (!hasAssigned) return { valid: false, message: "At least one assigned user is required." };
    
    if (data.due_date && !isValidDate(data.due_date)) return { valid: false, message: "Invalid due date." };
    return { valid: true };
}
