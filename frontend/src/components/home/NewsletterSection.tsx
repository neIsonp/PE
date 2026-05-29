"use client";

import { FormEvent, useState } from "react";
import { subscribeNewsletter } from "@/services/api";

export function NewsletterSection() {
  const [email, setEmail] = useState("");
  const [feedback, setFeedback] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setFeedback("Indique um email válido para subscrever.");
      return;
    }

    try {
      await subscribeNewsletter(email);
      setFeedback("Subscrição registada com sucesso na API.");
      setEmail("");
    } catch (error) {
      setFeedback(error instanceof Error ? error.message : "Não foi possível subscrever.");
    }
  }

  return (
    <section id="newsletter" className="newsletter-new-section">
      <div className="newsletter-new-container">
        <div className="newsletter-new-content">
          <h2 className="newsletter-new-title">
            Mantenha-se Atualizado
            <br />
            com a Nossa Newsletter!
          </h2>
          <p className="newsletter-new-text">
            Receba as últimas novidades, eventos e avanços na investigação clínica diretamente no seu e-mail.
          </p>
        </div>

        <form id="newsletter-form" className="newsletter-new-form" onSubmit={handleSubmit}>
          <label className="newsletter-new-label" htmlFor="news-email">
            Email para newsletter
          </label>
          <div className="newsletter-new-form__pill">
            <input
              type="email"
              id="news-email"
              className="newsletter-new-input"
              placeholder="nome@email.com"
              aria-label="Email para newsletter"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
            />
            <button type="submit" className="newsletter-new-btn">
              Subscrever →
            </button>
          </div>
          <div className="newsletter-new-disclaimer" id="newsletter-feedback" role="status" aria-live="polite">
            {feedback}
          </div>
        </form>

        <div className="newsletter-new-proof">
          <div className="newsletter-new-proof__avatars">
            <span className="newsletter-new-proof__dot" style={{ background: "var(--azul-500)" }}>
              C
            </span>
            <span className="newsletter-new-proof__dot" style={{ background: "var(--azul-700)" }}>
              A
            </span>
            <span className="newsletter-new-proof__dot" style={{ background: "var(--azul-400)" }}>
              C
            </span>
            <span className="newsletter-new-proof__dot" style={{ background: "var(--azul-600)" }}>
              A
            </span>
          </div>
          <span className="newsletter-new-proof__text">+500 investigadores já subscreveram</span>
        </div>
      </div>
    </section>
  );
}
