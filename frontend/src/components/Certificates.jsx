import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { jsPDF } from "jspdf";
import { authHeaders } from "../api";

function Certificates() {
  const navigate = useNavigate();
  const [certificates, setCertificates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const handleDownloadCertificate = (certificate) => {
    try {
      const doc = new jsPDF({ orientation: "landscape", unit: "pt", format: "a4" });
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();

      doc.setFillColor(239, 246, 255);
      doc.rect(0, 0, pageWidth, pageHeight, "F");
      doc.setDrawColor(37, 99, 235);
      doc.setLineWidth(4);
      doc.roundedRect(40, 40, pageWidth - 80, pageHeight - 80, 18, 18, "S");

      doc.setFillColor(37, 99, 235);
      doc.roundedRect(58, 58, pageWidth - 116, 74, 14, 14, "F");
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(26);
      doc.text("CERTIFICATE OF COMPLETION", pageWidth / 2, 102, { align: "center" });

      doc.setTextColor(17, 24, 39);
      doc.setFontSize(18);
      doc.text("This certifies that", pageWidth / 2, 190, { align: "center" });

      doc.setTextColor(30, 64, 175);
      doc.setFontSize(28);
      doc.text(certificate.studentName, pageWidth / 2, 240, { align: "center" });

      doc.setTextColor(17, 24, 39);
      doc.setFontSize(18);
      doc.text("has successfully completed", pageWidth / 2, 290, { align: "center" });

      doc.setTextColor(37, 99, 235);
      doc.setFontSize(26);
      doc.text(certificate.courseName, pageWidth / 2, 345, { align: "center" });

      doc.setTextColor(17, 24, 39);
      doc.setFontSize(16);
      doc.text(`Awarded on ${new Date(certificate.completedAt).toLocaleDateString()}`, pageWidth / 2, 410, { align: "center" });

      doc.setDrawColor(15, 118, 110);
      doc.line(200, 470, pageWidth - 200, 470);

      doc.setTextColor(31, 41, 55);
      doc.setFontSize(12);
      doc.text("Authorized Signature", pageWidth / 2, 495, { align: "center" });
      doc.setFontSize(14);
      doc.text("LearnHub Academy", pageWidth / 2, 530, { align: "center" });

      const safeCourseName = certificate.courseName
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "") || "certificate";

      doc.save(`${safeCourseName}-certificate.pdf`);
    } catch (downloadError) {
      console.error(downloadError);
      setError("Unable to export the certificate as a PDF.");
    }
  };

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("user") || "null");
    if (!user) {
      navigate("/", { replace: true });
      return;
    }

    const fetchCertificates = async () => {
      try {
        const coursesResponse = await fetch(
          `http://localhost:8000/my-courses/${encodeURIComponent(user.email)}`,
          { headers: authHeaders() }
        );
        const coursesData = await coursesResponse.json();

        if (!coursesResponse.ok || !coursesData.success) {
          throw new Error(coursesData.message || "Unable to load enrolled courses");
        }

        const courses = coursesData.enrollments || [];

        const certificateRequests = courses.map(async (course) => {
          const response = await fetch(
            `http://localhost:8000/progress/${encodeURIComponent(course.courseName)}`,
            { headers: authHeaders() }
          );
          const data = await response.json();

          if (!response.ok || !data.success) {
            return null;
          }

          if (data.progress < 100) {
            return null;
          }

          return {
            courseName: course.courseName,
            completedAt: data.completedAt || new Date().toISOString(),
            studentName: user.name,
            certificateId: `${course.courseName.replace(/\s+/g, "-").toLowerCase()}-${Date.now()}`,
          };
        });

        const resolvedCertificates = (await Promise.all(certificateRequests)).filter(Boolean);
        const userScore = Math.max(750, resolvedCertificates.length * 180);
        localStorage.setItem("learnhub-user-score", String(userScore));
        setCertificates(resolvedCertificates);
      } catch (fetchError) {
        setError(fetchError.message || "Unable to load certificates");
      } finally {
        setLoading(false);
      }
    };

    fetchCertificates();
  }, [navigate]);

  return (
    <div className="certificates-page">
      <header className="certificates-header">
        <div>
          <h1>Certificates</h1>
          <p>Your completed achievements.</p>
        </div>

        <button className="certificates-back-btn" onClick={() => navigate("/home")}>
          ← Back to Home
        </button>
      </header>

      <section className="certificates-grid">
        {error ? (
          <div className="empty-certificates" role="alert">
            <h2>Unable to load certificates</h2>
            <p>{error}</p>
          </div>
        ) : loading ? (
          <p className="page-state">Loading certificates...</p>
        ) : certificates.length === 0 ? (
          <div className="empty-certificates">
            <h2>No certificates yet</h2>
            <p>Complete a course to unlock your first certificate.</p>
          </div>
        ) : (
          certificates.map((certificate) => (
            <article key={certificate.certificateId} className="certificate-card">
              <div className="certificate-badge">Certified</div>
              <h2>{certificate.courseName}</h2>
              <p className="certificate-recipient">Awarded to {certificate.studentName}</p>
              <p className="certificate-date">
                Completed on {new Date(certificate.completedAt).toLocaleDateString()}
              </p>
              <div className="certificate-seal">✓</div>
              <div className="certificate-actions">
                <button
                  type="button"
                  className="certificate-btn"
                  onClick={() => navigate(`/lessons/${encodeURIComponent(certificate.courseName)}`)}
                >
                  Review Course
                </button>
                <button
                  type="button"
                  className="certificate-download-btn"
                  onClick={() => handleDownloadCertificate(certificate)}
                >
                  Download PDF
                </button>
              </div>
            </article>
          ))
        )}
      </section>
    </div>
  );
}

export default Certificates;
