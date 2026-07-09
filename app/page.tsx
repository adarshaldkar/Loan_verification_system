"use client";

import { useState, useEffect } from "react";

// ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ
// Small reusable components
// ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ

function Navbar() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <nav
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        zIndex: 100,
        padding: "0 24px",
        height: "68px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        background: scrolled
          ? "rgba(5, 11, 24, 0.85)"
          : "transparent",
        backdropFilter: scrolled ? "blur(20px)" : "none",
        borderBottom: scrolled
          ? "1px solid rgba(255,255,255,0.06)"
          : "none",
        transition: "all 0.3s ease",
      }}
    >
      {/* Logo */}
      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
        <div
          style={{
            width: 36,
            height: 36,
            borderRadius: "10px",
            background: "linear-gradient(135deg, #4F8EF7, #00D4AA)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "18px",
          }}
        >
          Γ£ª
        </div>
        <span
          style={{
            fontWeight: 700,
            fontSize: "16px",
            letterSpacing: "-0.3px",
          }}
        >
          LoanVerify<span className="gradient-text-blue"> AI</span>
        </span>
      </div>

      {/* Links */}
      <div style={{ display: "flex", alignItems: "center", gap: "28px" }}>
        {["Features", "How it Works", "Pricing", "Docs"].map((link) => (
          <a key={link} href="#" className="nav-link">
            {link}
          </a>
        ))}
      </div>

      {/* CTA */}
      <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
        <a href="#" className="nav-link">
          Sign In
        </a>
        <a href="#" className="btn-primary" style={{ padding: "9px 20px", fontSize: "13px", borderRadius: "9px" }}>
          Get Started ΓåÆ
        </a>
      </div>
    </nav>
  );
}

function StatCard({
  value,
  label,
  icon,
  delay,
}: {
  value: string;
  label: string;
  icon: string;
  delay: number;
}) {
  return (
    <div
      className={`glass-card fade-in fade-in-delay-${delay}`}
      style={{ padding: "28px 32px", textAlign: "center", minWidth: 160 }}
    >
      <div style={{ fontSize: "28px", marginBottom: "10px" }}>{icon}</div>
      <div className="stat-value">{value}</div>
      <div
        style={{
          fontSize: "13px",
          color: "rgba(232,240,254,0.5)",
          marginTop: "6px",
          fontWeight: 500,
        }}
      >
        {label}
      </div>
    </div>
  );
}

function FeatureCard({
  icon,
  title,
  description,
  tag,
  tagColor,
  delay,
}: {
  icon: string;
  title: string;
  description: string;
  tag: string;
  tagColor: "green" | "blue" | "purple";
  delay: number;
}) {
  return (
    <div
      className={`glass-card glow-ring fade-in fade-in-delay-${delay}`}
      style={{ padding: "32px" }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "20px" }}>
        <div
          className="icon-wrap"
          style={{
            background:
              tagColor === "green"
                ? "rgba(0, 212, 170, 0.12)"
                : tagColor === "blue"
                ? "rgba(79, 142, 247, 0.12)"
                : "rgba(139, 92, 246, 0.12)",
          }}
        >
          {icon}
        </div>
        <span className={`badge badge-${tagColor}`}>
          <span className="dot-pulse" />
          {tag}
        </span>
      </div>
      <h3
        style={{
          fontSize: "17px",
          fontWeight: 700,
          marginBottom: "10px",
          color: "#E8F0FE",
        }}
      >
        {title}
      </h3>
      <p
        style={{
          fontSize: "14px",
          lineHeight: "1.7",
          color: "rgba(232,240,254,0.55)",
        }}
      >
        {description}
      </p>
    </div>
  );
}

function StepCard({
  step,
  title,
  description,
  color,
}: {
  step: string;
  title: string;
  description: string;
  color: string;
}) {
  return (
    <div style={{ display: "flex", gap: "20px", alignItems: "flex-start" }}>
      <div
        className="step-circle"
        style={{
          background: `${color}18`,
          border: `2px solid ${color}40`,
          color: color,
        }}
      >
        {step}
      </div>
      <div>
        <h4 style={{ fontSize: "16px", fontWeight: 700, marginBottom: "6px", color: "#E8F0FE" }}>
          {title}
        </h4>
        <p style={{ fontSize: "14px", color: "rgba(232,240,254,0.5)", lineHeight: "1.65" }}>
          {description}
        </p>
      </div>
    </div>
  );
}

