"use client";
import { useState } from "react";
import { useTranslation } from "react-i18next";


export default function ContactForm({ locale }) {
  const { t } = useTranslation('contact');
  const isRTL = locale === 'ar';

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  });

  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [submitStatus, setSubmitStatus] = useState(null);

  const validateField = (name, value) => {
    switch (name) {
      case "name":
        return value.trim().length < 2
          ? t('contactForm.errors.name')
          : "";
      case "email":
        return !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
          ? t('contactForm.errors.email')
          : "";
      case "subject":
        return value.trim().length < 5
          ? t('contactForm.errors.subject')
          : "";
      case "message":
        return value.trim().length < 10
          ? t('contactForm.errors.message')
          : "";
      default:
        return "";
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (touched[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: validateField(name, value),
      }));
    }
  };

  const handleBlur = (e) => {
    const { name, value } = e.target;
    setTouched((prev) => ({ ...prev, [name]: true }));
    setErrors((prev) => ({
      ...prev,
      [name]: validateField(name, value),
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const newErrors = {};
    Object.keys(formData).forEach((key) => {
      const error = validateField(key, formData[key]);
      if (error) newErrors[key] = error;
    });

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      setTouched(
        Object.keys(formData).reduce(
          (acc, key) => ({ ...acc, [key]: true }),
          {}
        )
      );
      return;
    }

    setSubmitStatus("submitting");

    try {
      await new Promise((resolve) => setTimeout(resolve, 1500));
      setSubmitStatus("success");
      setFormData({ name: "", email: "", subject: "", message: "" });
      setTouched({});
      setTimeout(() => setSubmitStatus(null), 3000);
    } catch (error) {
      setSubmitStatus("error");
      setTimeout(() => setSubmitStatus(null), 3000);
    }
  };

  const getInputClassName = (fieldName) => {
    const baseClasses = `w-full px-4 py-3 rounded-lg  
      bg-white dark:bg-gray-800 
      text-gray-900 dark:text-white 
      placeholder-gray-500 dark:placeholder-gray-400 
      border border-gray-200 dark:border-gray-700
      focus:border-agri-500 dark:focus:border-agri-400`;

    const errorClasses =
      touched[fieldName] && errors[fieldName]
        ? "border-red-500 dark:border-red-500/50 focus:border-red-500 dark:focus:border-red-400 focus:ring-red-500/20 dark:focus:ring-red-400/10"
        : "focus:ring-agri-500/20 dark:focus:ring-agri-400/10";

    return `${baseClasses} backdrop-blur-sm focus:outline-none focus:ring-4 ${errorClasses}`;
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 relative" dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Success Message */}
      {submitStatus === "success" && (
        <div className="absolute inset-0 flex items-center justify-center bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm rounded-2xl z-10 animate-fade-in">
          <div className="text-center p-6">
            <div className="w-16 h-16 bg-agri-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg
                className="w-8 h-8 text-agri-600 dark:text-agri-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              {t('contactForm.success.title')}
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              {t('contactForm.success.message')}
            </p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Name Field */}
        <div className="relative group">
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            onBlur={handleBlur}
            placeholder={t('contactForm.placeholders.name')}
            className={getInputClassName("name")}
          />
          {touched.name && errors.name && (
            <p className={`absolute -bottom-6 ${isRTL ? 'right-0' : 'left-0'} text-red-600 dark:text-red-400 text-sm animate-slide-up`}>
              {errors.name}
            </p>
          )}
        </div>

        {/* Email Field */}
        <div className="relative group">
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            onBlur={handleBlur}
            placeholder={t('contactForm.placeholders.email')}
            className={getInputClassName("email")}
          />
          {touched.email && errors.email && (
            <p className={`absolute -bottom-6 ${isRTL ? 'right-0' : 'left-0'} text-red-600 dark:text-red-400 text-sm animate-slide-up`}>
              {errors.email}
            </p>
          )}
        </div>
      </div>

      {/* Subject Field */}
      <div className="relative group">
        <input
          type="text"
          name="subject"
          value={formData.subject}
          onChange={handleChange}
          onBlur={handleBlur}
          placeholder={t('contactForm.placeholders.subject')}
          className={getInputClassName("subject")}
        />
        {touched.subject && errors.subject && (
          <p className={`absolute -bottom-6 ${isRTL ? 'right-0' : 'left-0'} text-red-600 dark:text-red-400 text-sm animate-slide-up`}>
            {errors.subject}
          </p>
        )}
      </div>

      {/* Message Field */}
      <div className="relative group">
        <textarea
          name="message"
          value={formData.message}
          onChange={handleChange}
          onBlur={handleBlur}
          placeholder={t('contactForm.placeholders.message')}
          rows={6}
          className={getInputClassName("message")}
        />
        {touched.message && errors.message && (
          <p className={`absolute -bottom-6 ${isRTL ? 'right-0' : 'left-0'} text-red-600 dark:text-red-400 text-sm animate-slide-up`}>
            {errors.message}
          </p>
        )}
      </div>

      {/* Submit Button */}
      <button
        type="submit"
        disabled={submitStatus === "submitting"}
        className={`w-full py-4 px-6 rounded-xl font-semibold text-lg 
          relative overflow-hidden group  
          ${submitStatus === "submitting"
            ? "bg-gray-400 dark:bg-gray-600 cursor-not-allowed"
            : "bg-gradient-to-r from-agri-600 to-agri-500 hover:from-agri-500 hover:to-agri-400 dark:from-agri-500 dark:to-agri-400 dark:hover:from-agri-400 dark:hover:to-agri-300"
          }
          hover:shadow-lg hover:shadow-agri-500/25 dark:hover:shadow-agri-400/25`}
      >
        <div className="absolute inset-0 w-full h-full  scale-0 group-hover:scale-100">
          <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-agri-500 to-agri-400 dark:from-agri-400 dark:to-agri-300 blur-lg" />
        </div>
        <div className="relative flex items-center justify-center gap-2 text-white">
          {submitStatus === "submitting" ? (
            <>
              <svg
                className="animate-spin h-5 w-5"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
              {t('contactForm.submitting')}
            </>
          ) : (
            t('contactForm.submit')
          )}
        </div>
      </button>
    </form>
  );
}
