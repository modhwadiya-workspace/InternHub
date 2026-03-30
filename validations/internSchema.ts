import * as Yup from "yup";

export const internSchema = Yup.object().shape({
  name: Yup.string()
    .min(2, "Name must be at least 2 characters")
    .required("Name is required"),
  email: Yup.string()
    .email("Invalid email address")
    .required("Email is required"),
  password: Yup.string()
    .matches(/^(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{7,}$/, "Password must be at least 7 characters long and contain one uppercase letter, one number, and one special character")
    .required("Password is required"),
  contact_number: Yup.string()
    .matches(/^\d{10}$/, "Contact number must be exactly 10 digits")
    .required("Contact number is required"),
  gender: Yup.string()
    .oneOf(["male", "female"], "Please select a gender")
    .required("Gender is required"),
  college: Yup.string()
    .required("College is required"),
  joining_date: Yup.date()
    .required("Joining date is required"),
  date_of_birth: Yup.date()
    .nullable(),
  degree: Yup.string()
    .nullable(),
  department_id: Yup.string()
    .required("Department is required"),
});
