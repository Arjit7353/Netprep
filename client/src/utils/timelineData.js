// client/src/utils/timelineData.js
// ═══════════════════════════════════════════════════════════════════════════════
// INTERACTIVE HISTORY TIMELINE DATA — UGC NET History Paper 2 Aligned
// Comprehensive bilingual (Hindi/English) dataset of Indian History events
// ═══════════════════════════════════════════════════════════════════════════════

export const ERAS = [
  { id: 'ancient', name: 'Ancient India', nameHi: 'प्राचीन भारत', color: '#d97706', startYear: -3300, endYear: 600 },
  { id: 'early_medieval', name: 'Early Medieval', nameHi: 'पूर्व मध्यकालीन', color: '#059669', startYear: 600, endYear: 1200 },
  { id: 'medieval', name: 'Medieval India', nameHi: 'मध्यकालीन भारत', color: '#7c3aed', startYear: 1200, endYear: 1757 },
  { id: 'modern', name: 'Modern India', nameHi: 'आधुनिक भारत', color: '#dc2626', startYear: 1757, endYear: 1947 },
  { id: 'historiography', name: 'Historiography', nameHi: 'इतिहास लेखन', color: '#2563eb', startYear: -500, endYear: 2000 },
];

export const DYNASTIES = [
  { id: 'd1', name: 'Maurya Dynasty', nameHi: 'मौर्य वंश', startYear: -322, endYear: -185, founder: 'Chandragupta Maurya', founderHi: 'चंद्रगुप्त मौर्य', capital: 'Pataliputra', era: 'ancient' },
  { id: 'd2', name: 'Gupta Dynasty', nameHi: 'गुप्त वंश', startYear: 320, endYear: 550, founder: 'Sri Gupta', founderHi: 'श्री गुप्त', capital: 'Pataliputra', era: 'ancient' },
  { id: 'd3', name: 'Kushan Dynasty', nameHi: 'कुषाण वंश', startYear: 30, endYear: 375, founder: 'Kujula Kadphises', founderHi: 'कुजुल कडफिसेस', capital: 'Purushapura', era: 'ancient' },
  { id: 'd4', name: 'Chola Dynasty', nameHi: 'चोल वंश', startYear: 848, endYear: 1279, founder: 'Vijayalaya', founderHi: 'विजयालय', capital: 'Thanjavur', era: 'early_medieval' },
  { id: 'd5', name: 'Pallava Dynasty', nameHi: 'पल्लव वंश', startYear: 275, endYear: 897, founder: 'Simhavishnu', founderHi: 'सिंहविष्णु', capital: 'Kanchipuram', era: 'early_medieval' },
  { id: 'd6', name: 'Chalukya Dynasty', nameHi: 'चालुक्य वंश', startYear: 543, endYear: 753, founder: 'Pulakeshin I', founderHi: 'पुलकेशिन I', capital: 'Badami', era: 'early_medieval' },
  { id: 'd7', name: 'Pratihara Dynasty', nameHi: 'प्रतिहार वंश', startYear: 730, endYear: 1036, founder: 'Nagabhata I', founderHi: 'नागभट I', capital: 'Kannauj', era: 'early_medieval' },
  { id: 'd8', name: 'Delhi Sultanate', nameHi: 'दिल्ली सल्तनत', startYear: 1206, endYear: 1526, founder: 'Qutb-ud-din Aibak', founderHi: 'कुतुबुद्दीन ऐबक', capital: 'Delhi', era: 'medieval' },
  { id: 'd9', name: 'Mughal Empire', nameHi: 'मुगल साम्राज्य', startYear: 1526, endYear: 1857, founder: 'Babur', founderHi: 'बाबर', capital: 'Agra/Delhi', era: 'medieval' },
  { id: 'd10', name: 'Vijayanagara Empire', nameHi: 'विजयनगर साम्राज्य', startYear: 1336, endYear: 1646, founder: 'Harihara I & Bukka I', founderHi: 'हरिहर I और बुक्का I', capital: 'Hampi', era: 'medieval' },
  { id: 'd11', name: 'Maratha Empire', nameHi: 'मराठा साम्राज्य', startYear: 1674, endYear: 1818, founder: 'Shivaji Maharaj', founderHi: 'शिवाजी महाराज', capital: 'Raigad', era: 'medieval' },
];

