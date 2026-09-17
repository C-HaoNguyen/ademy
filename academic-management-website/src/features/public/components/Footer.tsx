import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Globe, Twitter, Facebook } from "lucide-react";

const Footer = () => {
    const { t } = useTranslation("public");
    return (
        <motion.footer
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="bg-gradient-to-br from-slate-900 to-slate-800 text-slate-300"
        >
            <div className="max-w-7xl mx-auto px-6 py-14 grid grid-cols-1 md:grid-cols-4 gap-10">
                {/* Brand */}
                <div>
                    <h2 className="text-2xl font-bold text-white mb-3">
                        Ademy
                    </h2>
                    <p className="text-sm leading-relaxed text-slate-400">
                        {t("footer.brandDescription")}
                    </p>
                </div>

                {/* Links */}
                <div>
                    <h3 className="text-white font-semibold mb-4">{t("footer.aboutTitle")}</h3>
                    <ul className="space-y-2 text-sm">
                        <li className="hover:text-white transition cursor-pointer">{t("footer.aboutCourses")}</li>
                        <li className="hover:text-white transition cursor-pointer">{t("footer.aboutInstructors")}</li>
                        <li className="hover:text-white transition cursor-pointer">{t("footer.aboutContact")}</li>
                    </ul>
                </div>

                <div>
                    <h3 className="text-white font-semibold mb-4">{t("footer.servicesTitle")}</h3>
                    <ul className="space-y-2 text-sm">
                        <li className="hover:text-white transition cursor-pointer">{t("footer.servicesSupport")}</li>
                        <li className="hover:text-white transition cursor-pointer">{t("footer.servicesPrivacy")}</li>
                        <li className="hover:text-white transition cursor-pointer">{t("footer.servicesTerms")}</li>
                    </ul>
                </div>

                {/* Contact */}
                <div>
                    <h3 className="text-white font-semibold mb-4">{t("footer.contactTitle")}</h3>
                    <ul className="space-y-2 text-sm">
                        <li>{t("footer.emailLine")}</li>
                        <li>{t("footer.phoneLine")}</li>
                        <li className="flex gap-4 mt-4">
                            <Link
                                to="https://academic-management-website.onrender.com/"
                                target="_blank"
                                aria-label={t("footer.websiteAlt")}
                                className="hover:text-white cursor-pointer transition"
                            >
                                <Globe size={18} />
                            </Link>
                            <a href="#" aria-label="Twitter" className="hover:text-white cursor-pointer transition">
                                <Twitter size={18} />
                            </a>
                            <a href="#" aria-label="Facebook" className="hover:text-white cursor-pointer transition">
                                <Facebook size={18} />
                            </a>
                        </li>
                    </ul>
                </div>
            </div>

            {/* Bottom */}
            <div className="border-t border-slate-700 py-4 text-center text-sm text-slate-400">
                {t("footer.copyright", { year: new Date().getFullYear() })}
            </div>
        </motion.footer>
    );
};

export default Footer;
