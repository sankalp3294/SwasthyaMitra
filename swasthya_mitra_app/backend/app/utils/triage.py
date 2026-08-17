"""
Multilingual AI Triage & NLP Entity Extraction Module
Supports English, Hindi (हिन्दी), Marathi (मराठी), Bengali (বাংলা), Tamil (தமிழ்), Telugu (తెలుగు), Gujarati (ગુજરાતી)
"""
import re
from typing import Dict, Tuple, List

# Multilingual Urgent Warning Keywords
URGENT_KEYWORDS = {
    "en": ["chest pain", "difficulty breathing", "unconscious", "severe bleeding", "emergency", "sudden weakness", "shortness of breath"],
    "hi": ["छाती में दर्द", "सीने में दर्द", "सांस लेने में तकलीफ", "बेहोश", "गंभीर खून", "आपातकालीन", "सांस फूलना", "चक्कर"],
    "mr": ["छातीत दुखणे", "श्वास घेण्यास त्रास", "बेहोश", "रक्तस्त्राव", "आणीबाणी", "दम लागणे", "डोके फिरणे"],
    "bn": ["বুকের ব্যথা", "শ্বাসকষ্ট", "অজ্ঞান", "রক্তপাত", "জরুরী"],
    "ta": ["நெஞ்சு வலி", "மூச்சுத்திணறல்", "மயக்கம்", "அவசரம்"],
    "te": ["ఛాతీ నెప్పి", "శ్వాస తీసుకోవడంలో ఇబ్బంది", "స్పృహ తప్పడం", "అత్యవసరం"]
}

# Multilingual Moderate Symptom Keywords
MODERATE_KEYWORDS = {
    "en": ["fever", "cough", "vomiting", "diarrhea", "headache", "body ache", "persistent pain", "nausea", "stomach pain", "cold"],
    "hi": ["बुखार", "खांसी", "उल्टी", "दस्त", "सिरदर्द", "बदन दर्द", "जी मिचलाना", "पेट दर्द", "सर्दी", "जुकाम"],
    "mr": ["ताप", "खोकला", "उलट्या", "हागवण", "डोकेदुखी", "अंगदुखी", "मळमळ", "पोटदुखी", "सर्दी"],
    "bn": ["জ্বর", "কাশি", "বমি", "মাথা ব্যথা", "পেট ব্যথা"],
    "ta": ["காய்ச்சல்", "இருமல்", "வாந்தி", "தலைவலி", "வயிறு வலி"],
    "te": ["జ్వరం", "దగ్గు", "వాంతులు", "తలనొప్పి", "కడుపు నెప్పి"]
}

# Multilingual Localized Triage Recommendations
LOCALIZED_RESPONSES = {
    "en": {
        "URGENT": {
            "reasoning": "🚨 Potentially serious warning signs detected (Chest pressure / Severe respiratory / Trauma).",
            "recommendations": [
                "Seek immediate emergency medical care at the nearest hospital.",
                "Call 108 emergency ambulance service.",
                "Do not drive yourself to the hospital."
            ]
        },
        "MODERATE": {
            "reasoning": "🟡 Symptoms warrant high-priority clinical evaluation within 24 hours.",
            "recommendations": [
                "Schedule an OPD appointment with a specialist within 24 hours.",
                "Monitor body temperature and vital signs closely.",
                "Keep hydrated and rest."
            ]
        },
        "LOW": {
            "reasoning": "🟢 Routine primary care pathway appropriate.",
            "recommendations": [
                "Schedule a routine consultation at your nearest PHC.",
                "Follow standard preventive self-care measures.",
                "Consult a physician if symptoms persist beyond 3 days."
            ]
        }
    },
    "hi": {
        "URGENT": {
            "reasoning": "🚨 गंभीर आपातकालीन चेतावनी के संकेत मिले हैं (छाती में दबाव / गंभीर सांस लेने में समस्या)।",
            "recommendations": [
                "तुरंत निकटतम आपातकालीन अस्पताल में चिकित्सा सहायता लें।",
                "108 एम्बुलेंस सेवा को तुरंत कॉल करें।",
                "अकेले वाहन न चलाएं।"
            ]
        },
        "MODERATE": {
            "reasoning": "🟡 लक्षणों के आधार पर 24 घंटे के भीतर डॉक्टर से परामर्श आवश्यक है।",
            "recommendations": [
                "24 घंटे के भीतर विशेषज्ञ डॉक्टर के साथ अपॉइंटमेंट बुक करें।",
                "शरीर का तापमान और ऑक्सीजन स्तर नियमित जांचें।",
                "पर्याप्त पानी पीएं और विश्राम करें।"
            ]
        },
        "LOW": {
            "reasoning": "🟢 सामान्य प्राथमिक स्वास्थ्य सलाह उपयुक्त है।",
            "recommendations": [
                "अपने नजदीकी स्वास्थ्य केंद्र (PHC) में नियमित अपॉइंटमेंट लें।",
                "सामान्य घरेलू देखभाल का पालन करें।",
                "यदि लक्षण 3 दिनों से अधिक बने रहें तो डॉक्टर से मिलें।"
            ]
        }
    },
    "mr": {
        "URGENT": {
            "reasoning": "🚨 गंभीर आणीबाणीच्या वैद्यकीय लक्षणांचे संकेत आढळले आहेत (छातीत तीव्र वेदना / श्वास कोंडणे)।",
            "recommendations": [
                "ताबडतोब जवळच्या आणीबाणी रुग्णालयात वैद्यकीय मदत घ्या.",
                "१०८ रुग्णवाहिका सेवेशी त्वरित संपर्क साधा.",
                "स्वतः वाहन चालवून जाऊ नका."
            ]
        },
        "MODERATE": {
            "reasoning": "🟡 लक्षणांनुसार २४ तासांच्या आत डॉक्टरांचा सल्ला घेणे आवश्यक आहे.",
            "recommendations": [
                "२४ तासांच्या आत तज्ज्ञ डॉक्टरांची वेळ (OPD Appointment) नक्की करा.",
                "शरीराचे तापमान आणि ऑक्सिजन पातळी सतत तपासा.",
                "पुरेसे पाणी प्या आणि विश्रांती घ्या."
            ]
        },
        "LOW": {
            "reasoning": "🟢 प्राथमिक आरोग्य तपासणी पुरेशी आहे.",
            "recommendations": [
                "जवळच्या प्राथमिक आरोग्य केंद्रात (PHC) नियमित भेट द्या.",
                "सामान्य घरगुती काळजी घ्या.",
                "लक्षणे ३ दिवसांपेक्षा जास्त राहिल्यास डॉक्टरांना दाखवा."
            ]
        }
    }
}

