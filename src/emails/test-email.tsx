import { Button, Html } from "@react-email/components";
import * as React from "react";

export default function TestEmail() {
  return (
    <Html>
      <div
        style={{
          fontFamily: "Arial, sans-serif",
          background: "#f9f9f9",
          padding: "32px",
        }}
      >
        <div
          style={{
            maxWidth: "480px",
            margin: "0 auto",
            background: "#fff",
            borderRadius: "8px",
            boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
            padding: "32px",
          }}
        >
          <h2 style={{ color: "#222", marginBottom: "16px" }}>
            Schedule Confirmation
          </h2>
          <p style={{ color: "#444", fontSize: "16px", marginBottom: "24px" }}>
            Hello,
            <br />
            <br />
            Your schedule has been successfully confirmed! Here are the details
            of your appointment:
          </p>
          <table
            style={{
              width: "100%",
              marginBottom: "24px",
              fontSize: "15px",
              color: "#333",
            }}
          >
            <tbody>
              <tr>
                <td style={{ padding: "6px 0", fontWeight: "bold" }}>Date:</td>
                <td style={{ padding: "6px 0" }}>June 20, 2024</td>
              </tr>
              <tr>
                <td style={{ padding: "6px 0", fontWeight: "bold" }}>Time:</td>
                <td style={{ padding: "6px 0" }}>10:00 AM - 11:00 AM</td>
              </tr>
              <tr>
                <td style={{ padding: "6px 0", fontWeight: "bold" }}>
                  Location:
                </td>
                <td style={{ padding: "6px 0" }}>
                  Online (Zoom link will be sent separately)
                </td>
              </tr>
            </tbody>
          </table>
          <p style={{ color: "#444", fontSize: "16px", marginBottom: "32px" }}>
            If you have any questions or need to reschedule, please contact us
            at{" "}
            <a href="mailto:support@example.com" style={{ color: "#0070f3" }}>
              support@example.com
            </a>
            .
          </p>
          <Button
            href="https://example.com/schedule"
            style={{
              background: "#0070f3",
              color: "#fff",
              padding: "12px 28px",
              borderRadius: "4px",
              fontSize: "16px",
              textDecoration: "none",
              border: "none",
              cursor: "pointer",
            }}
          >
            View Your Schedule
          </Button>
          <p style={{ color: "#888", fontSize: "13px", marginTop: "32px" }}>
            Thank you for choosing us!
            <br />
            The Slovenščina Korak za Korkom Team
          </p>
        </div>
      </div>
    </Html>
  );
}