export const TIMELINE_EVENTS = [
  // ═══ ANCIENT INDIA ═══
  { id: 'e1', year: -3300, title: 'Indus Valley Civilization begins', titleHi: 'सिंधु घाटी सभ्यता की शुरुआत', era: 'ancient', importance: 5, category: 'civilization' },
  { id: 'e2', year: -2600, title: 'Mature Harappan Phase', titleHi: 'परिपक्व हड़प्पा चरण', era: 'ancient', importance: 5, category: 'civilization' },
  { id: 'e3', year: -1900, title: 'Decline of Indus Valley Civilization', titleHi: 'सिंधु घाटी सभ्यता का पतन', era: 'ancient', importance: 4, category: 'civilization' },
  { id: 'e4', year: -1500, title: 'Vedic Period begins (Rigveda composed)', titleHi: 'वैदिक काल की शुरुआत (ऋग्वेद रचना)', era: 'ancient', importance: 5, category: 'culture' },
  { id: 'e5', year: -600, title: 'Rise of Mahajanapadas (16 kingdoms)', titleHi: 'महाजनपदों का उदय (16 राज्य)', era: 'ancient', importance: 5, category: 'political' },
  { id: 'e6', year: -563, title: 'Birth of Gautama Buddha', titleHi: 'गौतम बुद्ध का जन्म', era: 'ancient', importance: 5, category: 'religion' },
  { id: 'e7', year: -540, title: 'Birth of Mahavira', titleHi: 'महावीर का जन्म', era: 'ancient', importance: 4, category: 'religion' },
  { id: 'e8', year: -327, title: 'Alexander invades India', titleHi: 'सिकंदर का भारत आक्रमण', era: 'ancient', importance: 5, category: 'military' },
  { id: 'e9', year: -322, title: 'Chandragupta Maurya founds Maurya Empire', titleHi: 'चंद्रगुप्त मौर्य ने मौर्य साम्राज्य की स्थापना की', era: 'ancient', importance: 5, category: 'political' },
  { id: 'e10', year: -305, title: 'Seleucid-Mauryan War; Treaty with Seleucus', titleHi: 'सेल्यूकस-मौर्य युद्ध; सेल्यूकस से संधि', era: 'ancient', importance: 4, category: 'military' },
  { id: 'e11', year: -268, title: 'Ashoka becomes Emperor', titleHi: 'अशोक सम्राट बने', era: 'ancient', importance: 5, category: 'political' },
  { id: 'e12', year: -261, title: 'Kalinga War — Ashoka converts to Buddhism', titleHi: 'कलिंग युद्ध — अशोक ने बौद्ध धर्म अपनाया', era: 'ancient', importance: 5, category: 'military' },
  { id: 'e13', year: -185, title: 'Fall of Maurya Empire; Shunga Dynasty', titleHi: 'मौर्य साम्राज्य का पतन; शुंग वंश', era: 'ancient', importance: 4, category: 'political' },
  { id: 'e14', year: 78, title: 'Kanishka I begins Shaka Era', titleHi: 'कनिष्क I ने शक संवत शुरू किया', era: 'ancient', importance: 5, category: 'political' },
  { id: 'e15', year: 320, title: 'Gupta Empire founded by Chandragupta I', titleHi: 'चंद्रगुप्त I ने गुप्त साम्राज्य की स्थापना', era: 'ancient', importance: 5, category: 'political' },
  { id: 'e16', year: 335, title: 'Samudragupta — "Napoleon of India"', titleHi: 'समुद्रगुप्त — "भारत का नेपोलियन"', era: 'ancient', importance: 5, category: 'political' },
  { id: 'e17', year: 380, title: 'Chandragupta II (Vikramaditya) — Golden Age', titleHi: 'चंद्रगुप्त II (विक्रमादित्य) — स्वर्ण युग', era: 'ancient', importance: 5, category: 'culture' },
  { id: 'e18', year: 405, title: 'Fa-Hien visits India', titleHi: 'फाह्यान का भारत आगमन', era: 'ancient', importance: 4, category: 'culture' },
  { id: 'e19', year: 455, title: 'Huna invasions begin', titleHi: 'हूण आक्रमण शुरू', era: 'ancient', importance: 3, category: 'military' },
  { id: 'e20', year: 510, title: 'Decline of Gupta Empire', titleHi: 'गुप्त साम्राज्य का पतन', era: 'ancient', importance: 4, category: 'political' },

  // ═══ EARLY MEDIEVAL ═══
  { id: 'e21', year: 606, title: 'Harsha ascends throne of Kannauj', titleHi: 'हर्षवर्धन कन्नौज का सम्राट बना', era: 'early_medieval', importance: 5, category: 'political' },
  { id: 'e22', year: 630, title: 'Hiuen Tsang visits India', titleHi: 'ह्वेनसांग का भारत आगमन', era: 'early_medieval', importance: 4, category: 'culture' },
  { id: 'e23', year: 647, title: 'Death of Harshavardhana', titleHi: 'हर्षवर्धन की मृत्यु', era: 'early_medieval', importance: 4, category: 'political' },
  { id: 'e24', year: 712, title: 'Arab invasion of Sindh (Muhammad bin Qasim)', titleHi: 'सिंध पर अरब आक्रमण (मुहम्मद बिन कासिम)', era: 'early_medieval', importance: 5, category: 'military' },
  { id: 'e25', year: 753, title: 'Rashtrakuta Dynasty established', titleHi: 'राष्ट्रकूट वंश की स्थापना', era: 'early_medieval', importance: 4, category: 'political' },
  { id: 'e26', year: 985, title: 'Rajaraja Chola I ascends throne', titleHi: 'राजराज चोल I का राज्याभिषेक', era: 'early_medieval', importance: 5, category: 'political' },
  { id: 'e27', year: 1000, title: 'Mahmud of Ghazni raids India (first raid 1000 CE)', titleHi: 'महमूद गजनवी का भारत पर आक्रमण (प्रथम 1000 ई.)', era: 'early_medieval', importance: 5, category: 'military' },
  { id: 'e28', year: 1014, title: 'Rajendra Chola I — Naval expeditions to SE Asia', titleHi: 'राजेंद्र चोल I — दक्षिण-पूर्व एशिया नौसेनिक अभियान', era: 'early_medieval', importance: 5, category: 'military' },
  { id: 'e29', year: 1025, title: 'Mahmud of Ghazni raids Somnath Temple', titleHi: 'महमूद गजनवी का सोमनाथ मंदिर पर आक्रमण', era: 'early_medieval', importance: 5, category: 'military' },
  { id: 'e30', year: 1191, title: 'First Battle of Tarain', titleHi: 'तराइन का प्रथम युद्ध', era: 'early_medieval', importance: 5, category: 'military' },
  { id: 'e31', year: 1192, title: 'Second Battle of Tarain — Ghori defeats Prithviraj', titleHi: 'तराइन का द्वितीय युद्ध — घोरी ने पृथ्वीराज को हराया', era: 'early_medieval', importance: 5, category: 'military' },

  // ═══ MEDIEVAL INDIA ═══
  { id: 'e32', year: 1206, title: 'Delhi Sultanate established (Slave Dynasty)', titleHi: 'दिल्ली सल्तनत की स्थापना (गुलाम वंश)', era: 'medieval', importance: 5, category: 'political' },
  { id: 'e33', year: 1290, title: 'Khalji Dynasty founded by Jalaluddin Khalji', titleHi: 'जलालुद्दीन खिलजी ने खिलजी वंश की स्थापना', era: 'medieval', importance: 4, category: 'political' },
  { id: 'e34', year: 1296, title: 'Alauddin Khalji becomes Sultan', titleHi: 'अलाउद्दीन खिलजी सुल्तान बना', era: 'medieval', importance: 5, category: 'political' },
  { id: 'e35', year: 1320, title: 'Tughlaq Dynasty founded', titleHi: 'तुगलक वंश की स्थापना', era: 'medieval', importance: 4, category: 'political' },
  { id: 'e36', year: 1336, title: 'Vijayanagara Empire founded', titleHi: 'विजयनगर साम्राज्य की स्थापना', era: 'medieval', importance: 5, category: 'political' },
  { id: 'e37', year: 1398, title: 'Timur invades Delhi', titleHi: 'तैमूर का दिल्ली पर आक्रमण', era: 'medieval', importance: 5, category: 'military' },
  { id: 'e38', year: 1451, title: 'Lodi Dynasty founded', titleHi: 'लोदी वंश की स्थापना', era: 'medieval', importance: 3, category: 'political' },
  { id: 'e39', year: 1469, title: 'Birth of Guru Nanak', titleHi: 'गुरु नानक का जन्म', era: 'medieval', importance: 4, category: 'religion' },
  { id: 'e40', year: 1498, title: 'Vasco da Gama arrives in Calicut', titleHi: 'वास्को डी गामा कालीकट पहुंचा', era: 'medieval', importance: 5, category: 'trade' },
  { id: 'e41', year: 1526, title: 'First Battle of Panipat — Babur founds Mughal Empire', titleHi: 'पानीपत का प्रथम युद्ध — बाबर ने मुगल साम्राज्य की स्थापना', era: 'medieval', importance: 5, category: 'military' },
  { id: 'e42', year: 1556, title: 'Second Battle of Panipat — Akbar defeats Hemu', titleHi: 'पानीपत का द्वितीय युद्ध — अकबर ने हेमू को हराया', era: 'medieval', importance: 5, category: 'military' },
  { id: 'e43', year: 1565, title: 'Battle of Talikota — Fall of Vijayanagara', titleHi: 'तालिकोटा का युद्ध — विजयनगर का पतन', era: 'medieval', importance: 5, category: 'military' },
  { id: 'e44', year: 1600, title: 'East India Company founded', titleHi: 'ईस्ट इंडिया कंपनी की स्थापना', era: 'medieval', importance: 5, category: 'trade' },
  { id: 'e45', year: 1628, title: 'Shah Jahan becomes Emperor', titleHi: 'शाहजहां सम्राट बना', era: 'medieval', importance: 4, category: 'political' },
  { id: 'e46', year: 1658, title: 'Aurangzeb seizes throne', titleHi: 'औरंगजेब ने सिंहासन पर कब्जा किया', era: 'medieval', importance: 5, category: 'political' },
  { id: 'e47', year: 1674, title: 'Shivaji crowned as Chhatrapati', titleHi: 'शिवाजी का छत्रपति राज्याभिषेक', era: 'medieval', importance: 5, category: 'political' },
  { id: 'e48', year: 1707, title: 'Death of Aurangzeb — Mughal decline begins', titleHi: 'औरंगजेब की मृत्यु — मुगल पतन की शुरुआत', era: 'medieval', importance: 5, category: 'political' },
  { id: 'e49', year: 1739, title: 'Nadir Shah invades Delhi', titleHi: 'नादिर शाह का दिल्ली पर आक्रमण', era: 'medieval', importance: 4, category: 'military' },
  { id: 'e50', year: 1757, title: 'Battle of Plassey', titleHi: 'प्लासी का युद्ध', era: 'medieval', importance: 5, category: 'military' },

  // ═══ MODERN INDIA ═══
  { id: 'e51', year: 1761, title: 'Third Battle of Panipat', titleHi: 'पानीपत का तृतीय युद्ध', era: 'modern', importance: 5, category: 'military' },
  { id: 'e52', year: 1764, title: 'Battle of Buxar', titleHi: 'बक्सर का युद्ध', era: 'modern', importance: 5, category: 'military' },
  { id: 'e53', year: 1773, title: 'Regulating Act passed', titleHi: 'रेगुलेटिंग एक्ट पारित', era: 'modern', importance: 4, category: 'reform' },
  { id: 'e54', year: 1793, title: 'Permanent Settlement by Cornwallis', titleHi: 'कॉर्नवालिस का स्थायी बंदोबस्त', era: 'modern', importance: 5, category: 'reform' },
  { id: 'e55', year: 1799, title: 'Fourth Anglo-Mysore War — Death of Tipu Sultan', titleHi: 'चतुर्थ आंग्ल-मैसूर युद्ध — टीपू सुल्तान की मृत्यु', era: 'modern', importance: 5, category: 'military' },
  { id: 'e56', year: 1828, title: 'Brahmo Samaj founded by Raja Ram Mohan Roy', titleHi: 'राजा राम मोहन राय ने ब्रह्म समाज की स्थापना', era: 'modern', importance: 4, category: 'reform' },
  { id: 'e57', year: 1829, title: 'Sati Prohibition Act', titleHi: 'सती प्रथा निषेध अधिनियम', era: 'modern', importance: 4, category: 'reform' },
  { id: 'e58', year: 1857, title: 'First War of Independence (Sepoy Mutiny)', titleHi: 'प्रथम स्वतंत्रता संग्राम (सिपाही विद्रोह)', era: 'modern', importance: 5, category: 'military' },
  { id: 'e59', year: 1858, title: 'British Crown takes over from EIC', titleHi: 'ब्रिटिश क्राउन ने ईस्ट इंडिया कंपनी से सत्ता ली', era: 'modern', importance: 5, category: 'political' },
  { id: 'e60', year: 1885, title: 'Indian National Congress founded', titleHi: 'भारतीय राष्ट्रीय कांग्रेस की स्थापना', era: 'modern', importance: 5, category: 'political' },
  { id: 'e61', year: 1905, title: 'Partition of Bengal', titleHi: 'बंगाल विभाजन', era: 'modern', importance: 5, category: 'political' },
  { id: 'e62', year: 1906, title: 'Muslim League founded', titleHi: 'मुस्लिम लीग की स्थापना', era: 'modern', importance: 4, category: 'political' },
  { id: 'e63', year: 1919, title: 'Jallianwala Bagh Massacre', titleHi: 'जलियांवाला बाग नरसंहार', era: 'modern', importance: 5, category: 'political' },
  { id: 'e64', year: 1920, title: 'Non-Cooperation Movement launched', titleHi: 'असहयोग आंदोलन शुरू', era: 'modern', importance: 5, category: 'political' },
  { id: 'e65', year: 1930, title: 'Salt March (Dandi March)', titleHi: 'नमक सत्याग्रह (दांडी मार्च)', era: 'modern', importance: 5, category: 'political' },
  { id: 'e66', year: 1942, title: 'Quit India Movement', titleHi: 'भारत छोड़ो आंदोलन', era: 'modern', importance: 5, category: 'political' },
  { id: 'e67', year: 1947, title: 'Independence of India', titleHi: 'भारत की स्वतंत्रता', era: 'modern', importance: 5, category: 'political' },

  // ═══ HISTORIOGRAPHY ═══
  { id: 'e70', year: -300, title: 'Kautilya writes Arthashastra', titleHi: 'कौटिल्य ने अर्थशास्त्र लिखा', era: 'historiography', importance: 5, category: 'text' },
  { id: 'e71', year: 1150, title: 'Kalhana writes Rajatarangini', titleHi: 'कल्हण ने राजतरंगिणी लिखी', era: 'historiography', importance: 5, category: 'text' },
  { id: 'e72', year: 1587, title: 'Abul Fazl writes Ain-i-Akbari', titleHi: 'अबुल फजल ने आइन-ए-अकबरी लिखी', era: 'historiography', importance: 4, category: 'text' },
  { id: 'e73', year: 1817, title: 'James Mill writes History of British India', titleHi: 'जेम्स मिल ने "हिस्ट्री ऑफ ब्रिटिश इंडिया" लिखी', era: 'historiography', importance: 4, category: 'text' },
  { id: 'e74', year: 1956, title: 'D.D. Kosambi — Introduction to Study of Indian History', titleHi: 'डी.डी. कोसांबी — भारतीय इतिहास का अध्ययन', era: 'historiography', importance: 4, category: 'text' },
];

