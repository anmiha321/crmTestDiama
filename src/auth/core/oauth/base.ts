import { Cookies } from "../session"
import { z } from "zod"
import crypto from "crypto"

const STATE_COOKIE_KEY = "oAuthState"
const CODE_VERIFIER_COOKIE_KEY = "oAuthCodeVerifier"
// Ten minutes in seconds
const COOKIE_EXPIRATION_SECONDS = 60 * 10
class InvalidCodeVerifierError extends Error {
  constructor() {
    super("Invalid Code Verifier")
  }
}
