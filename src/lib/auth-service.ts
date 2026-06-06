import {
  RecaptchaVerifier,
  signInWithPhoneNumber,
  signOut,
  ConfirmationResult,
  UserCredential,
} from "firebase/auth";
import { auth } from "./firebase";

// Declare custom property on the global window object for TypeScript
declare global {
  interface Window {
    __recaptchaVerifier?: RecaptchaVerifier;
  }
}

/**
 * Initializes an invisible reCAPTCHA verifier attached to the given button ID.
 * Caches it on window.__recaptchaVerifier so it can be reused on subsequent requests.
 */
export function initRecaptcha(buttonId: string): RecaptchaVerifier {
  if (typeof window === "undefined") {
    throw new Error("reCAPTCHA verifier can only be initialized in the browser environment.");
  }

  if (window.__recaptchaVerifier) {
    return window.__recaptchaVerifier;
  }

  const verifier = new RecaptchaVerifier(auth, buttonId, {
    size: "invisible",
    callback: () => {
      // reCAPTCHA solved, can proceed with verification flow.
    },
    "expired-callback": () => {
      // reCAPTCHA expired, user needs to re-verify.
    },
  });

  window.__recaptchaVerifier = verifier;
  return verifier;
}

/**
 * Sends a one-time password (OTP) via SMS to the provided phone number.
 * Prepends +91 if the number does not already start with a country code (+).
 */
export async function sendOTP(phoneNumber: string): Promise<ConfirmationResult> {
  if (typeof window === "undefined") {
    throw new Error("Phone authentication can only be executed in the browser environment.");
  }

  const verifier = window.__recaptchaVerifier;
  if (!verifier) {
    throw new Error("reCAPTCHA verifier has not been initialized. Call initRecaptcha first.");
  }

  // Format phone number to prepend country code prefix if not present
  let formattedNumber = phoneNumber.trim().replace(/\s+/g, "");
  if (!formattedNumber.startsWith("+")) {
    // Strip any leading 0 if present (common in local dialing formats)
    formattedNumber = formattedNumber.replace(/^0+/, "");
    formattedNumber = `+91${formattedNumber}`;
  }

  return signInWithPhoneNumber(auth, formattedNumber, verifier);
}

/**
 * Verifies the OTP code against the confirmation result.
 */
export async function verifyOTP(
  confirmationResult: ConfirmationResult,
  otp: string
): Promise<UserCredential> {
  return confirmationResult.confirm(otp);
}

/**
 * Signs out the current user session.
 */
export async function signOutUser(): Promise<void> {
  document.cookie = "kf-auth-token=; path=/; max-age=0";
  return signOut(auth);
}
