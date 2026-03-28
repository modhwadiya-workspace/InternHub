import * as Yup from "yup";
import { nameField, emailField, passwordField, contactNumberField } from "./common";

export const managerSchema = Yup.object({
  name: nameField,
  email: emailField,
  password: passwordField,
  contact_number: contactNumberField,
  gender: Yup.string().oneOf(["male", "female"], "Please select a gender").required("Gender is required"),
  department_id: Yup.string().required("Department is required"),
});

export type ManagerFormValues = Yup.InferType<typeof managerSchema>;
