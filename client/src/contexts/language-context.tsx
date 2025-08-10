
import React, { createContext, useContext, useState, useEffect } from "react";

type Language = "en" | "vi";

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const translations = {
  en: {
    // App
    appName: "MedScan",
    scanMedication: "Scan Medication",
    manualSearch: "Manual Search", 
    searchHistory: "Search History",
    profile: "Profile",
    settings: "Settings",
    language: "Language",
    english: "English",
    vietnamese: "Tiếng Việt",
    
    // Home screen
    welcome: "Welcome to MedScan",
    welcomeMessage: "Scan medication labels or search manually to get detailed information",
    startScanning: "Start Scanning",
    searchManually: "Search Manually",
    recentSearches: "Recent Searches",
    noRecentSearches: "No recent searches",
    
    // Search
    searchPlaceholder: "Enter medication name...",
    search: "Search",
    searching: "Searching...",
    searchResults: "Search Results",
    noResults: "No results found",
    tryDifferentKeywords: "Try different keywords",
    medicationFound: "Medication Found",
    medicationNotFound: "Medication not found",
    searchFailed: "Search failed",
    informationLoaded: "Information loaded for {name}",
    
    // Camera
    camera: "Camera",
    takePhoto: "Take Photo",
    retakePhoto: "Retake Photo",
    usePhoto: "Use Photo",
    cameraAccessError: "Camera access error. Please check permissions.",
    ensureGoodLighting: "Ensure good lighting and focus",
    alignDrugBox: "Align medication label here",
    processing: "Processing...",
    retry: "Retry",
    close: "Close",
    
    // Medication details
    medicationDetails: "Medication Details",
    genericName: "Generic Name",
    category: "Category", 
    primaryUse: "Primary Use",
    dosage: "Dosage",
    adultDosage: "Adult Dosage",
    maxDosage: "Maximum Dosage",
    warnings: "Warnings",
    sideEffects: "Side Effects",
    contraindications: "Contraindications",
    
    // History
    searchHistory: "Search History",
    noSearchHistory: "No search history",
    noSearchHistoryDesc: "Your medication searches will appear here",
    photoScan: "Photo Scan",
    manualSearch: "Manual Search",
    searchQuery: "Search Query",
    notFound: "Not Found",
    viewDetails: "View Details",
    failedToLoadHistory: "Failed to load history",
    unableToRetrieveHistory: "Unable to retrieve search history",
    noSearchResults: "No search results",
    
    // Translation
    translator: "Translator",
    translateMedicalInfo: "Translate medical information between English and Vietnamese",
    enterTextToTranslate: "Enter text to translate...",
    translateFrom: "Translate from",
    translateTo: "Translate to",
    translate: "Translate",
    translating: "Translating...",
    translation: "Translation",
    originalText: "Original Text",
    translatedText: "Translated Text",
    couldNotTranslateText: "Could not translate text. Please try again.",
    
    // OCR and processing
    analyzingImage: "Analyzing image...",
    ocrNotReady: "OCR engine not ready",
    tesseractInitializationError: "Error initializing OCR engine",
    noMedicationFound: "No medication found",
    cancel: "Cancel",
    
    // Profile
    profileSettings: "Profile Settings",
    preferences: "Preferences",
    about: "About",
    version: "Version",
    
    // Common
    loading: "Loading...",
    error: "Error",
    success: "Success",
    confirm: "Confirm",
    back: "Back",
    next: "Next",
    done: "Done",
    save: "Save",
    edit: "Edit",
    delete: "Delete",
    share: "Share",
    copy: "Copy",
    copied: "Copied!",
  },
  vi: {
    // App
    appName: "MedScan",
    scanMedication: "Quét Thuốc",
    manualSearch: "Tìm Kiếm Thủ Công",
    searchHistory: "Lịch Sử Tìm Kiếm", 
    profile: "Hồ Sơ",
    settings: "Cài Đặt",
    language: "Ngôn Ngữ",
    english: "English",
    vietnamese: "Tiếng Việt",
    
    // Home screen
    welcome: "Chào Mừng Đến Với MedScan",
    welcomeMessage: "Quét nhãn thuốc hoặc tìm kiếm thủ công để nhận thông tin chi tiết",
    startScanning: "Bắt Đầu Quét",
    searchManually: "Tìm Kiếm Thủ Công",
    recentSearches: "Tìm Kiếm Gần Đây",
    noRecentSearches: "Không có tìm kiếm gần đây",
    
    // Search
    searchPlaceholder: "Nhập tên thuốc...",
    search: "Tìm Kiếm",
    searching: "Đang tìm kiếm...",
    searchResults: "Kết Quả Tìm Kiếm",
    noResults: "Không tìm thấy kết quả",
    tryDifferentKeywords: "Thử từ khóa khác",
    medicationFound: "Đã Tìm Thấy Thuốc",
    medicationNotFound: "Không tìm thấy thuốc",
    searchFailed: "Tìm kiếm thất bại",
    informationLoaded: "Đã tải thông tin cho {name}",
    
    // Camera
    camera: "Camera",
    takePhoto: "Chụp Ảnh", 
    retakePhoto: "Chụp Lại",
    usePhoto: "Sử Dụng Ảnh",
    cameraAccessError: "Lỗi truy cập camera. Vui lòng kiểm tra quyền.",
    ensureGoodLighting: "Đảm bảo ánh sáng tốt và lấy nét",
    alignDrugBox: "Căn chỉnh nhãn thuốc tại đây",
    processing: "Đang xử lý...",
    retry: "Thử Lại",
    close: "Đóng",
    
    // Medication details
    medicationDetails: "Chi Tiết Thuốc",
    genericName: "Tên Gốc",
    category: "Danh Mục",
    primaryUse: "Công Dụng Chính",
    dosage: "Liều Lượng",
    adultDosage: "Liều Người Lớn",
    maxDosage: "Liều Tối Đa", 
    warnings: "Cảnh Báo",
    sideEffects: "Tác Dụng Phụ",
    contraindications: "Chống Chỉ Định",
    
    // History
    searchHistory: "Lịch Sử Tìm Kiếm",
    noSearchHistory: "Không có lịch sử tìm kiếm",
    noSearchHistoryDesc: "Các tìm kiếm thuốc của bạn sẽ xuất hiện tại đây",
    photoScan: "Quét Ảnh",
    manualSearch: "Tìm Kiếm Thủ Công",
    searchQuery: "Truy Vấn Tìm Kiếm",
    notFound: "Không Tìm Thấy",
    viewDetails: "Xem Chi Tiết",
    failedToLoadHistory: "Không thể tải lịch sử",
    unableToRetrieveHistory: "Không thể truy xuất lịch sử tìm kiếm",
    noSearchResults: "Không có kết quả tìm kiếm",
    
    // Translation
    translator: "Dịch Thuật",
    translateMedicalInfo: "Dịch thông tin y tế giữa tiếng Anh và tiếng Việt",
    enterTextToTranslate: "Nhập văn bản để dịch...",
    translateFrom: "Dịch từ",
    translateTo: "Dịch sang",
    translate: "Dịch",
    translating: "Đang dịch...",
    translation: "Bản Dịch",
    originalText: "Văn Bản Gốc",
    translatedText: "Văn Bản Đã Dịch",
    couldNotTranslateText: "Không thể dịch văn bản. Vui lòng thử lại.",
    
    // OCR and processing
    analyzingImage: "Đang phân tích hình ảnh...",
    ocrNotReady: "Công cụ OCR chưa sẵn sàng",
    tesseractInitializationError: "Lỗi khởi tạo công cụ OCR",
    noMedicationFound: "Không tìm thấy thuốc",
    cancel: "Hủy",
    
    // Profile
    profileSettings: "Cài Đặt Hồ Sơ",
    preferences: "Tùy Chọn",
    about: "Về Ứng Dụng",
    version: "Phiên Bản",
    
    // Common
    loading: "Đang tải...",
    error: "Lỗi",
    success: "Thành Công",
    confirm: "Xác Nhận",
    back: "Quay Lại",
    next: "Tiếp Theo",
    done: "Hoàn Thành",
    save: "Lưu",
    edit: "Chỉnh Sửa",
    delete: "Xóa",
    share: "Chia Sẻ",
    copy: "Sao Chép",
    copied: "Đã sao chép!",
  }
};

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguage] = useState<Language>(() => {
    const saved = localStorage.getItem("language");
    return (saved as Language) || "en";
  });

  useEffect(() => {
    localStorage.setItem("language", language);
  }, [language]);

  const t = (key: string): string => {
    const translation = translations[language][key as keyof typeof translations[typeof language]];
    return translation || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage(): LanguageContextType {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
}
