import * as Yup from "yup";

export const changePasswordSchema = Yup.object().shape({
  currentPassword: Yup.string()
    .required("Current password is required"),
  newPassword: Yup.string()
    .matches(/^(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{7,}$/, "Password must be at least 7 characters long and contain one uppercase letter, one number, and one special character")
    .required("New password is required"),
  confirmPassword: Yup.string()
    .oneOf([Yup.ref("newPassword")], "Passwords must match")
    .required("Please confirm your new password"),
});