export const CATEGORIES = [
  { id: 'political', name: 'Political', nameHi: 'राजनीतिक', icon: 'Crown', color: '#7c3aed' },
  { id: 'military', name: 'Military/Wars', nameHi: 'सैन्य/युद्ध', icon: 'Swords', color: '#dc2626' },
  { id: 'reform', name: 'Social Reform', nameHi: 'सामाजिक सुधार', icon: 'Heart', color: '#059669' },
  { id: 'religion', name: 'Religion', nameHi: 'धर्म', icon: 'BookOpen', color: '#d97706' },
  { id: 'culture', name: 'Art & Culture', nameHi: 'कला व संस्कृति', icon: 'Palette', color: '#ec4899' },
  { id: 'trade', name: 'Trade & Commerce', nameHi: 'व्यापार', icon: 'Ship', color: '#0891b2' },
  { id: 'civilization', name: 'Civilization', nameHi: 'सभ्यता', icon: 'Building', color: '#78716c' },
  { id: 'text', name: 'Literary Works', nameHi: 'साहित्यिक कृतियां', icon: 'BookOpen', color: '#2563eb' },
];

/**
 * Generate chronology practice questions from timeline data
 */
export function generateChronologyQuestions(era = 'all', difficulty = 'medium', count = 5) {
  let pool = [...TIMELINE_EVENTS];
  if (era !== 'all') pool = pool.filter(e => e.era === era);
  pool = pool.filter(e => e.importance >= 3);

  // Shuffle
  pool.sort(() => Math.random() - 0.5);

  const itemsPerQ = difficulty === 'easy' ? 3 : difficulty === 'medium' ? 5 : 7;
  const questions = [];

  for (let q = 0; q < count && pool.length >= itemsPerQ; q++) {
    const selected = pool.splice(0, itemsPerQ);
    const correctOrder = [...selected].sort((a, b) => a.year - b.year);
    const shuffled = [...selected].sort(() => Math.random() - 0.5);

    questions.push({
      id: `chrono_${q}`,
      items: shuffled,
      correctOrder: correctOrder.map(e => e.id),
      correctOrderFull: correctOrder,
      difficulty,
      era: era === 'all' ? 'mixed' : era,
    });
  }

  return questions;
}

/**
 * Generate flashcard data
 */
export function generateFlashcards(era = 'all', count = 20) {
  let pool = [...TIMELINE_EVENTS];
  if (era !== 'all') pool = pool.filter(e => e.era === era);
  pool.sort(() => Math.random() - 0.5);
  return pool.slice(0, count).map(e => ({
    id: e.id,
    front: { title: e.title, titleHi: e.titleHi },
    back: { year: e.year, era: e.era, category: e.category, importance: e.importance },
  }));
}
