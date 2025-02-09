import { NextResponse } from "next/server";

export async function GET() {
    console.log("called!");

    try {
        const API = process.env.NODE_ENV_ROCK_PAPER_SCISSOR_API_HEALTH;
        if (!API) {
            console.error("Warning: env API (health) not found!");
            return NextResponse.json({ health: "notOk" }, { status: 200 });
        }

        console.log("Fetching API:", API);
        const response = await fetch(API, { method: "GET" });

        console.log("Response status:", response.status);

        if (!response.ok) {
            throw new Error(`Fetch failed: ${response.status} ${response.statusText}`);
        }


        const healthText = await response.text();
        console.log("Health Response (JSON):", healthText);


        return NextResponse.json({ health: healthText }, { status: 200 });
    } catch (e) {
        console.error("GET error:", e);
        return NextResponse.json({ health: "notOk" }, { status: 200 });
    }
}
