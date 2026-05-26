const data = {
  corporativo: {
    image: "assets/placeholders/hero-corporativo.svg",
    title: "Paisagismo corporativo que <strong>valoriza o ativo</strong> e fortalece a imagem da empresa.",
    copy: "Projetos, implantacao e manutencao especializada para recepcoes, fachadas, areas comuns e sedes que precisam comunicar cuidado, solidez e criterio.",
    alt: "Projeto de paisagismo corporativo em area de chegada"
  },
  predial: {
    image: "assets/placeholders/predial.svg",
    title: "Paisagismo predial que eleva areas comuns e aumenta a <strong>percepcao de valor</strong> do condominio.",
    copy: "Solucoes para condominios premium, administradoras e sindicos profissionais que precisam de fachadas, acessos e jardins sempre apresentaveis.",
    alt: "Projeto de paisagismo para condominio premium"
  }
};

const siteConfig = {
  // Preencher antes de publicar. Exemplo: "5511999999999".
  whatsappNumber: "",
  formEndpoint: ""
};

const root = document.documentElement;
const cursor = document.querySelector(".cursor");
const header = document.querySelector("[data-header]");
const menuToggle = document.querySelector("[data-menu-toggle]");
const nav = document.querySelector("[data-nav]");
const heroImage = document.querySelector("#heroImage");
const heroTitle = document.querySelector("#hero-title");
const heroCopy = document.querySelector(".hero-copy");
const segmentInput = document.querySelector("#segmentInput");
const floatingWhatsapp = document.querySelector(".floating-whatsapp");
const floatingImages = document.querySelectorAll("[data-float-image]");
const floatingCards = document.querySelectorAll("[data-float-card]");
const shiftCaption = document.querySelector("[data-shift-caption]");
const whatsappModal = document.querySelector("[data-whatsapp-modal]");
const whatsappForm = document.querySelector("[data-whatsapp-form]");
const whatsappStatus = document.querySelector("[data-whatsapp-status]");
const hasFinePointer = window.matchMedia("(pointer: fine)").matches;
let lastFocusedElement = null;
let whatsappClickSource = "whatsapp";
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

const isValidEmail = (email) => emailPattern.test(String(email).trim());

const getTrackingData = (source = whatsappClickSource) => {
  const params = new URLSearchParams(window.location.search);
  return {
    origem: source,
    pagina: window.location.href,
    referrer: document.referrer,
    utm_source: params.get("utm_source") || "",
    utm_medium: params.get("utm_medium") || "",
    utm_campaign: params.get("utm_campaign") || "",
    utm_content: params.get("utm_content") || "",
    utm_term: params.get("utm_term") || ""
  };
};

const setModalTrackingFields = (source) => {
  const tracking = getTrackingData(source);

  Object.entries(tracking).forEach(([key, value]) => {
    const field = whatsappForm.querySelector(`[data-track-field="${key}"]`);
    if (field) field.value = value;
  });
};

const pushLeadEvent = (eventName, detail = {}) => {
  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push({
    event: eventName,
    lead_channel: "whatsapp",
    lead_origin: whatsappClickSource,
    page_path: window.location.pathname,
    ...getTrackingData(),
    ...detail
  });
};

const buildWhatsappUrl = (formData) => {
  const number = siteConfig.whatsappNumber.replace(/\D/g, "");
  if (!number) return "";

  const message = [
    "Olá, gostaria de falar com a Kawai Garden.",
    `Nome: ${formData.get("nome")}`,
    `Telefone: ${formData.get("telefone")}`,
    `Email: ${formData.get("email")}`,
    `Projeto: ${formData.get("tipo_projeto")}`,
    `Espaço: ${formData.get("tipo_espaco")}`,
    `Momento: ${formData.get("momento_projeto")}`
  ].join("\n");

  return `https://wa.me/${number}?text=${encodeURIComponent(message)}`;
};

const openWhatsappModal = (source, trigger) => {
  if (!whatsappModal || !whatsappForm) return;

  whatsappClickSource = source || "whatsapp";
  lastFocusedElement = trigger || document.activeElement;
  setModalTrackingFields(whatsappClickSource);
  whatsappStatus.textContent = "";
  whatsappModal.hidden = false;
  document.body.classList.add("modal-open");
  pushLeadEvent("whatsapp_modal_open");

  requestAnimationFrame(() => {
    whatsappForm.querySelector("input[name='nome']").focus();
  });
};

const closeWhatsappModal = () => {
  if (!whatsappModal) return;

  whatsappModal.hidden = true;
  document.body.classList.remove("modal-open");
  whatsappStatus.textContent = "";

  if (lastFocusedElement) lastFocusedElement.focus();
};

