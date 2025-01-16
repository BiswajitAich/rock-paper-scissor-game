import { NextResponse } from "next/server";

export async function GET() {
    try {
        const API = process.env.NODE_ENV_ROCK_PAPER_SCISSOR_API_HEALTH;
        // const API = null;
        if (!API){
            console.error("warning: env API (health) not found!");
            return NextResponse.json({ health: "notOk" }, { status: 500 });         
        }
        const response=await fetch(API, {method: 'GET'});
        console.log(response)
        return NextResponse.json({health: response.text}, {status: 200});
    } catch (e) {
        console.error(e)
        return NextResponse.json({ health: "notOk" }, { status: 500 });
    }
}