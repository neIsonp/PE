"use client";

import { FormEvent, useState } from "react";
import { submitContactMessage } from "@/lib/api-client";

type Feedback = {
  type: "success" | "error";
  message: string;
} | null;

export function ContactSection() {
  const [message, setMessage] = useState("");
  const [feedback, setFeedback] = useState<Feedback>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    // Capture the form element before any await — React nullifies event.currentTarget
    // after the synchronous portion of an async handler returns.
    const formEl = event.currentTarget;
    const formData = new FormData(formEl);
    const firstName = String(formData.get("first-name") ?? "");
    const lastName = String(formData.get("last-name") ?? "");
    const email = String(formData.get("email") ?? "");
    const countryCode = String(formData.get("country-code") ?? "");
    const phone = String(formData.get("phone") ?? "");

    if (!email.includes("@") || phone.replace(/\D/g, "").length < 6) {
      setFeedback({
        type: "error",
        message: "Confirme o email e o contacto telefónico antes de enviar."
      });
      return;
    }

    try {
      await submitContactMessage({
        firstName,
        lastName,
        email,
        phone: `${countryCode} ${phone}`,
        message
      });
      setFeedback({
        type: "success",
        message: "Mensagem enviada e registada na API."
      });
      formEl.reset();
      setMessage("");
    } catch (error) {
      setFeedback({
        type: "error",
        message: error instanceof Error ? error.message : "Não foi possível enviar a mensagem."
      });
    }
  }

  return (
    <section id="contactos" className="section">
      <div className="container">
        <h2 className="section__title">Contactos</h2>
        <p className="section__description">
          Fale connosco. Estamos aqui para ajudar e esclarecer qualquer dúvida.
        </p>

        <div className="contact-top">
          <div className="contact-info">
            <h2 className="contact-info__title">Contacte-nos</h2>
            <p className="contact-info__subtitle">
              Envie-nos um email, ligue ou preencha o formulário para saber como o CACA pode
              apoiar a sua investigação ou colaboração.
            </p>

            <div className="contact-info__item">
              <i className="fi fi-rr-envelope" />
              <span>geral@caca.uac.pt</span>
            </div>
            <div className="contact-info__item">
              <i className="fi fi-rr-phone-call" />
              <span>+351 296 650 000</span>
            </div>
            <div className="contact-info__item">
              <i className="fi fi-rr-marker" />
              <span>Campus de Ponta Delgada, Rua da Mãe de Deus, 9500-321</span>
            </div>

            <a href="#contactos" className="contact-info__link">
              Suporte ao Investigador
            </a>
          </div>

          <div className="contact-form-card">
            <h3 className="contact-form-card__title">Fale Connosco</h3>
            <p className="contact-form-card__subtitle">Pode contactar-nos a qualquer momento</p>

            <form className="c-form" aria-label="Formulário de contacto" onSubmit={handleSubmit}>
              <div className="c-form__row">
                <div className="c-form__group">
                  <label className="sr-only" htmlFor="first-name">
                    Primeiro nome
                  </label>
                  <div className="c-form__input-wrap">
                    <input
                      type="text"
                      id="first-name"
                      name="first-name"
                      className="c-form__input c-form__input--no-icon"
                      placeholder="Primeiro nome"
                      required
                    />
                  </div>
                </div>
                <div className="c-form__group">
                  <label className="sr-only" htmlFor="last-name">
                    Apelido
                  </label>
                  <div className="c-form__input-wrap">
                    <input
                      type="text"
                      id="last-name"
                      name="last-name"
                      className="c-form__input c-form__input--no-icon"
                      placeholder="Apelido"
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="c-form__group">
                <label className="sr-only" htmlFor="email">
                  Endereço de email
                </label>
                <div className="c-form__input-wrap">
                  <i className="fi fi-rr-envelope c-form__icon" />
                  <input
                    type="email"
                    id="email"
                    name="email"
                    className="c-form__input"
                    placeholder="O seu email"
                    required
                  />
                </div>
              </div>

              <div className="c-form__group">
                <label className="sr-only" htmlFor="phone">
                  Telemóvel
                </label>
                <div className="c-form__phone-row">
                  <div className="c-form__phone-select-wrap">
                    <i className="fi fi-rr-phone-call c-form__icon" />
                    <select
                      id="country-code"
                      name="country-code"
                      className="c-form__phone-select"
                      aria-label="Indicativo"
                      defaultValue="+351"
                    >
                      <option value="+351">+351</option>
                      <option value="+55">+55</option>
                      <option value="+34">+34</option>
                      <option value="+44">+44</option>
                      <option value="+1">+1</option>
                    </select>
                  </div>
                  <div className="c-form__input-wrap c-form__phone-input">
                    <input
                      type="tel"
                      id="phone"
                      name="phone"
                      className="c-form__input c-form__input--no-icon"
                      placeholder="Número de telemóvel"
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="c-form__group">
                <label className="sr-only" htmlFor="message">
                  Mensagem
                </label>
                <div className="c-form__textarea-wrap">
                  <textarea
                    id="message"
                    name="message"
                    className="c-form__input c-form__textarea"
                    placeholder="Como podemos ajudar?"
                    minLength={10}
                    maxLength={500}
                    value={message}
                    onChange={(event) => setMessage(event.target.value)}
                    required
                  />
                  <span className="c-form__char-count">{message.length}/500</span>
                </div>
              </div>

              <button type="submit" className="c-form__submit">
                Enviar Mensagem
              </button>

              {feedback ? (
                <p className={`form-feedback form-feedback--${feedback.type}`} role="status" aria-live="polite">
                  {feedback.message}
                </p>
              ) : null}

              <p className="c-form__terms">
                Ao contactar-nos, concorda com os nossos <a href="#termos">Termos de Uso</a> e{" "}
                <a href="#privacidade">Política de Privacidade</a>
              </p>
            </form>
          </div>
        </div>

        <div className="contact-bottom-cards">
          <div className="contact-bottom-card">
            <h4 className="contact-bottom-card__title">Suporte Geral</h4>
            <p className="contact-bottom-card__text">
              A nossa equipa de suporte está disponível para esclarecer qualquer dúvida ou questão
              que possa ter.
            </p>
          </div>
          <div className="contact-bottom-card">
            <h4 className="contact-bottom-card__title">Investigação e Parcerias</h4>
            <p className="contact-bottom-card__text">
              Valorizamos a colaboração e estamos sempre abertos a novas parcerias. O seu
              contributo é essencial para o futuro do CACA.
            </p>
          </div>
          <div className="contact-bottom-card">
            <h4 className="contact-bottom-card__title">Comunicação e Media</h4>
            <p className="contact-bottom-card__text">
              Para questões relacionadas com media ou imprensa, contacte-nos através de
              geral@caca.uac.pt.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
