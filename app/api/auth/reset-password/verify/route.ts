import { NextRequest, NextResponse } from "next/server";
import { gqlAdmin } from "@/lib/hasura";

export async function POST(req: NextRequest) {
  try {
    const { email, otp } = await req.json();

    if (!email || !otp) {
      return NextResponse.json({ error: "Email and OTP are required" }, { status: 400 });
    }

    // 1. Check if OTP exists and is valid
    const otpQuery = `query ($email: String!, $otp: String!) {
      password_reset_otps(
        where: {
          email: {_eq: $email},
          otp: {_eq: $otp},
          expiry: {_gt: "now()"}
        },
        order_by: {created_at: desc},
        limit: 1
      ) {
        id
      }
    }`;
    const otpRes = await gqlAdmin(otpQuery, { email, otp });

    if (otpRes.errors) {
       console.error("OTP Verification Error:", otpRes.errors);
       return NextResponse.json({ error: "Failed to verify OTP" }, { status: 500 });
    }

    if (!otpRes.data?.password_reset_otps?.length) {
      return NextResponse.json({ error: "Invalid or expired OTP" }, { status: 400 });
    }

    return NextResponse.json({ success: true, message: "OTP verified correctly" });
  } catch (err) {
    console.error("Reset Password Verify Error:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
