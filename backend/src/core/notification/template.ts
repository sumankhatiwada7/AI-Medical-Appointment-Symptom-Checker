
export const template = {
  approveDoctor: (doctorName: string, email: string) => {
    return {
      subject: "Your Doctor Account Has Been Approved 🎉",
      html: `
        <div style="font-family: Arial, sans-serif; background-color: #f4f7fb; padding: 40px 20px;">
          <div style="max-width: 600px; margin: auto; background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.08);">
            
            <div style="background: linear-gradient(135deg, #2563eb, #1e40af); padding: 30px; text-align: center;">
              <h1 style="color: white; margin: 0; font-size: 28px;">
                Doctor Approval
              </h1>
            </div>

            <div style="padding: 40px 30px;">
              <h2 style="color: #111827; margin-bottom: 16px;">
                Congratulations Dr. ${doctorName},
              </h2>

              <p style="color: #4b5563; line-height: 1.8; font-size: 16px;">
                We are pleased to inform you that your doctor account has been 
                successfully approved by our administration team.
              </p>

              <p style="color: #4b5563; line-height: 1.8; font-size: 16px;">
                You can now log in to the platform, manage appointments, 
                connect with patients, and access all doctor features.
              </p>

              <div style="text-align: center; margin: 35px 0;">
                <a 
                  href="http://localhost:5173/login"
                  style="
                    background: #2563eb;
                    color: white;
                    padding: 14px 28px;
                    border-radius: 10px;
                    text-decoration: none;
                    font-weight: bold;
                    display: inline-block;
                  "
                >
                  Login to Dashboard
                </a>
              </div>

              <div style="background: #f9fafb; padding: 18px; border-radius: 12px; margin-top: 25px;">
                <p style="margin: 0; color: #6b7280; font-size: 14px;">
                  Approved Email:
                  <strong style="color: #111827;">${email}</strong>
                </p>
              </div>
            </div>

            <div style="background: #f3f4f6; padding: 20px; text-align: center;">
              <p style="margin: 0; color: #6b7280; font-size: 13px;">
                © 2026 Medical Appointment System. All rights reserved.
              </p>
            </div>
          </div>
        </div>
      `,
    };
  },

  rejectDoctor: (doctorName: string, reason?: string) => {
    return {
      subject: "Doctor Verification Update",
      html: `
        <div style="font-family: Arial, sans-serif; background-color: #f4f7fb; padding: 40px 20px;">
          <div style="max-width: 600px; margin: auto; background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.08);">
            
            <div style="background: linear-gradient(135deg, #dc2626, #991b1b); padding: 30px; text-align: center;">
              <h1 style="color: white; margin: 0; font-size: 28px;">
                Verification Update
              </h1>
            </div>

            <div style="padding: 40px 30px;">
              <h2 style="color: #111827; margin-bottom: 16px;">
                Hello Dr. ${doctorName},
              </h2>

              <p style="color: #4b5563; line-height: 1.8; font-size: 16px;">
                Thank you for registering on our platform.
                After reviewing your submitted information, we are unable to approve
                your doctor account at this time.
              </p>

              ${
                reason
                  ? `
                <div style="background: #fef2f2; border-left: 4px solid #dc2626; padding: 16px; border-radius: 10px; margin: 25px 0;">
                  <p style="margin: 0; color: #991b1b; font-size: 15px;">
                    <strong>Reason:</strong> ${reason}
                  </p>
                </div>
              `
                  : ""
              }

              <p style="color: #4b5563; line-height: 1.8; font-size: 16px;">
                You may update your information and apply again if necessary.
              </p>

              <div style="text-align: center; margin-top: 35px;">
                <a 
                  href="http://localhost:5173/contact"
                  style="
                    background: #dc2626;
                    color: white;
                    padding: 14px 28px;
                    border-radius: 10px;
                    text-decoration: none;
                    font-weight: bold;
                    display: inline-block;
                  "
                >
                  Contact Support
                </a>
              </div>
            </div>

            <div style="background: #f3f4f6; padding: 20px; text-align: center;">
              <p style="margin: 0; color: #6b7280; font-size: 13px;">
                © 2026 Medical Appointment System. All rights reserved.
              </p>
            </div>
          </div>
        </div>
      `,
    };
  },
};