document.querySelectorAll("[data-whatsapp-link]").forEach((link) => {
  const label = link.textContent.trim().toLowerCase().replace(/\s+/g, "_") || "whatsapp";
  link.setAttribute("href", "#whatsapp");
  link.removeAttribute("target");
  link.removeAttribute("rel");

  link.addEventListener("click", (event) => {
    event.preventDefault();
    openWhatsappModal(label, link);
  });
});

document.querySelectorAll("[data-whatsapp-close]").forEach((element) => {
  element.addEventListener("click", closeWhatsappModal);
});

if (whatsappForm) {
  whatsappForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const button = whatsappForm.querySelector("button[type='submit']");
    const original = button.textContent;
    const formData = new FormData(whatsappForm);
    const whatsappUrl = buildWhatsappUrl(formData);

    if (!isValidEmail(formData.get("email"))) {
      whatsappStatus.textContent = "Informe um email válido para continuar.";
      whatsappForm.querySelector("input[name='email']").focus();
      pushLeadEvent("whatsapp_lead_invalid_email");
      return;
    }

    if (!whatsappUrl) {
      whatsappStatus.textContent = "Configurar o número oficial de WhatsApp antes de publicar.";
      pushLeadEvent("whatsapp_lead_missing_number");
      return;
    }

    const whatsappWindow = window.open("", "_blank", "noopener");
    button.disabled = true;
    button.textContent = "Preparando contato...";
    whatsappStatus.textContent = "Registrando suas informações antes de abrir o WhatsApp.";

    pushLeadEvent("whatsapp_lead_submit", {
      tipo_projeto: formData.get("tipo_projeto"),
      tipo_espaco: formData.get("tipo_espaco"),
      momento_projeto: formData.get("momento_projeto")
    });

    if (siteConfig.formEndpoint) {
      formData.append("lead_type", "whatsapp_modal");
      formData.append("lead_channel", "whatsapp");

      try {
        const response = await fetch(siteConfig.formEndpoint, {
          method: "POST",
          body: formData
        });

        if (!response.ok) throw new Error("Falha no envio");
        pushLeadEvent("whatsapp_lead_sent");
      } catch (error) {
        pushLeadEvent("whatsapp_lead_send_error");
      }
    }

    pushLeadEvent("whatsapp_redirect");

    if (whatsappWindow) {
      whatsappWindow.location.href = whatsappUrl;
    } else {
      window.location.href = whatsappUrl;
    }

    whatsappForm.reset();
    button.disabled = false;
    button.textContent = original;
    closeWhatsappModal();
  });
}

window.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && whatsappModal && !whatsappModal.hidden) {
    closeWhatsappModal();
  }
});

if (hasFinePointer) {
  const cursorPosition = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
  const cursorLag = { x: cursorPosition.x, y: cursorPosition.y };
  const hoverTargets = "a, button, input, select, textarea, summary, .step, .outcome, .case-card, .feature-caption, .faq-item";

  window.addEventListener("pointermove", (event) => {
    cursorPosition.x = event.clientX;
    cursorPosition.y = event.clientY;
    root.style.setProperty("--cursor-x", `${event.clientX}px`);
    root.style.setProperty("--cursor-y", `${event.clientY}px`);
  });

  const renderCursor = () => {
    cursorLag.x += (cursorPosition.x - cursorLag.x) * 0.12;
    cursorLag.y += (cursorPosition.y - cursorLag.y) * 0.12;
    root.style.setProperty("--cursor-lag-x", `${cursorLag.x}px`);
    root.style.setProperty("--cursor-lag-y", `${cursorLag.y}px`);
    requestAnimationFrame(renderCursor);
  };

  renderCursor();

  document.querySelectorAll(hoverTargets).forEach((element) => {
    element.addEventListener("pointerenter", () => cursor.classList.add("is-hovering"));
    element.addEventListener("pointerleave", () => cursor.classList.remove("is-hovering"));
  });
}

const getPagePad = () => Math.max(20, Math.min(window.innerWidth * 0.04, 64));

const setCaptionTravel = () => {
  if (!shiftCaption) return;
  const section = shiftCaption.closest(".feature-image");
  const sectionBox = section.getBoundingClientRect();
  const captionBox = shiftCaption.getBoundingClientRect();
  const travel = Math.max(0, sectionBox.width - captionBox.width - getPagePad() * 2);
  shiftCaption.style.setProperty("--caption-travel", `${travel}px`);
};

setCaptionTravel();
window.addEventListener("resize", setCaptionTravel);

