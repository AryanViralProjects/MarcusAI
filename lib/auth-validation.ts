export const validateUsername = (username: string): string | null => {
  if (!username) return "Username is required";
  if (username.length < 3) return "Username must be at least 3 characters";
  return null;
};

export const validateEmail = (email: string): string | null => {
  if (!email) return "Email is required";
  
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) return "Invalid email format";
  
  return null;
};

export const validatePassword = (password: string): string | null => {
  if (!password) return "Password is required";
  if (password.length < 8) return "Password must be at least 8 characters";
  
  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);
  
  if (!hasUpperCase) return "Password must contain at least one uppercase letter";
  if (!hasLowerCase) return "Password must contain at least one lowercase letter";
  if (!hasNumber) return "Password must contain at least one number";
  if (!hasSpecialChar) return "Password must contain at least one special character";
  
  return null;
};

export const validateName = (name: string): string | null => {
  if (!name) return "Name is required";
  if (name.length < 2) return "Name must be at least 2 characters";
  return null;
};
