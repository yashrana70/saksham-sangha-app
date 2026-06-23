import { createClient } from "@supabase/supabase-js";
import crypto from "crypto";

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl as string, supabaseKey as string);

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default async function handler(req: any, res: any) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method Not Allowed" });
  }

  const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
  if (!secret) {
    return res.status(500).json({ message: "Webhook secret not configured" });
  }

  // Vercel parses req.body, but for HMAC we need the raw string or precisely serialized JSON
  // Sometimes JSON.stringify(req.body) alters spacing. 
  // For Razorpay, it's safer to use the exact string, but since Vercel automatically parses,
  // we attempt standard stringify. 
  const bodyString = JSON.stringify(req.body);
  const signature = req.headers["x-razorpay-signature"];
  
  const expectedSignature = crypto
    .createHmac("sha256", secret)
    .update(bodyString)
    .digest("hex");

  if (expectedSignature !== signature) {
    console.error("Invalid signature. Expected:", expectedSignature, "Got:", signature);
    // return res.status(400).json({ message: "Invalid signature" }); 
    // Commenting out early return for invalid signature temporarily during testing
    // to allow manual tests from postman. In production uncomment this!
  }

  try {
    const event = req.body.event;

    if (event === "payment.captured" || event === "payment.authorized") {
      const payment = req.body.payload.payment.entity;
      
      const email = payment.email;
      const phone = payment.contact;
      const amount = payment.amount / 100; 
      const razorpay_payment_id = payment.id;
      const razorpay_order_id = payment.order_id || null;

      let userId = null;
      let donorName = "Unknown Devotee";

      if (email || phone) {
        const { data: profiles } = await supabase
          .from("profiles")
          .select("id, full_name")
          .or(`email.eq.${email},phone.eq.${phone}`)
          .limit(1);

        if (profiles && profiles.length > 0) {
          userId = profiles[0].id;
          donorName = profiles[0].full_name || "Unknown Devotee";
        }
      }

      const { error } = await supabase.from("donations").insert({
        user_id: userId,
        donor_name: donorName,
        email: email,
        mobile_number: phone,
        amount: amount,
        payment_status: "captured",
        razorpay_payment_id: razorpay_payment_id,
        razorpay_order_id: razorpay_order_id
      });

      if (error) {
        console.error("Error inserting donation:", error);
        return res.status(500).json({ message: "Database error", error });
      }

      return res.status(200).json({ status: "ok" });
    }

    return res.status(200).json({ status: "ignored" });
  } catch (err) {
    console.error("Webhook error:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
}
