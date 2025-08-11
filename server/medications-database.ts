import type { InsertMedication } from "@shared/schema";
import { fullComprehensiveDrugsDatabase } from "./comprehensive-drugs-database";

// Convert comprehensive database to insert format
const convertToInsertFormat = (meds: any[]): InsertMedication[] => {
  return meds.map(({ id, createdAt, ...rest }) => rest);
};

export const medicationsDatabase: InsertMedication[] = [
  // Legacy medications for backward compatibility
  ...convertToInsertFormat(fullComprehensiveDrugsDatabase),
  // Pain Relief & Anti-inflammatory
  {
    name: "Ibuprofen",
    nameVi: "Ibuprofen",
    genericName: "Ibuprofen",
    genericNameVi: "Ibuprofen",
    category: "NSAID Pain Reliever",
    categoryVi: "Thuốc giảm đau chống viêm NSAID",
    primaryUse: "Reduces pain, inflammation, and fever. Used for headaches, muscle aches, arthritis, menstrual cramps, and minor injuries.",
    primaryUseVi: "Giảm đau, chống viêm và hạ sốt. Dùng điều trị đau đầu, đau cơ, viêm khớp, đau bụng kinh và các chấn thương nhẹ.",
    adultDosage: "200-400mg every 4-6 hours as needed",
    adultDosageVi: "200-400mg mỗi 4-6 giờ khi cần",
    maxDosage: "1200mg per day (without medical supervision)",
    maxDosageVi: "1200mg mỗi ngày (không có giám sát y tế)",
    warnings: [
      "Do not exceed recommended dose",
      "May cause stomach bleeding",
      "Avoid if allergic to aspirin or other NSAIDs",
      "Consult doctor if taking blood thinners"
    ],
    warningsVi: [
      "Không được vượt quá liều khuyến nghị",
      "Có thể gây xuất huyết dạ dày",
      "Tránh nếu dị ứng với aspirin hoặc NSAIDs khác",
      "Tham khảo bác sĩ nếu đang dùng thuốc chống đông máu"
    ]
  },
  {
    name: "Acetaminophen",
    nameVi: "Acetaminophen (Paracetamol)",
    genericName: "Paracetamol",
    genericNameVi: "Paracetamol",
    category: "Pain Reliever/Fever Reducer",
    categoryVi: "Thuốc giảm đau/hạ sốt",
    primaryUse: "Relieves mild to moderate pain and reduces fever. Safe alternative to NSAIDs for those with stomach sensitivities.",
    primaryUseVi: "Giảm đau nhẹ đến trung bình và hạ sốt. Thay thế an toàn cho NSAIDs đối với người nhạy cảm dạ dày.",
    adultDosage: "325-650mg every 4-6 hours",
    adultDosageVi: "325-650mg mỗi 4-6 giờ",
    maxDosage: "3000mg per day",
    maxDosageVi: "3000mg mỗi ngày",
    warnings: [
      "Overdose can cause severe liver damage",
      "Check other medications for acetaminophen content",
      "Avoid alcohol while taking this medication",
      "Consult doctor if symptoms persist over 3 days"
    ],
    warningsVi: [
      "Quá liều có thể gây tổn thương gan nghiêm trọng",
      "Kiểm tra các thuốc khác có chứa acetaminophen",
      "Tránh rượu khi dùng thuốc này",
      "Tham khảo bác sĩ nếu triệu chứng kéo dài quá 3 ngày"
    ]
  },
  {
    name: "Aspirin",
    nameVi: "Aspirin",
    genericName: "Acetylsalicylic Acid",
    genericNameVi: "Acid Acetylsalicylic",
    category: "NSAID/Blood Thinner",
    categoryVi: "NSAID/Thuốc chống đông máu",
    primaryUse: "Pain relief, inflammation reduction, fever reduction, and blood clot prevention. Used for heart attack and stroke prevention.",
    primaryUseVi: "Giảm đau, giảm viêm, hạ sốt và ngăn ngừa cục máu đông. Dùng để phòng ngừa đau tim và đột quỵ.",
    adultDosage: "325-650mg every 4 hours for pain; 81mg daily for heart protection",
    adultDosageVi: "325-650mg mỗi 4 giờ để giảm đau; 81mg hàng ngày để bảo vệ tim",
    maxDosage: "4000mg per day for pain relief",
    maxDosageVi: "4000mg mỗi ngày để giảm đau",
    warnings: [
      "Increases bleeding risk",
      "Not for children under 16 (Reye's syndrome risk)",
      "May cause stomach ulcers",
      "Consult doctor before surgery"
    ],
    warningsVi: [
      "Tăng nguy cơ chảy máu",
      "Không dành cho trẻ em dưới 16 tuổi (nguy cơ hội chứng Reye)",
      "Có thể gây loét dạ dày",
      "Tham khảo bác sĩ trước khi phẫu thuật"
    ]
  },

  // Antibiotics
  {
    name: "Amoxicillin",
    nameVi: "Amoxicillin",
    genericName: "Amoxicillin",
    genericNameVi: "Amoxicillin",
    category: "Penicillin Antibiotic",
    categoryVi: "Kháng sinh Penicillin",
    primaryUse: "Treats bacterial infections including respiratory tract infections, ear infections, urinary tract infections, and skin infections.",
    primaryUseVi: "Điều trị nhiễm khuẩn bao gồm nhiễm trúng đường hô hấp, nhiễm trúng tai, nhiễm trúng đường tiết niệu và nhiễm trúng da.",
    adultDosage: "250-500mg every 8 hours or 500-875mg every 12 hours",
    adultDosageVi: "250-500mg mỗi 8 giờ hoặc 500-875mg mỗi 12 giờ",
    maxDosage: "3000mg per day",
    maxDosageVi: "3000mg mỗi ngày",
    warnings: [
      "Complete full course even if feeling better",
      "May cause allergic reactions",
      "Can reduce effectiveness of birth control pills",
      "May cause diarrhea or stomach upset"
    ],
    warningsVi: [
      "Hoàn thành liệu trình đầy đủ ngay cả khi cảm thấy khỏe hơn",
      "Có thể gây phản ứng dị ứng",
      "Có thể làm giảm hiệu quả của thuốc tránh thai",
      "Có thể gây tiêu chảy hoặc đau bụng"
    ]
  },
  {
    name: "Azithromycin",
    nameVi: "Azithromycin",
    genericName: "Azithromycin",
    genericNameVi: "Azithromycin",
    category: "Macrolide Antibiotic",
    categoryVi: "Kháng sinh Macrolide",
    primaryUse: "Treats respiratory infections, skin infections, ear infections, and sexually transmitted diseases. Z-pack antibiotic.",
    primaryUseVi: "Điều trị nhiễm trúng đường hô hấp, nhiễm trúng da, nhiễm trúng tai và các bệnh lây truyền qua đường tình dục.",
    adultDosage: "500mg on day 1, then 250mg daily for 4 days",
    adultDosageVi: "500mg vào ngày 1, sau đó 250mg hàng ngày trong 4 ngày",
    maxDosage: "500mg per day",
    maxDosageVi: "500mg mỗi ngày",
    warnings: [
      "Take on empty stomach for better absorption",
      "May cause heart rhythm changes",
      "Complete full course of treatment",
      "May interact with other medications"
    ],
    warningsVi: [
      "Uống khi đói để hấp thụ tốt hơn",
      "Có thể gây thay đổi nhịp tim",
      "Hoàn thành liệu trình điều trị đầy đủ",
      "Có thể tương tác với các thuốc khác"
    ]
  },
  {
    name: "Ciprofloxacin",
    nameVi: "Ciprofloxacin",
    genericName: "Ciprofloxacin",
    genericNameVi: "Ciprofloxacin",
    category: "Fluoroquinolone Antibiotic",
    categoryVi: "Kháng sinh Fluoroquinolone",
    primaryUse: "Treats serious bacterial infections including urinary tract infections, respiratory infections, and skin infections.",
    primaryUseVi: "Điều trị nhiễm khuẩn nghiêm trọng bao gồm nhiễm trúng đường tiết niệu, nhiễm trúng đường hô hấp và nhiễm trúng da.",
    adultDosage: "250-750mg every 12 hours",
    adultDosageVi: "250-750mg mỗi 12 giờ",
    maxDosage: "1500mg per day",
    maxDosageVi: "1500mg mỗi ngày",
    warnings: [
      "May cause tendon rupture",
      "Avoid dairy products and antacids",
      "Increase sun sensitivity",
      "May cause nerve damage in rare cases"
    ],
    warningsVi: [
      "Có thể gây đứt gân",
      "Tránh sản phẩm từ sữa và thuốc kháng acid",
      "Tăng độ nhạy cảm với ánh nắng mặt trời",
      "Có thể gây tổn thương thần kinh trong trường hợp hiếm"
    ]
  },

  // Cardiovascular
  {
    name: "Lisinopril",
    nameVi: "Lisinopril",
    genericName: "Lisinopril",
    genericNameVi: "Lisinopril",
    category: "ACE Inhibitor",
    categoryVi: "Thuốc ức chế ACE",
    primaryUse: "Treats high blood pressure and heart failure. Helps prevent kidney damage in diabetics.",
    primaryUseVi: "Điều trị huyết áp cao và suy tim. Giúp ngăn ngừa tổn thương thận ở bệnh nhân tiểu đường.",
    adultDosage: "5-40mg once daily",
    adultDosageVi: "5-40mg một lần mỗi ngày",
    maxDosage: "80mg per day",
    maxDosageVi: "80mg mỗi ngày",
    warnings: [
      "May cause persistent dry cough",
      "Can cause dizziness when standing up",
      "Monitor kidney function regularly",
      "Avoid potassium supplements"
    ],
    warningsVi: [
      "Có thể gây ho khan kéo dài",
      "Có thể gây chóng mặt khi đứng dậy",
      "Theo dõi chức năng thận thường xuyên",
      "Tránh bổ sung kali"
    ]
  },
  {
    name: "Metoprolol",
    nameVi: "Metoprolol",
    genericName: "Metoprolol",
    genericNameVi: "Metoprolol",
    category: "Beta Blocker",
    categoryVi: "Thuốc chẹn beta",
    primaryUse: "Treats high blood pressure, chest pain, and heart rhythm disorders. Reduces heart attack risk.",
    primaryUseVi: "Điều trị huyết áp cao, đau ngực và rối loạn nhịp tim. Giảm nguy cơ đau tim.",
    adultDosage: "25-100mg twice daily",
    adultDosageVi: "25-100mg hai lần mỗi ngày",
    maxDosage: "400mg per day",
    maxDosageVi: "400mg mỗi ngày",
    warnings: [
      "Do not stop suddenly (may cause rebound effects)",
      "May mask signs of low blood sugar",
      "Can worsen asthma symptoms",
      "May cause fatigue and dizziness"
    ],
    warningsVi: [
      "Không được ngừng đột ngột (có thể gây tác dụng phản hồi)",
      "Có thể che giấu dấu hiệu đường huyết thấp",
      "Có thể làm xấu đi triệu chứng hen suyễn",
      "Có thể gây mệt mỏi và chóng mặt"
    ]
  },
  {
    name: "Atorvastatin",
    nameVi: "Atorvastatin",
    genericName: "Atorvastatin",
    genericNameVi: "Atorvastatin",
    category: "Statin (Cholesterol Lowering)",
    categoryVi: "Statin (Hạ cholesterol)",
    primaryUse: "Lowers cholesterol and triglycerides to reduce risk of heart disease and stroke.",
    primaryUseVi: "Hạ cholesterol và triglyceride để giảm nguy cơ bệnh tim và đột quỵ.",
    adultDosage: "10-80mg once daily in the evening",
    adultDosageVi: "10-80mg một lần mỗi ngày vào buổi tối",
    maxDosage: "80mg per day",
    maxDosageVi: "80mg mỗi ngày",
    warnings: [
      "May cause muscle pain and weakness",
      "Avoid grapefruit juice",
      "Monitor liver function",
      "Report unexplained muscle pain immediately"
    ],
    warningsVi: [
      "Có thể gây đau và yếu cơ",
      "Tránh nước ép bưởi",
      "Theo dõi chức năng gan",
      "Báo cáo ngay lập tức nếu có đau cơ không rõ nguyên nhân"
    ]
  },

  // Diabetes
  {
    name: "Metformin",
    nameVi: "Metformin",
    genericName: "Metformin",
    genericNameVi: "Metformin",
    category: "Antidiabetic (Biguanide)",
    categoryVi: "Thuốc chống tiểu đường (Biguanide)",
    primaryUse: "Controls blood sugar in type 2 diabetes. First-line treatment for diabetes management.",
    primaryUseVi: "Kiểm soát đường huyết trong tiểu đường type 2. Điều trị hàng đầu để quản lý tiểu đường.",
    adultDosage: "500-1000mg twice daily with meals",
    adultDosageVi: "500-1000mg hai lần mỗi ngày cùng với bữa ăn",
    maxDosage: "2550mg per day",
    maxDosageVi: "2550mg mỗi ngày",
    warnings: [
      "Take with food to reduce stomach upset",
      "May cause lactic acidosis (rare but serious)",
      "Can cause vitamin B12 deficiency with long-term use",
      "Stop before surgery or contrast dye procedures"
    ],
    warningsVi: [
      "Uống cùng thức ăn để giảm rối loạn dạ dày",
      "Có thể gây nhiễm toan lactate (hiếm nhưng nghiêm trọng)",
      "Có thể gây thiếu vitamin B12 khi sử dụng lâu dài",
      "Ngừng trước phẫu thuật hoặc thủ thuật với thuốc cản quang"
    ]
  },
  {
    name: "Insulin",
    nameVi: "Insulin",
    genericName: "Human Insulin",
    genericNameVi: "Insulin người",
    category: "Antidiabetic Hormone",
    categoryVi: "Hormone chống tiểu đường",
    primaryUse: "Controls blood glucose levels in diabetes. Essential for type 1 diabetes, sometimes needed for type 2.",
    primaryUseVi: "Kiểm soát mức glucose máu trong tiểu đường. Cần thiết cho tiểu đường type 1, đôi khi cần cho type 2.",
    adultDosage: "Varies based on blood glucose levels and individual needs",
    adultDosageVi: "Thay đổi dựa trên mức glucose máu và nhu cầu cá nhân",
    maxDosage: "No fixed maximum - adjusted to patient needs",
    maxDosageVi: "Không có tối đa cố định - điều chỉnh theo nhu cầu bệnh nhân",
    warnings: [
      "Risk of severe low blood sugar (hypoglycemia)",
      "Rotate injection sites to prevent lipodystrophy",
      "Store properly (refrigerate unopened vials)",
      "Always carry glucose tablets or snacks"
    ],
    warningsVi: [
      "Nguy cơ đường huyết thấp nghiêm trọng (hạ đường huyết)",
      "Xoay vị trí tiêm để ngăn ngừa rối loạn mỡ",
      "Bảo quản đúng cách (làm lạnh lọ chưa mở)",
      "Luôn mang theo viên glucose hoặc đồ ăn nhẹ"
    ]
  },

  // Respiratory
  {
    name: "Albuterol",
    nameVi: "Albuterol",
    genericName: "Salbutamol",
    genericNameVi: "Salbutamol",
    category: "Bronchodilator",
    categoryVi: "Thuốc giãn phế quản",
    primaryUse: "Quick relief for asthma and bronchospasm. Opens airways during breathing difficulties.",
    primaryUseVi: "Giảm nhanh hen suyễn và co thắt phế quản. Mở rộng đường thở khi khó thở.",
    adultDosage: "2 puffs every 4-6 hours as needed",
    adultDosageVi: "2 nhát mỗi 4-6 giờ khi cần",
    maxDosage: "12 puffs per day",
    maxDosageVi: "12 nhát mỗi ngày",
    warnings: [
      "Overuse may worsen asthma control",
      "May cause rapid heartbeat and tremors",
      "Rinse mouth after use",
      "Seek emergency care if no improvement"
    ],
    warningsVi: [
      "Sử dụng quá mức có thể làm xấu đi kiểm soát hen suyễn",
      "Có thể gây tim đập nhanh và run",
      "Súc miệng sau khi sử dụng",
      "Tìm kiếm chăm sóc cấp cứu nếu không cải thiện"
    ]
  },
  {
    name: "Montelukast",
    nameVi: "Montelukast",
    genericName: "Montelukast",
    genericNameVi: "Montelukast",
    category: "Leukotriene Receptor Antagonist",
    categoryVi: "Thuốc đối kháng thụ thể Leukotriene",
    primaryUse: "Prevents asthma attacks and treats allergic rhinitis. Long-term asthma control medication.",
    primaryUseVi: "Ngăn ngừa các cơn hen suyễn và điều trị viêm mũi dị ứng. Thuốc kiểm soát hen suyễn dài hạn.",
    adultDosage: "10mg once daily in the evening",
    adultDosageVi: "10mg một lần mỗi ngày vào buổi tối",
    maxDosage: "10mg per day",
    maxDosageVi: "10mg mỗi ngày",
    warnings: [
      "May cause mood changes or depression",
      "Not for acute asthma attacks",
      "Monitor for behavioral changes",
      "Continue other asthma medications as prescribed"
    ],
    warningsVi: [
      "Có thể gây thay đổi tâm trạng hoặc trầm cảm",
      "Không dành cho các cơn hen suyễn cấp tính",
      "Theo dõi các thay đổi hành vi",
      "Tiếp tục các thuốc hen suyễn khác theo chỉ định"
    ]
  },

  // Gastrointestinal
  {
    name: "Omeprazole",
    nameVi: "Omeprazole",
    genericName: "Omeprazole",
    genericNameVi: "Omeprazole",
    category: "Proton Pump Inhibitor",
    categoryVi: "Thuốc ức chế bơm proton",
    primaryUse: "Treats heartburn, GERD, and stomach ulcers by reducing stomach acid production.",
    primaryUseVi: "Điều trị ợ nóng, GERD và loét dạ dày bằng cách giảm sản xuất acid dạ dày.",
    adultDosage: "20-40mg once daily before breakfast",
    adultDosageVi: "20-40mg một lần mỗi ngày trước bữa sáng",
    maxDosage: "40mg per day",
    maxDosageVi: "40mg mỗi ngày",
    warnings: [
      "Long-term use may increase infection risk",
      "May reduce absorption of vitamin B12 and magnesium",
      "Can interact with blood thinners",
      "Take before meals for best effect"
    ],
    warningsVi: [
      "Sử dụng lâu dài có thể tăng nguy cơ nhiễm trùng",
      "Có thể làm giảm hấp thụ vitamin B12 và magie",
      "Có thể tương tác với thuốc chống đông máu",
      "Uống trước bữa ăn để có hiệu quả tốt nhất"
    ]
  },
  {
    name: "Loperamide",
    nameVi: "Loperamide",
    genericName: "Loperamide",
    genericNameVi: "Loperamide",
    category: "Antidiarrheal",
    categoryVi: "Thuốc chống tiêu chảy",
    primaryUse: "Controls diarrhea by slowing intestinal movement. Provides symptomatic relief.",
    primaryUseVi: "Kiểm soát tiêu chảy bằng cách làm chậm chuyển động ruột. Cung cấp giảm triệu chứng.",
    adultDosage: "2mg initially, then 1mg after each loose stool",
    adultDosageVi: "2mg ban đầu, sau đó 1mg sau mỗi lần phân lỏng",
    maxDosage: "8mg per day",
    maxDosageVi: "8mg mỗi ngày",
    warnings: [
      "Do not use if fever or blood in stool",
      "Stop if no improvement after 2 days",
      "May cause drowsiness",
      "Not recommended for children under 2"
    ],
    warningsVi: [
      "Không sử dụng nếu có sốt hoặc máu trong phân",
      "Ngừng nếu không cải thiện sau 2 ngày",
      "Có thể gây buồn ngủ",
      "Không khuyến nghị cho trẻ em dưới 2 tuổi"
    ]
  },

  // Mental Health
  {
    name: "Sertraline",
    nameVi: "Sertraline",
    genericName: "Sertraline",
    genericNameVi: "Sertraline",
    category: "SSRI Antidepressant",
    categoryVi: "Thuốc chống trầm cảm SSRI",
    primaryUse: "Treats depression, anxiety disorders, PTSD, and obsessive-compulsive disorder.",
    primaryUseVi: "Điều trị trầm cảm, rối loạn lo âu, PTSD và rối loạn ám ảnh cưỡng chế.",
    adultDosage: "25-200mg once daily",
    adultDosageVi: "25-200mg một lần mỗi ngày",
    maxDosage: "200mg per day",
    maxDosageVi: "200mg mỗi ngày",
    warnings: [
      "May increase suicidal thoughts initially",
      "Can cause withdrawal symptoms if stopped suddenly",
      "May take 4-6 weeks to show full effect",
      "Avoid alcohol while taking"
    ],
    warningsVi: [
      "Có thể tăng ý nghĩ tự tử ban đầu",
      "Có thể gây triệu chứng cai nghiện nếu ngừng đột ngột",
      "Có thể mất 4-6 tuần để có hiệu quả đầy đủ",
      "Tránh rượu khi đang dùng"
    ]
  },
  {
    name: "Lorazepam",
    nameVi: "Lorazepam",
    genericName: "Lorazepam",
    genericNameVi: "Lorazepam",
    category: "Benzodiazepine",
    categoryVi: "Benzodiazepine",
    primaryUse: "Short-term treatment of anxiety disorders and panic attacks. Also used for seizures.",
    primaryUseVi: "Điều trị ngắn hạn rối loạn lo âu và cơn hoảng loạn. Cũng được dùng cho co giật.",
    adultDosage: "0.5-2mg 2-3 times daily as needed",
    adultDosageVi: "0.5-2mg 2-3 lần mỗi ngày khi cần",
    maxDosage: "10mg per day",
    maxDosageVi: "10mg mỗi ngày",
    warnings: [
      "Highly addictive - use only as prescribed",
      "Do not drink alcohol while taking",
      "May cause drowsiness and confusion",
      "Do not stop suddenly after prolonged use"
    ],
    warningsVi: [
      "Có tính gây nghiện cao - chỉ sử dụng theo chỉ định",
      "Không uống rượu khi đang dùng",
      "Có thể gây buồn ngủ và lú lẫn",
      "Không ngừng đột ngột sau khi sử dụng lâu dài"
    ]
  },

  // Allergy & Cold
  {
    name: "Cetirizine",
    nameVi: "Cetirizine",
    genericName: "Cetirizine",
    genericNameVi: "Cetirizine",
    category: "Antihistamine",
    categoryVi: "Thuốc kháng histamine",
    primaryUse: "Treats allergic rhinitis, hives, and other allergic reactions. Non-drowsy formula.",
    primaryUseVi: "Điều trị viêm mũi dị ứng, mày đay và các phản ứng dị ứng khác. Công thức không gây buồn ngủ.",
    adultDosage: "5-10mg once daily",
    adultDosageVi: "5-10mg một lần mỗi ngày",
    maxDosage: "10mg per day",
    maxDosageVi: "10mg mỗi ngày",
    warnings: [
      "May cause mild drowsiness in some people",
      "Avoid alcohol while taking",
      "Reduce dose if kidney problems",
      "Do not exceed recommended dose"
    ],
    warningsVi: [
      "Có thể gây buồn ngủ nhẹ ở một số người",
      "Tránh rượu khi đang dùng",
      "Giảm liều nếu có vấn đề về thận",
      "Không vượt quá liều khuyến nghị"
    ]
  },
  {
    name: "Diphenhydramine",
    nameVi: "Diphenhydramine",
    genericName: "Diphenhydramine",
    genericNameVi: "Diphenhydramine",
    category: "Antihistamine/Sleep Aid",
    categoryVi: "Thuốc kháng histamine/Hỗ trợ ngủ",
    primaryUse: "Treats allergies, motion sickness, and insomnia. Also used for cold symptoms.",
    primaryUseVi: "Điều trị dị ứng, say tàu xe và mất ngủ. Cũng được dùng cho triệu chứng cảm lạnh.",
    adultDosage: "25-50mg every 4-6 hours as needed",
    adultDosageVi: "25-50mg mỗi 4-6 giờ khi cần",
    maxDosage: "300mg per day",
    maxDosageVi: "300mg mỗi ngày",
    warnings: [
      "Causes significant drowsiness",
      "Do not drive or operate machinery",
      "May cause dry mouth and constipation",
      "Not recommended for elderly patients"
    ],
    warningsVi: [
      "Gây buồn ngủ đáng kể",
      "Không lái xe hoặc vận hành máy móc",
      "Có thể gây khô miệng và táo bón",
      "Không khuyến nghị cho bệnh nhân cao tuổi"
    ]
  },

  // Women's Health
  {
    name: "Levonorgestrel",
    nameVi: "Levonorgestrel",
    genericName: "Levonorgestrel",
    genericNameVi: "Levonorgestrel",
    category: "Emergency Contraceptive",
    categoryVi: "Thuốc tránh thai khẩn cấp",
    primaryUse: "Emergency contraception to prevent pregnancy after unprotected intercourse. Plan B.",
    primaryUseVi: "Tránh thai khẩn cấp để ngăn ngừa mang thai sau quan hệ không được bảo vệ. Plan B.",
    adultDosage: "1.5mg as a single dose within 72 hours",
    adultDosageVi: "1.5mg một liều duy nhất trong vòng 72 giờ",
    maxDosage: "1.5mg single dose",
    maxDosageVi: "1.5mg liều duy nhất",
    warnings: [
      "Most effective when taken within 24 hours",
      "Not for regular contraception",
      "May cause irregular menstrual bleeding",
      "Does not protect against STDs"
    ],
    warningsVi: [
      "Hiệu quả nhất khi dùng trong vòng 24 giờ",
      "Không dành cho tránh thai thường xuyên",
      "Có thể gây chảy máu kinh nguyệt bất thường",
      "Không bảo vệ chống lại STD"
    ]
  },

  // Vietnamese Traditional Medicine
  {
    name: "Hoạt Huyết Dưỡng Não",
    nameVi: "Hoạt Huyết Dưỡng Não",
    genericName: "Traditional Vietnamese Medicine",
    genericNameVi: "Thuốc y học cổ truyền Việt Nam",
    category: "Traditional Medicine",
    categoryVi: "Thuốc y học cổ truyền",
    primaryUse: "Improves blood circulation to the brain, treats dizziness, headaches, and memory problems.",
    primaryUseVi: "Cải thiện tuần hoàn máu não, điều trị chóng mặt, đau đầu và các vấn đề về trí nhớ.",
    adultDosage: "2-3 viên, 2-3 lần/ngày sau ăn",
    adultDosageVi: "2-3 viên, 2-3 lần/ngày sau ăn",
    maxDosage: "9 viên/ngày",
    maxDosageVi: "9 viên/ngày",
    warnings: [
      "Consult doctor if symptoms persist",
      "May interact with blood thinners",
      "Not recommended during pregnancy"
    ],
    warningsVi: [
      "Tham khảo bác sĩ nếu triệu chứng kéo dài",
      "Có thể tương tác với thuốc chống đông máu",
      "Không khuyến nghị trong thời gian mang thai"
    ]
  },
  {
    name: "An Cung Ngưu Hoàng Hoàn",
    nameVi: "An Cung Ngưu Hoàng Hoàn",
    genericName: "Traditional Chinese Medicine",
    genericNameVi: "Thuốc y học cổ truyền Trung Quốc",
    category: "Traditional Medicine",
    categoryVi: "Thuốc y học cổ truyền",
    primaryUse: "Emergency treatment for stroke, high fever, and consciousness disorders.",
    primaryUseVi: "Điều trị cấp cứu đột quỵ, sốt cao và rối loạn ý thức.",
    adultDosage: "1 viên khi cấp cứu, có thể lặp lại sau 4-6 giờ",
    adultDosageVi: "1 viên khi cấp cứu, có thể lặp lại sau 4-6 giờ",
    maxDosage: "2 viên/ngày",
    maxDosageVi: "2 viên/ngày",
    warnings: [
      "For emergency use only",
      "Seek immediate medical attention",
      "Very expensive medicine",
      "Keep refrigerated"
    ],
    warningsVi: [
      "Chỉ dùng trong trường hợp cấp cứu",
      "Tìm kiếm chăm sóc y tế ngay lập tức",
      "Thuốc rất đắt tiền",
      "Bảo quản trong tủ lạnh"
    ]
  },
  {
    name: "Ginkgo Biloba",
    nameVi: "Bạch Quả",
    genericName: "Ginkgo Biloba Extract",
    genericNameVi: "Chiết xuất lá Bạch Quả",
    category: "Herbal Supplement / Cognitive Enhancer",
    categoryVi: "Thực phẩm bảo vệ sức khỏe thảo dược / Tăng cường trí nhớ",
    primaryUse: "Improves blood circulation, memory, and cognitive function. Used for dementia, tinnitus, and peripheral artery disease. Contains standardized flavonoids and terpenoids.",
    primaryUseVi: "Cải thiện tuần hoàn máu, trí nhớ và chức năng nhận thức. Dùng cho sa sút trí tuệ, ù tai và bệnh động mạch ngoại biên. Chứa flavonoid và terpenoid chuẩn hóa.",
    adultDosage: "120-240mg daily in 2-3 divided doses with meals. Start with 40mg 3 times daily.",
    adultDosageVi: "120-240mg mỗi ngày chia 2-3 lần cùng bữa ăn. Bắt đầu với 40mg 3 lần mỗi ngày.",
    maxDosage: "240mg per day in divided doses",
    maxDosageVi: "240mg mỗi ngày chia thành nhiều lần uống",
    warnings: [
      "May increase bleeding risk - avoid with blood thinners",
      "Discontinue 2 weeks before surgery",
      "May cause headaches, dizziness, or stomach upset",
      "Effects may take 6-8 weeks to appear",
      "Not recommended during pregnancy or breastfeeding",
      "May lower seizure threshold in epileptic patients"
    ],
    warningsVi: [
      "Có thể tăng nguy cơ chảy máu - tránh dùng cùng thuốc chống đông",
      "Ngừng dùng 2 tuần trước phẫu thuật",
      "Có thể gây đau đầu, chóng mặt hoặc đau bụng",
      "Tác dụng có thể mất 6-8 tuần mới xuất hiện",
      "Không khuyến nghị sử dụng khi mang thai hoặc cho con bú",
      "Có thể làm giảm ngưỡng co giật ở bệnh nhân động kinh"
    ]
  },

  // NOTE: Above legacy medications are now supplemented by 5000+ comprehensive FDA-based medications
  // from fullComprehensiveDrugsDatabase imported above
];

