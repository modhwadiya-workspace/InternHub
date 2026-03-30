import { NextRequest, NextResponse } from "next/server";
import { gql } from "@/lib/hasura";
import bcrypt from "bcryptjs";

export async function POST(req: NextRequest) {
  try {
    const { email, otp, newPassword } = await req.json();

    if (!email || !otp || !newPassword) {
      return NextResponse.json({ error: "Email, OTP, and New Password are required" }, { status: 400 });
    }

    // 1. Verify OTP again (to ensure validity before reset)
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
    const otpRes = await gql(otpQuery, { email, otp });

    if (!otpRes.data?.password_reset_otps?.length) {
      return NextResponse.json({ error: "Invalid or expired OTP" }, { status: 400 });
    }

    // 2. Hash the new password and update user password
    const hashedPassword = await bcrypt.hash(newPassword, 12);
    
    const updateMutation = `mutation ($email: String!, $hashedPassword: String!) {
      update_users(
        where: {email: {_eq: $email}},
        _set: {password: $hashedPassword}
      ) {
        affected_rows
      }
    }`;
    const updateRes = await gql(updateMutation, { email, hashedPassword });

    if (updateRes.errors) {
       console.error("Password Reset Error:", updateRes.errors);
       return NextResponse.json({ error: "Failed to reset password" }, { status: 500 });
    }

    // 3. Optional: Delete the OTP so it can't be reused
    const deleteMutation = `mutation ($email: String!) {
      delete_password_reset_otps(where: {email: {_eq: $email}}) {
        affected_rows
      }
    }`;
    await gql(deleteMutation, { email });

    return NextResponse.json({ success: true, message: "Password reset successfully" });
  } catch (err) {
    console.error("Reset Password Confirm Error:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