if (hasFinePointer && shiftCaption) {
  let captionIsTraveling = false;

  shiftCaption.addEventListener("pointerenter", () => {
    if (captionIsTraveling) return;
    captionIsTraveling = true;
    setCaptionTravel();
    shiftCaption.classList.toggle("is-shifted");
    shiftCaption.classList.add("is-traveling");

    window.setTimeout(() => {
      captionIsTraveling = false;
      shiftCaption.classList.remove("is-traveling");
    }, 1220);
  });
}

window.addEventListener("scroll", () => {
  const scrollY = window.scrollY;
  header.classList.toggle("is-scrolled", scrollY > 24);
  floatingWhatsapp.classList.toggle("is-visible", scrollY > window.innerHeight * 0.72);
  root.style.setProperty("--hero-y", `${scrollY * 0.08}px`);
  floatingImages.forEach((image) => {
    const box = image.getBoundingClientRect();
    const center = box.top + box.height / 2 - window.innerHeight / 2;
    const movement = Math.max(-34, Math.min(34, center * -0.045));
    image.style.setProperty("--float-y", `${movement}px`);
  });
  floatingCards.forEach((card) => {
    const box = card.getBoundingClientRect();
    const center = box.top + box.height / 2 - window.innerHeight / 2;
    const movement = Math.max(-14, Math.min(14, center * -0.018));
    card.style.setProperty("--card-y", `${movement}px`);
  });
}, { passive: true });

document.querySelectorAll(".segment-button").forEach((button) => {
  button.addEventListener("click", () => {
    const segment = button.dataset.segment;
    const content = data[segment];

    document.querySelectorAll(".segment-button").forEach((item) => {
      item.classList.toggle("is-active", item === button);
    });

    heroImage.src = content.image;
    heroImage.alt = content.alt;
    heroTitle.innerHTML = content.title;
    heroCopy.textContent = content.copy;
    segmentInput.value = segment;
  });
});

menuToggle.addEventListener("click", () => {
  const isOpen = header.classList.toggle("is-menu-open");
  menuToggle.setAttribute("aria-expanded", String(isOpen));
});

nav.querySelectorAll("a").forEach((link) => {
  link.addEventListener("click", () => {
    header.classList.remove("is-menu-open");
    menuToggle.setAttribute("aria-expanded", "false");
  });
});

window.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    header.classList.remove("is-menu-open");
    menuToggle.setAttribute("aria-expanded", "false");
  }
});

if (hasFinePointer) {
  document.querySelectorAll(".magnetic").forEach((element) => {
    element.addEventListener("pointermove", (event) => {
      const box = element.getBoundingClientRect();
      const x = event.clientX - box.left - box.width / 2;
      const y = event.clientY - box.top - box.height / 2;
      element.style.transform = `translate(${x * 0.12}px, ${y * 0.12}px)`;
    });

    element.addEventListener("pointerleave", () => {
      element.style.transform = "";
    });
  });
}

const observer = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      entry.target.classList.add("is-visible");
      observer.unobserve(entry.target);
    }
  });
}, { threshold: 0.18 });

document.querySelectorAll(".reveal").forEach((element) => observer.observe(element));

document.querySelectorAll(".faq-item summary").forEach((summary) => {
  summary.addEventListener("click", (event) => {
    event.preventDefault();
    const current = summary.parentElement;
    const shouldOpen = !current.open;

    document.querySelectorAll(".faq-item").forEach((item) => {
      if (item !== current) item.open = false;
    });

    current.open = shouldOpen;
  });
});

document.querySelector("[data-form='lead']").addEventListener("submit", async (event) => {
  event.preventDefault();
  const form = event.currentTarget;
  const button = form.querySelector("button[type='submit']");
  const original = button.textContent;
  const emailField = form.querySelector("input[name='email']");

  if (!isValidEmail(emailField.value)) {
    button.textContent = "Informe um email válido";
    emailField.focus();
    setTimeout(() => {
      button.textContent = original;
    }, 2600);
    return;
  }

  if (!siteConfig.formEndpoint) {
    button.textContent = "Endpoint do formulario pendente";
    setTimeout(() => {
      button.textContent = original;
    }, 2600);
    return;
  }

  button.disabled = true;
  button.textContent = "Enviando...";

  try {
    const response = await fetch(siteConfig.formEndpoint, {
      method: "POST",
      body: new FormData(form)
    });

    if (!response.ok) throw new Error("Falha no envio");

    form.reset();
    button.textContent = "Solicitacao enviada";
  } catch (error) {
    button.textContent = "Erro ao enviar. Tente novamente";
  } finally {
    setTimeout(() => {
      button.disabled = false;
      button.textContent = original;
    }, 2600);
  }
});
