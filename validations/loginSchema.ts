import * as Yup from "yup";
import { emailField, passwordField } from "./common";

export const loginSchema = Yup.object({
  email: emailField,
  password: passwordField,
});

export type LoginFormValues = Yup.InferType<typeof loginSchema>;