function LiveDemoCard() {
  const [score, setScore] = useState(0);
  const [status, setStatus] = useState<"idle" | "analyzing" | "done">("idle");

  const handleAnalyze = () => {
    setStatus("analyzing");
    setScore(0);
    let current = 0;
    const target = 847;
    const interval = setInterval(() => {
      current += Math.floor(Math.random() * 30) + 10;
      if (current >= target) {
        current = target;
        clearInterval(interval);
        setStatus("done");
      }
      setScore(current);
    }, 80);
  };

  return (
    <div
      className="glass-card"
      style={{
        padding: "32px",
        maxWidth: "400px",
        width: "100%",
      }}
    >
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
        <span style={{ fontWeight: 700, fontSize: "15px" }}>Live Risk Analysis</span>
        <span className="badge badge-green">
          <span className="dot-pulse" />
          Live Demo
        </span>
      </div>

      {/* Score ring */}
      <div style={{ textAlign: "center", margin: "28px 0" }}>
        <div
          style={{
            width: "140px",
            height: "140px",
            borderRadius: "50%",
            border: "3px solid rgba(255,255,255,0.06)",
            background: `conic-gradient(#4F8EF7 ${(score / 900) * 360}deg, rgba(255,255,255,0.04) 0deg)`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            margin: "0 auto",
            position: "relative",
            boxShadow: status === "done" ? "0 0 40px rgba(79,142,247,0.3)" : "none",
            transition: "all 0.3s ease",
          }}
        >
          <div
            style={{
              width: "110px",
              height: "110px",
              borderRadius: "50%",
              background: "rgba(5,11,24,0.95)",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <div
              style={{
                fontSize: "32px",
                fontWeight: 800,
                background: "linear-gradient(135deg, #4F8EF7, #00D4AA)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              {score}
            </div>
            <div style={{ fontSize: "10px", color: "rgba(232,240,254,0.4)", marginTop: "2px" }}>
              CREDIT SCORE
            </div>
          </div>
        </div>

        {status === "done" && (
          <div style={{ marginTop: "16px" }}>
            <span className="badge badge-green" style={{ fontSize: "13px" }}>
              Γ£ô APPROVED ΓÇö Low Risk
            </span>
          </div>
        )}
      </div>

      {/* Metrics */}
      {[
        { label: "Document Verification", value: 100, done: status === "done" },
        { label: "Income Stability", value: 87, done: status === "done" },
        { label: "Debt-to-Income Ratio", value: 72, done: status === "done" },
      ].map((m) => (
        <div key={m.label} style={{ marginBottom: "14px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
            <span style={{ fontSize: "12px", color: "rgba(232,240,254,0.55)" }}>{m.label}</span>
            <span style={{ fontSize: "12px", fontWeight: 600, color: "#4F8EF7" }}>
              {m.done ? `${m.value}%` : "ΓÇö"}
            </span>
          </div>
          <div className="progress-bar">
            <div
              className="progress-fill"
              style={{ width: m.done ? `${m.value}%` : "0%" }}
            />
          </div>
        </div>
      ))}

      <button
        className="btn-primary"
        id="analyze-btn"
        onClick={handleAnalyze}
        disabled={status === "analyzing"}
        style={{
          width: "100%",
          marginTop: "8px",
          justifyContent: "center",
          opacity: status === "analyzing" ? 0.7 : 1,
        }}
      >
        {status === "idle" && "Γû╢ Run Analysis"}
        {status === "analyzing" && "Γƒ│ Analyzing..."}
        {status === "done" && "Γå║ Run Again"}
      </button>
    </div>
  );
}

// ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ
// Main Page
// ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ
export default function Home() {
  return (
    <>
      {/* Background layers */}
      <div className="bg-mesh" />
      <div className="bg-grid" />

      {/* Navbar */}
      <Navbar />

      <main style={{ position: "relative", zIndex: 1 }}>
        {/* ΓöÇΓöÇ HERO ΓöÇΓöÇ */}
        <section
          style={{
            minHeight: "100vh",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            padding: "120px 24px 80px",
            textAlign: "center",
          }}
        >
          {/* Announcement badge */}
          <div className="fade-in fade-in-delay-1" style={{ marginBottom: "28px" }}>
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                padding: "7px 18px",
                borderRadius: "100px",
                background: "rgba(79,142,247,0.10)",
                border: "1px solid rgba(79,142,247,0.25)",
                fontSize: "13px",
                fontWeight: 600,
                color: "#7AABFF",
              }}
            >
              <span className="dot-pulse" style={{ color: "#4F8EF7" }} />
              AI-Powered ┬╖ Real-Time ┬╖ 99.4% Accuracy
            </span>
          </div>

          {/* Headline */}
          <h1
            className="fade-in fade-in-delay-2"
            style={{
              fontSize: "clamp(40px, 6vw, 76px)",
              fontWeight: 900,
              lineHeight: "1.08",
              letterSpacing: "-2px",
              maxWidth: "820px",
              marginBottom: "24px",
            }}
          >
            Verify Loans{" "}
            <span className="gradient-text">Smarter & Faster</span>
            <br />
            with AI Intelligence
          </h1>

          {/* Subheadline */}
          <p
            className="fade-in fade-in-delay-3"
            style={{
              fontSize: "18px",
              lineHeight: "1.7",
              color: "rgba(232,240,254,0.6)",
              maxWidth: "560px",
              marginBottom: "44px",
            }}
          >
            LoanVerify AI automates document verification, credit risk scoring,
            and compliance checks ΓÇö reducing decision time from days to{" "}
            <strong style={{ color: "#00D4AA" }}>seconds</strong>.
          </p>

          {/* CTA buttons */}
          <div
            className="fade-in fade-in-delay-4"
            style={{ display: "flex", gap: "14px", flexWrap: "wrap", justifyContent: "center", marginBottom: "72px" }}
          >
            <a href="#" className="btn-primary" id="hero-cta-primary">
              ≡ƒÜÇ Start Verifying Now
            </a>
            <a href="#" className="btn-secondary" id="hero-cta-secondary">
              Γû╢ Watch Demo
            </a>
          </div>

          {/* Stats row */}
          <div
            className="fade-in fade-in-delay-5"
            style={{
              display: "flex",
              gap: "16px",
              flexWrap: "wrap",
              justifyContent: "center",
            }}
          >
            <StatCard value="2.4M+" label="Loans Processed" icon="≡ƒôï" delay={1} />
            <StatCard value="99.4%" label="Accuracy Rate" icon="≡ƒÄ»" delay={2} />
            <StatCard value="< 8s" label="Avg. Decision Time" icon="ΓÜí" delay={3} />
            <StatCard value="$8.2B" label="Disbursed Safely" icon="≡ƒÅª" delay={4} />
          </div>
        </section>

        {/* Glow divider */}
        <div className="glow-divider" style={{ maxWidth: "900px", margin: "0 auto 80px" }} />

        {/* ΓöÇΓöÇ LIVE DEMO + HOW IT WORKS ΓöÇΓöÇ */}
        <section
          style={{
            maxWidth: "1200px",
            margin: "0 auto",
            padding: "0 24px 100px",
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "60px",
            alignItems: "center",
          }}
        >
          {/* Left ΓÇö How it works */}
          <div>
            <div style={{ marginBottom: "14px" }}>
              <span className="badge badge-blue">How It Works</span>
            </div>
            <h2
              style={{
                fontSize: "clamp(28px, 4vw, 42px)",
                fontWeight: 800,
                letterSpacing: "-1px",
                lineHeight: "1.15",
                marginBottom: "16px",
              }}
            >
              From Application to{" "}
              <span className="gradient-text">Approval in 4 Steps</span>
            </h2>
            <p style={{ fontSize: "15px", color: "rgba(232,240,254,0.5)", marginBottom: "44px", lineHeight: "1.7" }}>
              Our pipeline uses multi-model AI to analyze every dimension of a loan application simultaneously.
            </p>

            <div style={{ display: "flex", flexDirection: "column", gap: "28px" }}>
              <StepCard
                step="1"
                title="Submit Application & Documents"
                description="Applicants upload their ID, income proof, and bank statements through a secure portal."
                color="#4F8EF7"
              />
              <StepCard
                step="2"
                title="AI Document Verification"
                description="OCR + vision models extract and cross-validate all document fields in real-time."
                color="#00D4AA"
              />
              <StepCard
                step="3"
                title="Credit & Risk Scoring"
                description="Our ML model generates a granular credit risk score using 200+ financial signals."
                color="#8B5CF6"
              />
              <StepCard
                step="4"
                title="Instant Decision & Disbursal"
                description="Lenders receive a detailed report and can approve or flag applications in one click."
                color="#F59E0B"
              />
            </div>
          </div>

          {/* Right ΓÇö Interactive demo */}
          <div style={{ display: "flex", justifyContent: "center" }}>
            <div className="float">
              <LiveDemoCard />
            </div>
          </div>
        </section>

        {/* ΓöÇΓöÇ FEATURES ΓöÇΓöÇ */}
        <section
          style={{
            maxWidth: "1200px",
            margin: "0 auto",
            padding: "0 24px 100px",
          }}
        >
          <div style={{ textAlign: "center", marginBottom: "60px" }}>
            <span className="badge badge-purple" style={{ marginBottom: "16px" }}>
              Features
            </span>
            <h2
              style={{
                fontSize: "clamp(28px, 4vw, 44px)",
                fontWeight: 800,
                letterSpacing: "-1px",
                lineHeight: "1.15",
              }}
            >
              Everything You Need to{" "}
              <span className="gradient-text">Verify with Confidence</span>
            </h2>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
              gap: "20px",
            }}
          >
            <FeatureCard
              icon="≡ƒöì"
              title="Intelligent OCR & Document Parsing"
              description="Accurately extracts data from PDFs, scanned documents, and photos with 99.8% field-level precision. Supports 30+ document types globally."
              tag="Live"
              tagColor="green"
              delay={1}
            />
            <FeatureCard
              icon="≡ƒºá"
              title="ML Credit Scoring Engine"
              description="Proprietary ML model trained on 10M+ loans generates explainable credit scores with 200+ behavioral and financial signals."
              tag="AI Powered"
              tagColor="blue"
              delay={2}
            />
            <FeatureCard
              icon="≡ƒ¢í∩╕Å"
              title="Fraud & Identity Detection"
              description="Multi-layer identity verification using biometric matching, liveness detection, and document tampering analysis."
              tag="Secure"
              tagColor="purple"
              delay={3}
            />
            <FeatureCard
              icon="ΓÜû∩╕Å"
              title="Regulatory Compliance Checks"
              description="Automated AML, KYC, and lending compliance screening across 40+ jurisdictions. Keeps you audit-ready automatically."
              tag="Compliant"
              tagColor="green"
              delay={4}
            />
            <FeatureCard
              icon="≡ƒôè"
              title="Real-Time Risk Dashboard"
              description="Visual analytics with drill-down into each application. Track approval rates, fraud trends, and portfolio health live."
              tag="Real-time"
              tagColor="blue"
              delay={5}
            />
            <FeatureCard
              icon="≡ƒöù"
              title="API-First Integration"
              description="RESTful APIs and webhooks integrate with any LOS, CRM, or banking core in under a day. SDKs for Python, Node, and Java."
              tag="Developer"
              tagColor="purple"
              delay={1}
            />
          </div>
        </section>

        {/* ΓöÇΓöÇ CTA BANNER ΓöÇΓöÇ */}
        <section style={{ padding: "0 24px 100px" }}>
          <div
            style={{
              maxWidth: "860px",
              margin: "0 auto",
              borderRadius: "28px",
              background: "linear-gradient(135deg, rgba(79,142,247,0.15) 0%, rgba(0,212,170,0.10) 50%, rgba(139,92,246,0.12) 100%)",
              border: "1px solid rgba(79,142,247,0.2)",
              padding: "64px 48px",
              textAlign: "center",
              position: "relative",
              overflow: "hidden",
            }}
          >
            {/* Shimmer overlay */}
            <div
              className="shimmer"
              style={{
                position: "absolute",
                inset: 0,
                borderRadius: "28px",
                pointerEvents: "none",
              }}
            />

            <h2
              style={{
                fontSize: "clamp(26px, 4vw, 42px)",
                fontWeight: 800,
                letterSpacing: "-1px",
                marginBottom: "16px",
              }}
            >
              Ready to Modernize Your{" "}
              <span className="gradient-text">Loan Pipeline?</span>
            </h2>
            <p
              style={{
                fontSize: "16px",
                color: "rgba(232,240,254,0.6)",
                marginBottom: "36px",
                maxWidth: "480px",
                margin: "0 auto 36px",
                lineHeight: "1.7",
              }}
            >
              Join 500+ financial institutions that trust LoanVerify AI to make faster, safer lending decisions.
            </p>
            <div style={{ display: "flex", gap: "14px", justifyContent: "center", flexWrap: "wrap" }}>
              <a href="#" className="btn-primary" id="cta-start-free">
                ≡ƒÄ» Start Free Trial
              </a>
              <a href="#" className="btn-secondary" id="cta-contact-sales">
                ≡ƒÆ¼ Contact Sales
              </a>
            </div>
          </div>
        </section>

        {/* ΓöÇΓöÇ FOOTER ΓöÇΓöÇ */}
        <footer
          style={{
            borderTop: "1px solid rgba(255,255,255,0.06)",
            padding: "40px 24px",
            textAlign: "center",
            color: "rgba(232,240,254,0.3)",
            fontSize: "13px",
          }}
        >
          <div style={{ marginBottom: "16px", display: "flex", justifyContent: "center", gap: "8px", alignItems: "center" }}>
            <div
              style={{
                width: 28,
                height: 28,
                borderRadius: "8px",
                background: "linear-gradient(135deg, #4F8EF7, #00D4AA)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "14px",
              }}
            >
              Γ£ª
            </div>
            <span style={{ fontWeight: 700, color: "rgba(232,240,254,0.6)" }}>LoanVerify AI</span>
          </div>
          <p>┬⌐ 2026 LoanVerify AI. Built for the future of lending.</p>
        </footer>
      </main>
    </>
  );
}
