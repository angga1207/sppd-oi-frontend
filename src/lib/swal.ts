import Swal from 'sweetalert2';

/**
 * Bubble Gum themed SweetAlert2 utility
 * Custom styled alerts & confirmations matching the app's pink/purple/blue gradient theme
 */

// ─── Base Mixin ─────────────────────────────────────────────
const BubbleGumSwal = Swal.mixin({
    customClass: {
        popup: 'swal-bubblegum-popup',
        title: 'swal-bubblegum-title',
        htmlContainer: 'swal-bubblegum-html',
        confirmButton: 'swal-bubblegum-confirm',
        cancelButton: 'swal-bubblegum-cancel',
        denyButton: 'swal-bubblegum-deny',
        actions: 'swal-bubblegum-actions',
    },
    buttonsStyling: false,
    showClass: {
        popup: 'animate__animated animate__fadeInUp animate__faster',
    },
    hideClass: {
        popup: 'animate__animated animate__fadeOutDown animate__faster',
    },
});

// ─── Toast Mixin ────────────────────────────────────────────
const BubbleGumToast = Swal.mixin({
    toast: true,
    position: 'top-end',
    showConfirmButton: false,
    timer: 3000,
    timerProgressBar: true,
    backdrop: false,
    customClass: {
        popup: 'swal-bubblegum-toast',
        title: 'swal-bubblegum-toast-title',
        timerProgressBar: 'swal-bubblegum-progress',
    },
    showClass: {
        popup: 'animate__animated animate__slideInRight animate__faster',
    },
    hideClass: {
        popup: 'animate__animated animate__slideOutRight animate__faster',
    },
    didOpen: (toast) => {
        toast.onmouseenter = Swal.stopTimer;
        toast.onmouseleave = Swal.resumeTimer;
    },
});

// ─── Confirmation Dialog ────────────────────────────────────
export async function swalConfirm(
    title: string,
    text?: string,
    options?: {
        confirmText?: string;
        cancelText?: string;
        icon?: 'warning' | 'question' | 'info';
        isDanger?: boolean;
    }
): Promise<boolean> {
    const result = await BubbleGumSwal.fire({
        title,
        text,
        icon: options?.icon ?? 'question',
        iconColor: options?.isDanger ? '#ef4444' : '#d946a8',
        showCancelButton: true,
        confirmButtonText: options?.confirmText ?? 'Ya, Lanjutkan',
        cancelButtonText: options?.cancelText ?? 'Batal',
        reverseButtons: true,
        focusCancel: true,
        customClass: {
            popup: 'swal-bubblegum-popup',
            title: 'swal-bubblegum-title',
            htmlContainer: 'swal-bubblegum-html',
            confirmButton: options?.isDanger ? 'swal-bubblegum-danger' : 'swal-bubblegum-confirm',
            cancelButton: 'swal-bubblegum-cancel',
            actions: 'swal-bubblegum-actions',
        },
    });
    return result.isConfirmed;
}

// ─── Success Toast ──────────────────────────────────────────
export function swalSuccess(title: string, text?: string) {
    return BubbleGumToast.fire({
        icon: 'success',
        iconColor: '#10b981',
        title,
        text,
    });
}

// ─── Error Alert ────────────────────────────────────────────
export function swalError(title: string, text?: string) {
    return BubbleGumSwal.fire({
        icon: 'error',
        iconColor: '#ef4444',
        title,
        text,
        confirmButtonText: 'Tutup',
    });
}

// ─── Warning Alert ──────────────────────────────────────────
export function swalWarning(title: string, text?: string) {
    return BubbleGumSwal.fire({
        icon: 'warning',
        iconColor: '#f59e0b',
        title,
        text,
        confirmButtonText: 'Mengerti',
    });
}

// ─── Info Alert ─────────────────────────────────────────────
export function swalInfo(title: string, text?: string) {
    return BubbleGumSwal.fire({
        icon: 'info',
        iconColor: '#8b5cf6',
        title,
        text,
        confirmButtonText: 'OK',
    });
}

// ─── Loading ────────────────────────────────────────────────
export function swalLoading(title?: string) {
    BubbleGumSwal.fire({
        title: title ?? 'Memproses...',
        allowOutsideClick: false,
        allowEscapeKey: false,
        showConfirmButton: false,
        didOpen: () => {
            Swal.showLoading();
        },
        customClass: {
            popup: 'swal-bubblegum-popup',
            title: 'swal-bubblegum-title',
        },
    });
}

export function swalClose() {
    Swal.close();
}

export { BubbleGumSwal, BubbleGumToast };
export default Swal;
