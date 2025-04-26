import { NextResponse } from 'next/server';
import { RHEA_LENDING_INTERFACE_DOMAIN } from '@/app/config';
// import { tokens } from "@/app/utils/tokens"

export async function GET() {
	try {
		const res = await fetch(`${RHEA_LENDING_INTERFACE_DOMAIN}/list_token_data`, {
		  method: "GET",
		  headers: {
			'Content-Type': 'application/json',
		  },
		})
		const result = await res.json();
		console.log('---------result', result);
		return NextResponse.json(result);
	} catch (error) {
		console.error('Error  list_token_data:', error);
		return NextResponse.json({ error: 'Failed to get token data' }, { status: 500 });
	}
}