def detect_language(text: str) -> str:
    """
    Detect script and language of input text
    """
    if not text:
        return "en"
    
    # Devanagari script (Hindi / Marathi)
    if re.search(r'[\u0900-\u097F]', text):
        # Marathi specific character / words test
        if any(w in text for w in ["आहे", "नाही", "होते", "दुखणे", "ताप", "खोकला", "कास", "मळमळ"]):
            return "mr"
        return "hi"
    
    # Bengali script
    if re.search(r'[\u0980-\u09FF]', text):
        return "bn"
    
    # Tamil script
    if re.search(r'[\u0B80-\u0BFF]', text):
        return "ta"
    
    # Telugu script
    if re.search(r'[\u0C00-\u0C7F]', text):
        return "te"
        
    return "en"


def assess_triage(symptoms: str, target_lang: str = None) -> Tuple[str, str, List[str]]:
    """
    Perform Multilingual Triage Assessment with native language response
    Returns: (triage_level, reasoning, recommendations)
    """
    text = (symptoms or "").strip()
    detected_lang = target_lang or detect_language(text)
    text_lower = text.lower()

    # Collect all urgent and moderate keywords across languages
    is_urgent = False
    is_moderate = False

    for lang, keywords in URGENT_KEYWORDS.items():
        if any(kw.lower() in text_lower for kw in keywords):
            is_urgent = True
            break

    if not is_urgent:
        for lang, keywords in MODERATE_KEYWORDS.items():
            if any(kw.lower() in text_lower for kw in keywords):
                is_moderate = True
                break

    if is_urgent:
        level = "URGENT"
    elif is_moderate:
        level = "MODERATE"
    else:
        level = "LOW"

    # Select localized response template (fallback to English if lang unavailable)
    lang_template = LOCALIZED_RESPONSES.get(detected_lang, LOCALIZED_RESPONSES["en"])
    level_info = lang_template.get(level, LOCALIZED_RESPONSES["en"][level])

    return (level, level_info["reasoning"], level_info["recommendations"])


def extract_symptom_entities(text: str) -> Dict[str, str]:
    """
    Multilingual Entity Extraction (Duration, Severity, Symptoms)
    """
    lang = detect_language(text)
    text_lower = text.lower()

    entities = {
        "detected_language": lang,
        "symptom_type": [],
        "duration": None,
        "severity": None
    }

    # Extract Duration
    if re.search(r'\d+\s*(day|days|week|weeks|month|दिन|दिनों|हफ्ते|दिवस|महिने)', text_lower):
        match = re.search(r'\d+\s*(day|days|week|weeks|month|दिन|दिनों|हफ्ते|दिवस|महिने)', text_lower)
        if match:
            entities["duration"] = match.group(0)

    # Extract Severity
    if any(w in text_lower for w in ["severe", "acute", "तेज़", "गंभीर", "तीव्र"]):
        entities["severity"] = "severe"
    elif any(w in text_lower for w in ["mild", "slight", "हल्का", "कम"]):
        entities["severity"] = "mild"
    else:
        entities["severity"] = "moderate"

    # Extract Recognized Symptoms
    matched_symptoms = []
    all_symptom_words = ["fever", "cough", "headache", "chest pain", "বুखार", "खांसी", "सिरदर्द", "ताप", "खोकला", "डोकेदुखी"]
    for sym in all_symptom_words:
        if sym in text_lower:
            matched_symptoms.append(sym)

    entities["symptom_type"] = matched_symptoms
    return entities
