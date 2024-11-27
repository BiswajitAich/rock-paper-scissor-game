import { NextRequest, NextResponse } from 'next/server';
export async function POST(request: NextRequest) {
    try {
        const formData = await request.formData();
        const file = formData.get('image');
        if (!file) {
            return new Response(JSON.stringify({ error: 'No file uploaded' }), { status: 400 });
        }
        const response = await fetch("http://localhost:5000/predict", {
            method: "POST",
            body: formData,
        });

        const data = await response.json();
        console.log("API Response:", data);
        return new Response(JSON.stringify({ 'data': data.result.toLowerCase() }), { status: 200 })
    } catch (error) {
        console.error("Error sending to Flask:", error);
    }
}