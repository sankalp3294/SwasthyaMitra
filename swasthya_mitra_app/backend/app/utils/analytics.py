"""
Utility functions for analytics and clustering
"""
import json
from typing import Dict, List, Tuple
from datetime import datetime, timedelta


def detect_anomalies_in_zone(
    zone: str,
    symptom_counts: Dict[str, int],
    baseline_counts: Dict[str, int],
    threshold: float = 1.5
) -> List[Dict]:
    """
    Detect anomalies in symptom distribution
    Returns list of anomalous symptoms with scores
    """
    anomalies = []

    for symptom, observed_count in symptom_counts.items():
        baseline = baseline_counts.get(symptom, 1)
        anomaly_score = observed_count / baseline if baseline > 0 else 0

        if anomaly_score >= threshold:
            severity = "RED" if anomaly_score > 3 else "ORANGE" if anomaly_score > 2 else "YELLOW"
            anomalies.append({
                "symptom": symptom,
                "observed_count": observed_count,
                "baseline_count": baseline,
                "anomaly_score": min(anomaly_score, 5.0),  # Cap at 5
                "risk_level": severity
            })

    return sorted(anomalies, key=lambda x: x["anomaly_score"], reverse=True)


def calculate_zone_risk_level(anomalies: List[Dict]) -> str:
    """
    Calculate overall zone risk level based on anomalies
    """
    if not anomalies:
        return "GREEN"

    risk_levels = [a["risk_level"] for a in anomalies]

    if "RED" in risk_levels:
        return "RED"
    elif "ORANGE" in risk_levels:
        return "ORANGE"
    elif "YELLOW" in risk_levels:
        return "YELLOW"
    else:
        return "GREEN"


def generate_cluster_report(
    zone: str,
    anomalies: List[Dict],
    time_window_start: str,
    time_window_end: str
) -> Dict:
    """
    Generate a comprehensive cluster detection report
    """
    report = {
        "zone": zone,
        "timestamp": datetime.utcnow().isoformat(),
        "time_window": {
            "start": time_window_start,
            "end": time_window_end
        },
        "anomalies_detected": len(anomalies),
        "overall_risk": calculate_zone_risk_level(anomalies),
        "critical_symptoms": [a for a in anomalies if a["risk_level"] in ["RED", "ORANGE"]],
        "anomalies": anomalies,
        "recommendations": generate_recommendations(anomalies)
    }

    return report


def generate_recommendations(anomalies: List[Dict]) -> List[str]:
    """
    Generate recommendations based on detected anomalies
    """
    recommendations = []
    risk_level = calculate_zone_risk_level(anomalies)

    if risk_level == "GREEN":
        recommendations.append("Continue regular monitoring")
    elif risk_level == "YELLOW":
        recommendations.append("Increase monitoring frequency")
        recommendations.append("Prepare resources for potential escalation")
    elif risk_level == "ORANGE":
        recommendations.append("Initiate investigation")
        recommendations.append("Alert local health authorities")
        recommendations.append("Prepare intervention team")
    elif risk_level == "RED":
        recommendations.append("Immediate action required")
        recommendations.append("Activate emergency response protocol")
        recommendations.append("Contact Chief Doctor immediately")
        recommendations.append("Consider targeted health camps")

    return recommendations
