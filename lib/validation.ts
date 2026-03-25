export const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

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
  return password.length >= 6;
}

export function isValidDepartmentName(name: string | undefined | null): boolean {
    if (!name) return false;
    return name.trim().length >= 2;
}

export function validateUserRegistration(data: any): { valid: boolean; message?: string } {
    if (!isValidName(data.name)) return { valid: false, message: "Name must be at least 2 characters long." };
    if (!isValidEmail(data.email)) return { valid: false, message: "Invalid email format." };
    if (!isValidPassword(data.password)) return { valid: false, message: "Password must be at least 6 characters long." };
    
    // Check college if intern
    if (data.role === "intern") {
        if (!data.college || data.college.trim().length < 2) {
            return { valid: false, message: "College/University name must be at least 2 characters long." };
        }
    }
    return { valid: true };
}

export function validateUserUpdate(data: any): { valid: boolean; message?: string } {
    if (!isValidName(data.name)) return { valid: false, message: "Name must be at least 2 characters long." };
    if (!isValidEmail(data.email)) return { valid: false, message: "Invalid email format." };
    
    // Check college if intern UPDATE
    if (data.role === "intern") {
        if (!data.college || data.college.trim().length < 2) {
            return { valid: false, message: "College/University name must be at least 2 characters long." };
        }
    }
    return { valid: true };
}
