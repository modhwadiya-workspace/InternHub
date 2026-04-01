import * as Yup from "yup";

export const managerSchema = Yup.object().shape({
  name: Yup.string()
    .min(2, "Name must be at least 2 characters")
    .required("Please enter the manager's full name"),
  email: Yup.string()
    .email("Please enter a valid email address")
    .required("Email address is required"),
  password: Yup.string()
    .matches(/^(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{7,}$/, "Password must be at least 7 characters with one uppercase letter, one number, and one special character")
    .required("Please set a password for the manager"),
  contact_number: Yup.string()
    .matches(/^\d{10}$/, "Contact number must be exactly 10 digits")
    .required("Contact number is required"),
  gender: Yup.string()
    .oneOf(["male", "female"], "Please select a gender")
    .required("Gender is required"),
  department_id: Yup.string()
    .required("Please select a department"),
});