// Placeholder for the actual medications array, assuming it's defined elsewhere or globally
// For the purpose of this example, let's define a simple 'medications' array.
// In a real scenario, this would likely be 'medicationsDatabase' itself or a processed version.
const medications = medicationsDatabase;

export async function findMedicationByText(searchText: string): Promise<Medication | null> {
  const normalizedSearch = searchText.toLowerCase().trim();

  return medications.find(med => {
    const nameMatch = med.name.toLowerCase().includes(normalizedSearch);
    const genericMatch = med.genericName && med.genericName.toLowerCase().includes(normalizedSearch);
    const vnNameMatch = med.nameVi && med.nameVi.toLowerCase().includes(normalizedSearch);
    const vnGenericMatch = med.genericNameVi && med.genericNameVi.toLowerCase().includes(normalizedSearch);

    return nameMatch || genericMatch || vnNameMatch || vnGenericMatch;
  }) || null;
}

// Simple Levenshtein distance function
function levenshteinDistance(str1: string, str2: string): number {
  const matrix = Array(str2.length + 1).fill(null).map(() => Array(str1.length + 1).fill(null));

  for (let i = 0; i <= str1.length; i++) matrix[0][i] = i;
  for (let j = 0; j <= str2.length; j++) matrix[j][0] = j;

  for (let j = 1; j <= str2.length; j++) {
    for (let i = 1; i <= str1.length; i++) {
      const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1;
      matrix[j][i] = Math.min(
        matrix[j][i - 1] + 1, // deletion
        matrix[j - 1][i] + 1, // insertion
        matrix[j - 1][i - 1] + indicator // substitution
      );
    }
  }

  return matrix[str2.length][str1.length];
}

