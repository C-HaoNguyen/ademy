import i18n from "i18next";
import { initReactI18next } from "react-i18next";

import common from "./locales/vi/common.json";
import publicNs from "./locales/vi/public.json";
import auth from "./locales/vi/auth.json";
import courses from "./locales/vi/courses.json";
import student from "./locales/vi/student.json";
import teacher from "./locales/vi/teacher.json";
import admin from "./locales/vi/admin.json";

i18n.use(initReactI18next).init({
    lng: "vi",
    fallbackLng: "vi",
    defaultNS: "common",
    ns: ["common", "public", "auth", "courses", "student", "teacher", "admin"],
    resources: {
        vi: {
            common,
            public: publicNs,
            auth,
            courses,
            student,
            teacher,
            admin,
        },
    },
    interpolation: {
        escapeValue: false,
    },
});

export default i18n;
