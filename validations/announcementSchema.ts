import * as Yup from "yup";

export const announcementSchema = Yup.object().shape({
  title: Yup.string()
    .min(3, "Title must be at least 3 characters")
    .max(100, "Title must be at most 100 characters")
    .required("Please enter a title for the announcement"),
  message: Yup.string()
    .min(10, "Message must be at least 10 characters")
    .required("Please write the announcement message"),
});
