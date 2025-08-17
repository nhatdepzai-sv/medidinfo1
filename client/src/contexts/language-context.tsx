import { createContext, useContext, useState, useEffect } from "react";

type Language = "en" | "vi";

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const translations = {
  en: {
    // App
    appName: "DrugScan",
    howToUse: "How to use DrugScan",
    howToUseDesc: "Take a clear photo of the drug box or package, or manually enter the medication name. Ensure good lighting and focus on the drug name and packaging.",

    // Camera
    tapToCapture: "Tap to capture medication photo",
    alignDrugBox: "Align drug box here",
    positionDrugBox: "Position drug box clearly in frame",
    ensureGoodLighting: "Ensure good lighting",
    processingImage: "Processing Image",
    extractingText: "Extracting text and identifying medication...",
    cameraAccessDenied: "Camera access denied",
    cameraNotFound: "No camera found on device",
    cameraPermissionDenied: "Camera permission denied",
    cameraInUse: "Camera is being used by another application",
    cameraInactive: "Camera is not active",
    startCamera: "Start Camera",
    capture: "Capture",
    stop: "Stop",
    processing: "Processing...",
    captureError: "Failed to capture image",
    cameraActivated: "Camera Activated",
    readyToCapture: "Ready to capture medication images",
    cameraStopped: "Camera Stopped",
    cameraDeactivated: "Camera has been deactivated",
    cameraSwitched: "Camera Switched",
    backCamera: "Switched to back camera",
    frontCamera: "Switched to front camera",
    flashOn: "Flash On",
    flashOff: "Flash Off",
    flashEnabled: "Flash has been enabled",
    flashDisabled: "Flash has been disabled",
    flashError: "Flash Error",
    flashNotSupported: "Flash not supported on this device",
    flashNotAvailable: "Flash Not Available",
    deviceDoesNotSupportFlash: "Your device does not support flash",
    imageCaptured: "Image Captured",
    imageReadyForAnalysis: "Image is ready for analysis",
    failedToCaptureImage: "Failed to capture image",
    cameraError: "Camera Error",
    alignMedicationInFrame: "Align medication label within the frame",
    capturedImage: "Captured Image",
    download: "Download",
    clear: "Clear",
    imageDownloaded: "Image Downloaded",
    imageSavedToDevice: "Image has been saved to your device",
    startingCamera: "Starting Camera",
    pleaseWait: "Please wait while we initialize your camera",
    processingNote: "Analyzing medication name and searching our comprehensive database",

    // Search
    orEnterManually: "OR ENTER MANUALLY",
    enterMedicationName: "Enter medication name...",
    searchingFor: "Searching for medication...",
    searchSuggestion: "Type at least 3 characters to search...",
    noMedicationFound: "No medication found in database",
    noTextDetected: "No text detected in image",
    noRelevantTextFound: "No relevant text found for search",
    failedToProcessImage: "Failed to process image",
    downloadImageSuccess: "Image downloaded successfully",
    unableToControlFlash: "Unable to control camera flash",

    // Results
    medicationFound: "Medication Found",
    medicationIdentified: "Medication Identified",
    informationLoaded: "Information for {name} has been loaded.",
    successfullyIdentified: "Successfully identified {name} from the photo.",
    primaryUse: "Primary Use",
    typicalDosage: "Typical Dosage",
    adults: "Adults:",
    maxDaily: "Max daily:",
    importantWarnings: "Important Warnings",
    medicalDisclaimer: "Medical Disclaimer:",
    disclaimerText: "This information is for reference only. Always consult healthcare professionals for medical advice and proper dosage instructions.",
    save: "Save",
    share: "Share",
    saved: "Saved",
    savedToFavorites: "{name} has been saved to your favorites.",
    copiedToClipboard: "Copied to clipboard",
    medicationInfoCopied: "Medication information has been copied to your clipboard.",

    // Drug categories and types in English
    painReliever: "Pain Reliever",
    antiInflammatory: "Anti-inflammatory",
    antibiotic: "Antibiotic",
    antiviral: "Antiviral",
    bloodPressure: "Blood Pressure",
    diabetes: "Diabetes Medication",
    heartMedication: "Heart Medication",
    antihistamine: "Antihistamine",
    antidepressant: "Antidepressant",
    anxietyMedication: "Anxiety Medication",
    sleepAid: "Sleep Aid",
    stomachMedication: "Stomach Medication",
    generic: "Generic:",
    ginkgoBiloba: "Ginkgo Biloba",
    ginkgoBilobaUsage: "Ginkgo Biloba is used to treat conditions associated with impaired thinking or memory, as might occur in dementia. It is also used for leg pain caused by poor circulation (intermittent claudication) and for premenstrual syndrome (PMS).",
    ginkgoBilobaDosage: "Adults: Take 40-80 mg three times daily, or as directed by a healthcare professional. Maximum daily dose: 240 mg.",

    // Navigation
    home: "Home",
    history: "History",
    profile: "Profile",
    searchHistory: "Search History",

    // History
    photoScan: "Photo Scan",
    manualSearch: "Manual Search",
    searchQuery: "Search Query",
    notFound: "Not Found",
    viewDetails: "View Details",
    noSearchHistory: "No Search History",
    noSearchHistoryDesc: "Start identifying medications to see your search history here.",
    startScanning: "Start Scanning",

    // Errors
    searchFailed: "Search Failed",
    identificationFailed: "Identification Failed",
    searchRequired: "Search Required",
    enterMedicationToSearch: "Please enter a medication name to search.",
    medicationNotFound: "Could not find the medication. Please try a different search term.",
    couldNotIdentifyFromPhoto: "Could not identify the medication from the photo. Please try again with better lighting or manually enter the name.",
    unableToAccessCamera: "Unable to access camera. Please check permissions and try again.",
    cameraAccessError: "Unable to access camera. Please ensure camera permissions are granted.",
    unableToControlFlash: "Unable to control camera flash.",
    shareFailed: "Share failed",
    unableToShareInfo: "Unable to share medication information.",
    shareSuccess: "Share successful",
    medicationInfoShared: "Medication information shared successfully.",
    failedToLoadHistory: "Failed to Load History",
    unableToRetrieveHistory: "Unable to retrieve your search history. Please try again.",
    noImageProvided: "No image file provided",
    noTextExtracted: "No text could be extracted from the image",
    couldNotIdentifyMedication: "Could not identify this medication",
    failedToProcessImage: "Failed to process image",
    failedToSearchMedication: "Failed to search for medication",
    failedToFetchHistory: "Failed to fetch search history",
    goBack: "Go Back",

    // Translator
    translator: "Translator",
    translate: "Translate",
    // Camera interface - moved to avoid duplicates
    retakePhoto: "Retake Photo",
    downloadImage: "Download",
    confirmCapture: "Confirm",
    settings: "Settings",
    resolution: "Resolution",
    autoFocus: "Auto Focus",
    zoom: "Zoom",
    brightness: "Brightness",
    contrast: "Contrast",
    translating: "Translating...",
    sourceText: "Source Text",
    translation: "Translation",
    enterTextToTranslate: "Enter text to translate...",
    translationWillAppearHere: "Translation will appear here...",
    medicalTextTranslator: "Medical Text Translator",
    translateMedicalInfo: "Translate medical information between English and Vietnamese to better understand medication details.",
    translationFailed: "Translation Failed",
    couldNotTranslateText: "Could not translate text. Please try again.",
    // OCR and processing
    ocrNotReady: "OCR engine not ready",
    tesseractInitializationError: "Error initializing OCR engine",
    medicationNotFound: "No medication found",
    relevantTextNotFound: "No relevant text found",
    textNotDetected: "No text detected",
    scanText: "Scan Text",
    alignMedicationLabel: "Align medication label within frame",
    ensureGoodLighting: "Ensure good lighting",
    focusOnDrugName: "Focus on drug name",
    initializingCamera: "Initializing camera...",
    tryAgain: "Try Again",
    cancel: "Cancel",
    success: "Success",
    imageDownloaded: "Image downloaded successfully",
    warning: "Warning",
    info: "Info",
    error: "Error",
  },
  vi: {
    // App
    appName: "DrugScan",
    howToUse: "Cách sử dụng DrugScan",
    howToUseDesc: "Chụp ảnh rõ nét hộp thuốc hoặc bao bì, hoặc nhập tên thuốc bằng tay. Đảm bảo ánh sáng tốt và tập trung vào tên thuốc và bao bì.",

    // Camera
    tapToCapture: "Chạm để chụp ảnh thuốc",
    alignDrugBox: "Căn chỉnh hộp thuốc ở đây",
    positionDrugBox: "Đặt hộp thuốc rõ ràng trong khung hình",
    ensureGoodLighting: "Đảm bảo ánh sáng tốt",
    processingImage: "Đang Xử Lý Hình Ảnh",
    extractingText: "Đang trích xuất văn bản và nhận dạng thuốc...",
    cameraAccessDenied: "Không thể truy cập camera",
    cameraNotFound: "Không tìm thấy camera trên thiết bị",
    cameraPermissionDenied: "Quyền truy cập camera bị từ chối",
    cameraInUse: "Camera đang được sử dụng bởi ứng dụng khác",
    cameraInactive: "Camera chưa được kích hoạt",
    startCamera: "Bật Camera",
    capture: "Chụp ảnh",
    stop: "Dừng",
    processing: "Đang xử lý...",
    captureError: "Không thể chụp ảnh",
    cameraActivated: "Camera Đã Kích Hoạt",
    readyToCapture: "Sẵn sàng chụp ảnh thuốc",
    cameraStopped: "Camera Đã Dừng",
    cameraDeactivated: "Camera đã được tắt",
    cameraSwitched: "Đã Chuyển Camera",
    backCamera: "Đã chuyển sang camera sau",
    frontCamera: "Đã chuyển sang camera trước",
    flashOn: "Bật Flash",
    flashOff: "Tắt Flash",
    flashEnabled: "Flash đã được bật",
    flashDisabled: "Flash đã được tắt",
    flashError: "Lỗi Flash",
    flashNotSupported: "Thiết bị không hỗ trợ flash",
    flashNotAvailable: "Flash Không Có Sẵn",
    deviceDoesNotSupportFlash: "Thiết bị của bạn không hỗ trợ flash",
    imageCaptured: "Đã Chụp Ảnh",
    imageReadyForAnalysis: "Ảnh sẵn sàng để phân tích",
    failedToCaptureImage: "Không thể chụp ảnh",
    cameraError: "Lỗi Camera",
    alignMedicationInFrame: "Căn chỉnh nhãn thuốc trong khung hình",
    capturedImage: "Ảnh Đã Chụp",
    download: "Tải xuống",
    clear: "Xóa",
    imageDownloaded: "Đã Tải Ảnh",
    imageSavedToDevice: "Ảnh đã được lưu vào thiết bị của bạn",
    startingCamera: "Đang Khởi Động Camera",
    pleaseWait: "Vui lòng đợi trong khi chúng tôi khởi tạo camera",
    processingNote: "Đang phân tích tên thuốc và tìm kiếm trong cơ sở dữ liệu",

    // Search
    orEnterManually: "HOẶC NHẬP BẰNG TAY",
    enterMedicationName: "Nhập tên thuốc...",
    searchingFor: "Đang tìm kiếm thuốc...",
    searchSuggestion: "Nhập ít nhất 3 ký tự để tìm kiếm...",
    noMedicationFound: "Không tìm thấy thuốc trong cơ sở dữ liệu",
    noTextDetected: "Không phát hiện văn bản trong hình ảnh",
    noRelevantTextFound: "Không tìm thấy văn bản liên quan để tìm kiếm",
    failedToProcessImage: "Không thể xử lý hình ảnh",
    downloadImageSuccess: "Tải hình ảnh thành công",
    unableToControlFlash: "Không thể điều khiển đèn flash camera",

    // Results
    medicationFound: "Đã Tìm Thấy Thuốc",
    medicationIdentified: "Đã Nhận Dạng Thuốc",
    informationLoaded: "Thông tin cho {name} đã được tải.",
    successfullyIdentified: "Đã nhận dạng thành công {name} từ ảnh.",
    primaryUse: "Công Dụng Chính",
    typicalDosage: "Liều Lượng Thông Thường",
    adults: "Người lớn:",
    maxDaily: "Tối đa hàng ngày:",
    importantWarnings: "Cảnh Báo Quan Trọng",
    medicalDisclaimer: "Tuyên Bố Y Khoa:",
    disclaimerText: "Thông tin này chỉ mang tính chất tham khảo. Luôn tham khảo các chuyên gia y tế để được tư vấn y khoa và hướng dẫn liều lượng phù hợp.",
    save: "Lưu",
    share: "Chia sẻ",
    saved: "Đã Lưu",
    savedToFavorites: "{name} đã được lưu vào mục yêu thích của bạn.",
    copiedToClipboard: "Đã sao chép vào clipboard",
    medicationInfoCopied: "Thông tin thuốc đã được sao chép vào clipboard của bạn.",

    // Drug categories and types in Vietnamese  
    painReliever: "Thuốc Giảm Đau",
    antiInflammatory: "Thuốc Chống Viêm",
    antibiotic: "Kháng Sinh",
    antiviral: "Thuốc Kháng Virus",
    bloodPressure: "Thuốc Huyết Áp",
    diabetes: "Thuốc Tiểu Đường",
    heartMedication: "Thuốc Tim Mạch",
    antihistamine: "Thuốc Kháng Histamine",
    antidepressant: "Thuốc Chống Trầm Cảm",
    anxietyMedication: "Thuốc Chống Lo Âu",
    sleepAid: "Thuốc Ngủ",
    stomachMedication: "Thuốc Dạ Dày",
    generic: "Tên gốc:",
    ginkgoBiloba: "Ginkgo Biloba",
    ginkgoBilobaUsage: "Ginkgo Biloba được sử dụng để điều trị các tình trạng liên quan đến suy giảm nhận thức hoặc trí nhớ, như có thể xảy ra trong bệnh sa sút trí tuệ. Nó cũng được sử dụng cho chứng đau chân do lưu thông máu kém (hẹp động mạch ngoại biên) và hội chứng tiền kinh nguyệt (PMS).",
    ginkgoBilobaDosage: "Người lớn: Uống 40-80 mg ba lần mỗi ngày, hoặc theo chỉ dẫn của chuyên gia y tế. Liều tối đa hàng ngày: 240 mg.",

    // Navigation
    home: "Trang chủ",
    history: "Lịch sử",
    profile: "Hồ sơ",
    searchHistory: "Lịch Sử Tìm Kiếm",

    // History
    photoScan: "Quét Ảnh",
    manualSearch: "Tìm Kiếm Thủ Công",
    searchQuery: "Truy Vấn Tìm Kiếm",
    notFound: "Không Tìm Thấy",
    viewDetails: "Xem Chi Tiết",
    noSearchHistory: "Không Có Lịch Sử Tìm Kiếm",
    noSearchHistoryDesc: "Bắt đầu nhận dạng thuốc để xem lịch sử tìm kiếm của bạn ở đây.",
    startScanning: "Bắt Đầu Quét",

    // Errors
    searchFailed: "Tìm Kiếm Thất Bại",
    identificationFailed: "Nhận Dạng Thất Bại",
    searchRequired: "Cần Phải Tìm Kiếm",
    enterMedicationToSearch: "Vui lòng nhập tên thuốc để tìm kiếm.",
    medicationNotFound: "Không thể tìm thấy thuốc. Vui lòng thử một từ khóa tìm kiếm khác.",
    couldNotIdentifyFromPhoto: "Không thể nhận dạng thuốc từ ảnh. Vui lòng thử lại với ánh sáng tốt hơn hoặc nhập tên bằng tay.",
    unableToAccessCamera: "Không thể truy cập camera. Vui lòng kiểm tra quyền và thử lại.",
    cameraAccessError: "Không thể truy cập camera. Vui lòng đảm bảo quyền camera được cấp.",
    unableToControlFlash: "Không thể điều khiển đèn flash camera.",
    shareFailed: "Chia sẻ thất bại",
    unableToShareInfo: "Không thể chia sẻ thông tin thuốc.",
    shareSuccess: "Chia sẻ thành công",
    medicationInfoShared: "Thông tin thuốc đã được chia sẻ thành công.",
    failedToLoadHistory: "Không Thể Tải Lịch Sử",
    unableToRetrieveHistory: "Không thể truy xuất lịch sử tìm kiếm của bạn. Vui lòng thử lại.",
    noImageProvided: "Không có tệp hình ảnh được cung cấp",
    noTextExtracted: "Không thể trích xuất văn bản từ hình ảnh",
    couldNotIdentifyMedication: "Không thể nhận dạng thuốc này",
    imageProcessingFailed: "Không thể xử lý hình ảnh",
    medicationSearchFailed: "Không thể tìm kiếm thuốc",
    historyFetchFailed: "Không thể lấy lịch sử tìm kiếm",
    goBack: "Quay Lại",

    // Translator
    translator: "Trình Dịch",
    translate: "Dịch",
    // Camera interface - moved to avoid duplicates
    retakePhoto: "Chụp lại",
    downloadImage: "Tải xuống",
    confirmCapture: "Xác nhận",
    settings: "Cài đặt",
    resolution: "Độ phân giải",
    autoFocus: "Lấy nét tự động",
    zoom: "Phóng to",
    brightness: "Độ sáng",
    contrast: "Độ tương phản",
    translating: "Đang dịch...",
    sourceText: "Văn Bản Gốc",
    translation: "Bản Dịch",
    enterTextToTranslate: "Nhập văn bản để dịch...",
    translationWillAppearHere: "Bản dịch sẽ xuất hiện ở đây...",
    medicalTextTranslator: "Trình Dịch Văn Bản Y Khoa",
    translateMedicalInfo: "Dịch thông tin y khoa giữa tiếng Anh và tiếng Việt để hiểu rõ hơn về chi tiết thuốc.",
    translationFailed: "Dịch Thất Bại",
    couldNotTranslateText: "Không thể dịch văn bản. Vui lòng thử lại.",
    // Additions based on user request
    treatsArthritisPainAndInflammation: "Điều trị cơn đau và viêm khớp",
    typicalDosageForAdults: "Người lớn:",
    adultDosageRange: "7.5-15mg mỗi ngày",
    maximumDaily: "Tối đa hàng ngày:",
    maxDailyDosage: "15mg mỗi ngày",
    importantWarningsLabel: "Cảnh Báo Quan Trọng",
    commonWarnings: [
      "Chảy máu đường tiêu hóa",
      "Rủi ro tim mạch",
      "Các vấn đề về thận",
      "Uống cùng thức ăn"
    ],
    // Gout treatment
    goutTreatment: "Điều trị bệnh gout",
    reducesUricAcid: "Giảm acid uric trong máu",
    preventGoutAttacks: "Ngăn ngừa cơn gout",
    // Hepatitis treatment
    hepatitisTreatment: "Điều trị viêm gan",
    antiviralTherapy: "Liệu pháp kháng virus",
    liverProtection: "Bảo vệ gan",
    // Camera interface and OCR processing
    ocrNotReady: "Công cụ OCR chưa sẵn sàng",
    tesseractInitializationError: "Lỗi khởi tạo công cụ OCR",
    medicationNotFound: "Không tìm thấy thuốc",
    relevantTextNotFound: "Không tìm thấy văn bản liên quan",
    textNotDetected: "Không phát hiện văn bản",
    scanText: "Quét Văn Bản",
    alignMedicationLabel: "Căn chỉnh nhãn thuốc trong khung",
    ensureGoodLighting: "Đảm bảo ánh sáng tốt",
    focusOnDrugName: "Tập trung vào tên thuốc",
    initializingCamera: "Đang khởi tạo camera...",
    tryAgain: "Thử Lại",
    cancel: "Hủy",
    success: "Thành Công",
    imageDownloaded: "Tải ảnh thành công",
    warning: "Cảnh Báo",
    info: "Thông Tin",
    error: "Lỗi",
  }
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

interface LanguageProviderProps {
  children: React.ReactNode;
}

export function LanguageProvider({ children }: LanguageProviderProps) {
  const [language, setLanguage] = useState<Language>("en");

  useEffect(() => {
    // Detect browser language
    const browserLang = navigator.language;
    if (browserLang.startsWith("vi")) {
      setLanguage("vi");
    }

    // Load saved language preference
    const savedLang = localStorage.getItem("drugscan-language") as Language;
    if (savedLang && (savedLang === "en" || savedLang === "vi")) {
      setLanguage(savedLang);
    }
  }, []);

  const handleSetLanguage = (lang: Language) => {
    setLanguage(lang);
    localStorage.setItem("drugscan-language", lang);
  };

  const t = (key: string): string => {
    const translation = translations[language]?.[key as keyof typeof translations[typeof language]];
    return translation || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage: handleSetLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
}