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
  const hasMinLength = password.length >= 6;
  const hasUppercase = /[A-Z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSpecial = /[^A-Za-z0-9]/.test(password);
  return hasMinLength && hasUppercase && hasNumber && hasSpecial;
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
    if (!isValidPassword(data.password)) return { valid: false, message: "Password must be at least 6 characters, with one uppercase letter, one number, and one special character." };
    
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
