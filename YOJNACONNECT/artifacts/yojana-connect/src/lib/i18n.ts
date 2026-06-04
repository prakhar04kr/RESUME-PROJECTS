import { useEffect } from "react";
import i18n from "i18next";
import { initReactI18next } from "react-i18next";

const resources = {
  en: {
    translation: {
      "home.title": "Discover Government Schemes Made for You",
      "home.subtitle": "Select your age to find personalized welfare programs, scholarships, and financial assistance.",
      "home.select_age": "Select Your Age",
      "home.continue": "Find Schemes",
      
      "nav.home": "Home",
      "nav.central": "Central Schemes",
      "nav.state": "State Schemes",
      
      "schemes.title": "Schemes for You",
      "schemes.stats.total": "Total Schemes",
      "schemes.stats.central": "Central",
      "schemes.stats.state": "State",
      
      "schemes.filters.sector": "Sector",
      "schemes.filters.income": "Annual Income",
      "schemes.filters.category": "Category",
      "schemes.filters.clear": "Clear Filters",
      
      "schemes.popular": "Popular Schemes",
      
      "scheme.ministry": "Ministry",
      "scheme.benefit": "Benefit",
      "scheme.view_details": "View Details",
      
      "detail.overview": "Overview",
      "detail.eligibility": "Eligibility",
      "detail.documents": "Documents Required",
      "detail.apply": "How to Apply",
      "detail.terms": "Terms & Conditions",
      
      "detail.share": "Share",
      "detail.apply_now": "Apply Now",
      "detail.deadline": "Deadline:",
      
      "detail.related": "Related Schemes",
      
      "income.any": "Any Income",
      "income.under1L": "Below ₹1 Lakh",
      "income.1to3L": "₹1 Lakh - ₹3 Lakhs",
      "income.3to8L": "₹3 Lakhs - ₹8 Lakhs",
      "income.above8L": "Above ₹8 Lakhs",
      
      "state.coming_soon": "Coming Soon",
      "state.title": "State Schemes",
      "state.subtitle": "Select your state to discover localized welfare programs."
    }
  },
  hi: {
    translation: {
      "home.title": "आपके लिए बनी सरकारी योजनाएं खोजें",
      "home.subtitle": "अपनी आयु चुनें और व्यक्तिगत कल्याणकारी कार्यक्रम, छात्रवृत्ति और वित्तीय सहायता पाएं।",
      "home.select_age": "अपनी आयु चुनें",
      "home.continue": "योजनाएं खोजें",
      
      "nav.home": "होम",
      "nav.central": "केंद्रीय योजनाएं",
      "nav.state": "राज्य योजनाएं",
      
      "schemes.title": "आपके लिए योजनाएं",
      "schemes.stats.total": "कुल योजनाएं",
      "schemes.stats.central": "केंद्रीय",
      "schemes.stats.state": "राज्य",
      
      "schemes.filters.sector": "क्षेत्र",
      "schemes.filters.income": "वार्षिक आय",
      "schemes.filters.category": "श्रेणी",
      "schemes.filters.clear": "फ़िल्टर हटाएं",
      
      "schemes.popular": "लोकप्रिय योजनाएं",
      
      "scheme.ministry": "मंत्रालय",
      "scheme.benefit": "लाभ",
      "scheme.view_details": "विवरण देखें",
      
      "detail.overview": "अवलोकन",
      "detail.eligibility": "पात्रता",
      "detail.documents": "आवश्यक दस्तावेज़",
      "detail.apply": "आवेदन कैसे करें",
      "detail.terms": "नियम एवं शर्तें",
      
      "detail.share": "साझा करें",
      "detail.apply_now": "अभी आवेदन करें",
      "detail.deadline": "अंतिम तिथि:",
      
      "detail.related": "संबंधित योजनाएं",
      
      "income.any": "कोई भी आय",
      "income.under1L": "₹1 लाख से कम",
      "income.1to3L": "₹1 लाख - ₹3 लाख",
      "income.3to8L": "₹3 लाख - ₹8 लाख",
      "income.above8L": "₹8 लाख से अधिक",
      
      "state.coming_soon": "जल्द आ रहा है",
      "state.title": "राज्य योजनाएं",
      "state.subtitle": "स्थानीय कल्याणकारी कार्यक्रमों की खोज के लिए अपने राज्य का चयन करें।"
    }
  }
};

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: localStorage.getItem('i18nextLng') || 'en',
    fallbackLng: "en",
    interpolation: {
      escapeValue: false
    }
  });

export default i18n;