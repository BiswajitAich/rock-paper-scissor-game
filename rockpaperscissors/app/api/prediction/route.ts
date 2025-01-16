import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
    const API = process.env.NODE_ENV_ROCK_PAPER_SCISSOR_API;
    // const API = null
    if (!API) {
        console.error("Missing Flask API URL");
        return NextResponse.json({ 
            error: 'Server configuration error' 
        }, { status: 500 });
    }

    try {
        const formData = await request.formData();
        const file = formData.get('image');
        if (!file) {
            return new Response(JSON.stringify({ error: 'No file uploaded' }), { status: 400 });
        }
        const response = await fetch(API, {
            method: "POST",
            body: formData,
            headers: {
                "Accept": "application/json"
            },
        });

        if (!response.ok) {
            // const errorData = await response.json();
            console.error("Flask API Error:::");
            return NextResponse.json({ error: 'Failed to process image' }, { status: response.status });
        }

        const data = await response.json();
        console.log("API Response:", data);
        return new Response(JSON.stringify({ 'data': data.result.toLowerCase() }), { status: 200 })
    } catch (error) {
        console.error("Error sending to Flask:", error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
