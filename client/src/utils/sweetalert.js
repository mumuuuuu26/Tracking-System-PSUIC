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
}) =>
  Swal.fire({
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
      confirmButton: getConfirmButtonClass(confirmVariant),
    },
    buttonsStyling: false,
  });

export const confirmDialog = async ({
  title,
  text,
  icon = "warning",
  confirmButtonText = "Confirm",
  cancelButtonText = "Cancel",
  confirmVariant = "primary",
}) => {
  const result = await showPopup({
    title,
    text,
    icon,
    showCancelButton: true,
    confirmButtonText,
    cancelButtonText,
    confirmVariant,
  });

  return result.isConfirmed;
};

export const promptRejectReason = async ({
  title = "Reject Ticket?",
  text = "Please provide a reason for rejecting this ticket.",
  placeholder = "Reason for rejection...",
  confirmButtonText = "Reject",
}) => {
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
  });

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
  });
