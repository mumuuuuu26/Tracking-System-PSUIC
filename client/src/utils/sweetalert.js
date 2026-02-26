import Swal from 'sweetalert2';

const SWAL_BASE_CLASS = {
  popup: "rounded-3xl p-4 sm:p-6 w-[min(90vw,32rem)]",
  title: "text-xl font-bold text-[#1e2e4a]",
  htmlContainer: "text-gray-500",
  cancelButton:
    "bg-white text-gray-500 border border-gray-200 px-6 py-2.5 rounded-xl font-bold hover:bg-gray-50 transition-colors",
  actions: "gap-3",
};

const SWAL_PRIMARY_BUTTON_CLASS =
  "bg-[#1e2e4a] text-white px-5 sm:px-6 py-2.5 rounded-xl font-bold shadow-lg shadow-blue-900/20 hover:bg-[#15325b] transition-all";
const SWAL_DANGER_BUTTON_CLASS =
  "bg-[#c76572] text-white px-5 sm:px-6 py-2.5 rounded-xl font-bold shadow-lg shadow-rose-200/50 hover:bg-[#b85a66] transition-all";

const getConfirmButtonClass = (variant = "primary") =>
  variant === "danger" ? SWAL_DANGER_BUTTON_CLASS : SWAL_PRIMARY_BUTTON_CLASS;

const blurActiveElement = () => {
  if (typeof document === "undefined") return;
  const active = document.activeElement;
  if (active && typeof active.blur === "function") {
    active.blur();
  }
};

const releaseSweetAlertLocks = () => {
  if (typeof document === "undefined") return;
  if (typeof Swal?.isVisible === "function" && Swal.isVisible()) return;

  const bodyEl = document.body;
  const htmlEl = document.documentElement;
  const rootEl = document.getElementById("root");
  if (!bodyEl || !htmlEl) return;

  bodyEl.classList.remove("swal2-shown", "swal2-height-auto", "swal2-no-backdrop");
  htmlEl.classList.remove("swal2-shown", "swal2-height-auto");

  bodyEl.style.removeProperty("overflow");
  bodyEl.style.removeProperty("overflow-y");
  bodyEl.style.removeProperty("padding-right");
  bodyEl.style.removeProperty("position");
  bodyEl.style.removeProperty("top");
  bodyEl.style.removeProperty("width");
  bodyEl.style.removeProperty("height");

  htmlEl.style.removeProperty("overflow");
  htmlEl.style.removeProperty("overflow-y");
  htmlEl.style.removeProperty("height");

  rootEl?.removeAttribute("aria-hidden");
  rootEl?.removeAttribute("inert");
};

const escapeHtml = (value = "") =>
  String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

const toNoWrapHtml = (value = "") =>
  `<span class="inline-block whitespace-nowrap">${escapeHtml(value).replaceAll(" ", "&nbsp;")}</span>`;

export const showPopup = async ({
  title,
  text,
  html,
  footer,
  icon = "info",
  confirmButtonText = "OK",
  cancelButtonText = "Cancel",
  showCancelButton = false,
  confirmVariant = "primary",
  allowOutsideClick = true,
  focusCancel = true,
  htmlContainerClass = SWAL_BASE_CLASS.htmlContainer,
}) => {
  blurActiveElement();
  const result = await Swal.fire({
    title,
    text,
    html,
    footer,
    icon,
    showCancelButton,
    confirmButtonText,
    cancelButtonText,
    allowOutsideClick,
    focusCancel,
    customClass: {
      ...SWAL_BASE_CLASS,
      htmlContainer: htmlContainerClass,
      confirmButton: getConfirmButtonClass(confirmVariant),
    },
    buttonsStyling: false,
    willClose: () => {
      requestAnimationFrame(releaseSweetAlertLocks);
    },
    didClose: () => {
      requestAnimationFrame(releaseSweetAlertLocks);
    },
    didDestroy: () => {
      requestAnimationFrame(releaseSweetAlertLocks);
    },
  });

  requestAnimationFrame(releaseSweetAlertLocks);
  return result;
};

export const confirmDialog = async ({
  title,
  text,
  icon = "warning",
  confirmButtonText = "Confirm",
  cancelButtonText = "Cancel",
  confirmVariant = "primary",
  singleLineText = false,
}) => {
  const htmlContainerClass = singleLineText
    ? "text-gray-500 text-[clamp(0.95rem,3.6vw,1.35rem)] leading-tight whitespace-nowrap !mx-auto w-fit"
    : SWAL_BASE_CLASS.htmlContainer;

  const result = await showPopup({
    title,
    text: singleLineText ? undefined : text,
    html: singleLineText ? toNoWrapHtml(text) : undefined,
    icon,
    showCancelButton: true,
    confirmButtonText,
    cancelButtonText,
    confirmVariant,
    htmlContainerClass,
  });

  return result.isConfirmed;
};

export const promptRejectReason = async ({
  title = "Reject Ticket?",
  text = "Please provide a reason for rejecting this ticket.",
  placeholder = "Reason for rejection...",
  confirmButtonText = "Reject",
}) => {
  blurActiveElement();
  const result = await Swal.fire({
    title,
    text,
    icon: "warning",
    input: "textarea",
    inputPlaceholder: placeholder,
    inputAttributes: {
      "aria-label": placeholder,
      maxlength: "500",
      rows: "3",
    },
    showCancelButton: true,
    confirmButtonText,
    cancelButtonText: "Cancel",
    reverseButtons: true,
    customClass: {
      ...SWAL_BASE_CLASS,
      popup: "rounded-3xl p-4 sm:p-6 w-[min(92vw,30rem)]",
      icon: "scale-[0.82] sm:scale-100 !my-1",
      title: "text-xl sm:text-2xl font-bold text-[#1e2e4a] !mt-1 !mb-0",
      htmlContainer: "text-gray-500 text-sm sm:text-base !mt-2 !mb-0",
      input:
        "!mx-auto !mt-3 !mb-2 !w-[92%] sm:!w-[88%] box-border h-auto min-h-[3.5rem] max-h-[9rem] resize-y bg-gray-50 border border-gray-200 rounded-xl p-2.5 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-0 focus:border-gray-300",
      actions: "gap-3 !mt-1 !mb-0 w-full justify-center",
      confirmButton: SWAL_DANGER_BUTTON_CLASS,
      cancelButton:
        "bg-white text-gray-500 border border-gray-200 px-5 sm:px-6 py-2.5 rounded-xl font-bold hover:bg-gray-50 transition-colors",
    },
    preConfirm: (value) => {
      const normalized = String(value ?? "").trim();
      if (!normalized) {
        Swal.showValidationMessage("Please provide a reason");
        return null;
      }
      return normalized;
    },
    buttonsStyling: false,
    willClose: () => {
      requestAnimationFrame(releaseSweetAlertLocks);
    },
    didClose: () => {
      requestAnimationFrame(releaseSweetAlertLocks);
    },
    didDestroy: () => {
      requestAnimationFrame(releaseSweetAlertLocks);
    },
  });

  requestAnimationFrame(releaseSweetAlertLocks);
  return result.isConfirmed ? result.value : null;
};

export const confirmLogout = () =>
  confirmDialog({
    title: "Confirm Logout",
    text: "Are you sure you want to log out?",
    icon: "warning",
    confirmButtonText: "Log out",
    cancelButtonText: "Cancel",
    confirmVariant: "primary",
    singleLineText: true,
  });
