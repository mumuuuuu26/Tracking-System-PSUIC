import Swal from 'sweetalert2';

export const confirmLogout = async () => {
    const result = await Swal.fire({
        title: 'Confirm Logout',
        text: "Are you sure you want to log out?",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#1e2e4a', // Dark blue from the screenshot/theme
        cancelButtonColor: '#ffffff',
        confirmButtonText: 'Log out',
        cancelButtonText: 'Cancel',
        reverseButtons: false, // Swapped to put Logout first (Left) and Cancel second (Right)
        customClass: {
            popup: 'rounded-3xl p-6', // Rounded corners
            title: 'text-xl font-bold text-[#1e2e4a]',
            htmlContainer: 'text-gray-500',
            confirmButton: 'bg-[#1e2e4a] text-white px-6 py-2.5 rounded-xl font-bold shadow-lg shadow-blue-900/20 hover:bg-[#15325b] transition-all',
            cancelButton: 'bg-white text-gray-500 border border-gray-200 px-6 py-2.5 rounded-xl font-bold hover:bg-gray-50 transition-colors',
            actions: 'gap-3'
        },
        buttonsStyling: false // Important to use customClass
    });

    return result.isConfirmed;
};
