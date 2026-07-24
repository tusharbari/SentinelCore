const API_URL = "http://localhost:8001/chat";

export async function askAI(question) {
    const response = await fetch(API_URL, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            question
        })
    });

    if (!response.ok) {
        throw new Error("Failed to contact AI");
    }

    return response.json();
}