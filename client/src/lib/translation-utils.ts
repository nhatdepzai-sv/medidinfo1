
export const drugCategoryTranslations: Record<string, string> = {
  // Pain and inflammation
  "Pain Reliever": "Thuốc Giảm Đau",
  "NSAID Pain Reliever": "Thuốc Giảm Đau NSAID",
  "Pain Reliever/Fever Reducer": "Thuốc Giảm Đau/Hạ Sốt",
  "NSAID/Blood Thinner": "NSAID/Thuốc Chống Đông Máu",
  "Anti-inflammatory": "Thuốc Chống Viêm",
  
  // Antibiotics
  "Penicillin Antibiotic": "Kháng Sinh Penicillin",
  "Macrolide Antibiotic": "Kháng Sinh Macrolide", 
  "Fluoroquinolone Antibiotic": "Kháng Sinh Fluoroquinolone",
  "Antibiotic": "Kháng Sinh",
  
  // Heart and blood pressure
  "ACE Inhibitor": "Thuốc Ức Chế ACE",
  "Beta Blocker": "Thuốc Chẹn Beta",
  "Statin (Cholesterol Lowering)": "Statin (Hạ Cholesterol)",
  "ARB (Angiotensin Receptor Blocker)": "Thuốc Chẹn Thụ Thể Angiotensin",
  "Calcium Channel Blocker": "Thuốc Chẹn Kênh Canxi",
  
  // Diabetes
  "Antidiabetic (Biguanide)": "Thuốc Chống Tiểu Đường (Biguanide)",
  "Antidiabetic Hormone": "Hormone Chống Tiểu Đường",
  "Long-Acting Insulin": "Insulin Tác Dụng Dài",
  "Diabetes Medication": "Thuốc Tiểu Đường",
  
  // Respiratory
  "Bronchodilator": "Thuốc Giãn Phế Quản",
  "Leukotriene Receptor Antagonist": "Thuốc Đối Kháng Thụ Thể Leukotriene",
  
  // Digestive
  "Proton Pump Inhibitor": "Thuốc Ức Chế Bơm Proton",
  "Antidiarrheal": "Thuốc Chống Tiêu Chảy",
  
  // Mental health
  "SSRI Antidepressant": "Thuốc Chống Trầm Cảm SSRI",
  "Benzodiazepine": "Benzodiazepine",
  
  // Allergy
  "Antihistamine": "Thuốc Kháng Histamine",
  "Antihistamine/Sleep Aid": "Thuốc Kháng Histamine/Hỗ Trợ Ngủ",
  
  // Women's health
  "Emergency Contraceptive": "Thuốc Tránh Thai Khẩn Cấp",
  
  // Traditional medicine
  "Traditional Medicine": "Thuốc Y Học Cổ Truyền",
  "Traditional Chinese Medicine": "Thuốc Y Học Cổ Truyền Trung Quốc",
  "Herbal Supplement / Cognitive Enhancer": "Thực Phẩm Bảo Vệ Sức Khỏe Thảo Dược / Tăng Cường Trí Nhớ",
  "Standardized Herbal Medicine": "Thuốc Thảo Dược Chuẩn Hóa"
};

export const commonMedicationTranslations: Record<string, string> = {
  // Common actions/effects
  "pain relief": "giảm đau",
  "fever reduction": "hạ sốt", 
  "inflammation": "viêm",
  "infection": "nhiễm trúng",
  "blood pressure": "huyết áp",
  "cholesterol": "cholesterol",
  "diabetes": "tiểu đường",
  "heart disease": "bệnh tim",
  "asthma": "hen suyễn",
  "allergy": "dị ứng",
  "depression": "trầm cảm",
  "anxiety": "lo âu",
  "headache": "đau đầu",
  "stomach": "dạ dày",
  "kidney": "thận",
  "liver": "gan"
};

export function translateDrugCategory(category: string): string {
  return drugCategoryTranslations[category] || category;
}

export function translateMedicationText(text: string): string {
  let translatedText = text;
  
  // Replace common medication terms
  Object.entries(commonMedicationTranslations).forEach(([english, vietnamese]) => {
    const regex = new RegExp(`\\b${english}\\b`, 'gi');
    translatedText = translatedText.replace(regex, vietnamese);
  });
  
  return translatedText;
}
