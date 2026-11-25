
import { createClient } from "@supabase/supabase-js";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const jsonResponse = (data: unknown, status = 200) => {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json",
    },
  });
};

Deno.serve(async (req: Request) => {
  // Handle browser preflight requests
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return jsonResponse({ error: "Method not allowed." }, 405);
  }

  try {
    // Read Supabase environment variables
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const secretKeysValue = Deno.env.get("SUPABASE_SECRET_KEYS");

    if (!supabaseUrl || !secretKeysValue) {
      console.error("Missing Supabase environment variables.");

      return jsonResponse({
        error: "Server configuration is incomplete.",
      }, 500);
    }

    // Supabase provides named API keys as a JSON object
    const secretKeys = JSON.parse(secretKeysValue);
    const secretKey = secretKeys.default;

    if (!secretKey) {
      return jsonResponse({
        error: "The default Supabase secret key was not found.",
      }, 500);
    }

    // Create an administrative Supabase client
    const supabaseAdmin = createClient(
      supabaseUrl,
      secretKey,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      },
    );

    // Get the signed-in user's access token
    const authHeader = req.headers.get("Authorization");

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return jsonResponse({
        error: "You must be signed in to invite a team member.",
      }, 401);
    }

    const token = authHeader.replace("Bearer ", "");

    // Verify the user's access token
    const {
      data: { user },
      error: authError,
    } = await supabaseAdmin.auth.getUser(token);

    if (authError || !user) {
      return jsonResponse({
        error: "Your session is invalid or has expired. Please sign in again.",
      }, 401);
    }

    // Read the invitation details
    const body = await req.json();

    const email = String(body.email ?? "").trim().toLowerCase();
    const role = String(body.role ?? "").trim().toLowerCase();
    const organisationId = String(body.organisationId ?? "").trim();

    // Validate the supplied details
    if (!email || !organisationId || !role) {
      return jsonResponse({
        error: "Email, role and organisation are required.",
      }, 400);
    }

    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailPattern.test(email)) {
      return jsonResponse({
        error: "Please enter a valid email address.",
      }, 400);
    }

    if (!["admin", "employee"].includes(role)) {
      return jsonResponse({
        error: "The selected role is not allowed.",
      }, 400);
    }

    // Check the current user's membership and permissions
    const {
      data: membership,
      error: membershipError,
    } = await supabaseAdmin
      .from("memberships")
      .select("organisation_id, user_id, role")
      .eq("organisation_id", organisationId)
      .eq("user_id", user.id)
      .maybeSingle();

    if (membershipError) {
      console.error("Membership lookup failed:", membershipError);

      return jsonResponse({
        error: "Unable to verify your organisation membership.",
      }, 500);
    }

    if (!membership) {
      return jsonResponse({
        error: "You are not a member of this organisation.",
      }, 403);
    }

    const currentRole = String(membership.role).toLowerCase();

    if (!["owner", "admin"].includes(currentRole)) {
      return jsonResponse({
        error: "You do not have permission to invite team members.",
      }, 403);
    }

    // Admins may invite employees, but only owners may invite admins
    if (currentRole === "admin" && role !== "employee") {
      return jsonResponse({
        error: "Administrators can only invite employees.",
      }, 403);
    }

    // Check whether the email already belongs to an existing profile
    const {
      data: existingProfile,
      error: profileError,
    } = await supabaseAdmin
      .from("profiles")
      .select("id, email")
      .ilike("email", email)
      .maybeSingle();

    if (profileError) {
      console.error("Profile lookup failed:", profileError);

      return jsonResponse({
        error: "Unable to check the invited user's account.",
      }, 500);
    }

    // If the person already has an account, check their membership
    if (existingProfile) {
      const {
        data: existingMembership,
        error: existingMembershipError,
      } = await supabaseAdmin
        .from("memberships")
        .select("user_id")
        .eq("organisation_id", organisationId)
        .eq("user_id", existingProfile.id)
        .maybeSingle();

      if (existingMembershipError) {
        console.error(
          "Existing membership lookup failed:",
          existingMembershipError,
        );

        return jsonResponse({
          error: "Unable to check existing team membership.",
        }, 500);
      }

      if (existingMembership) {
        return jsonResponse({
          error: "This person is already a member of your organisation.",
        }, 409);
      }
    }

    // Expire old pending invitations for this email
    const now = new Date().toISOString();

    const {
      error: expireError,
    } = await supabaseAdmin
      .from("team_invitations")
      .update({ status: "expired" })
      .eq("organisation_id", organisationId)
      .ilike("email", email)
      .eq("status", "pending")
      .lt("expires_at", now);

    if (expireError) {
      console.error("Invitation expiry update failed:", expireError);

      return jsonResponse({
        error: "Unable to prepare the invitation.",
      }, 500);
    }

    // Check for an existing pending invitation
    const {
      data: existingInvitation,
      error: invitationLookupError,
    } = await supabaseAdmin
      .from("team_invitations")
      .select("id")
      .eq("organisation_id", organisationId)
      .ilike("email", email)
      .eq("status", "pending")
      .gt("expires_at", now)
      .maybeSingle();

    if (invitationLookupError) {
      console.error(
        "Invitation lookup failed:",
        invitationLookupError,
      );

      return jsonResponse({
        error: "Unable to check existing invitations.",
      }, 500);
    }

    if (existingInvitation) {
      return jsonResponse({
        error: "There is already a pending invitation for this email.",
      }, 409);
    }

    // Invitations expire after seven days
    const expiresAt = new Date(
      Date.now() + 7 * 24 * 60 * 60 * 1000,
    ).toISOString();

    // Create the pending invitation
    const {
      data: invitation,
      error: insertError,
    } = await supabaseAdmin
      .from("team_invitations")
      .insert({
        organisation_id: organisationId,
        email,
        role,
        invited_by: user.id,
        status: "pending",
        expires_at: expiresAt,
      })
      .select()
      .single();

    if (insertError) {
      console.error("Invitation creation failed:", insertError);

      return jsonResponse({
        error: "Unable to create the team invitation.",
      }, 500);
    }

    return jsonResponse({
      success: true,
      message: "Invitation created successfully.",
      invitation,
      emailDelivery: "not_configured",
    }, 201);
  } catch (error) {
    console.error("Unexpected invitation error:", error);

    return jsonResponse({
      error: "An unexpected error occurred while creating the invitation.",
    }, 500);
  }
});