export async function findMedicationByFuzzyMatch(searchText: string): Promise<Medication | null> {
  const normalizedSearch = searchText.toLowerCase().trim();

  if (normalizedSearch.length < 3) return null;

  let bestMatch: Medication | null = null;
  let bestScore = Infinity;
  const maxDistance = Math.floor(normalizedSearch.length * 0.3); // Allow 30% difference

  for (const med of medications) {
    const candidates = [
      med.name.toLowerCase(),
      med.genericName?.toLowerCase() || '',
      med.nameVi?.toLowerCase() || '',
      med.genericNameVi?.toLowerCase() || ''
    ].filter(name => name.length > 0);

    for (const candidate of candidates) {
      // Check for partial matches first
      if (candidate.includes(normalizedSearch) || normalizedSearch.includes(candidate)) {
        return med;
      }

      // Calculate edit distance
      const distance = levenshteinDistance(normalizedSearch, candidate);
      const similarity = 1 - (distance / Math.max(normalizedSearch.length, candidate.length));

      if (distance <= maxDistance && similarity > 0.6 && distance < bestScore) {
        bestMatch = med;
        bestScore = distance;
      }
    }
  }

  return bestMatch;
}

export async function findMedicationByPartialMatch(searchText: string): Promise<Medication | null> {
  const normalizedSearch = searchText.toLowerCase().trim();

  if (normalizedSearch.length < 4) return null;

  // Score medications by how well they match
  const scoredMedications = medications.map(med => {
    const candidates = [
      { name: med.name.toLowerCase(), weight: 1.0 },
      { name: med.genericName?.toLowerCase() || '', weight: 0.9 },
      { name: med.nameVi?.toLowerCase() || '', weight: 0.8 },
      { name: med.genericNameVi?.toLowerCase() || '', weight: 0.7 }
    ].filter(c => c.name.length > 0);

    let bestScore = 0;

    for (const candidate of candidates) {
      let score = 0;
      
      // Exact substring match gets highest score
      if (candidate.name.includes(normalizedSearch)) {
        score = 1.0 * candidate.weight;
      }
      // Reverse check - search term contains medication name
      else if (normalizedSearch.includes(candidate.name)) {
        score = 0.9 * candidate.weight;
      }
      // Check if words start with the search term
      else if (candidate.name.startsWith(normalizedSearch)) {
        score = 0.8 * candidate.weight;
      }
      // Check word boundaries
      else if (new RegExp(`\\b${normalizedSearch}`, 'i').test(candidate.name)) {
        score = 0.7 * candidate.weight;
      }

      bestScore = Math.max(bestScore, score);
    }

    return { medication: med, score: bestScore };
  });

  // Return the highest scoring medication if it meets minimum threshold
  const sorted = scoredMedications
    .filter(item => item.score > 0.5)
    .sort((a, b) => b.score - a.score);

  return sorted.length > 0 ? sorted[0].medication : null;
}