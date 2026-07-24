const API_URL = "http://localhost:8001/analyze-alert";

export async function analyzeAlert(alert) {

    const response = await fetch(API_URL, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            title: alert.title,
            severity: alert.severity,
            description: alert.description,
            sourceIp: alert.source
        })
    });

    if (!response.ok) {
        throw new Error("Failed to analyze alert");
    }

    return response.json();
}