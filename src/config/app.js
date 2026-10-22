// Pengaturan terpusat aplikasi. Ubah di sini, bukan di tiap halaman.
export const APP = {
  brand: "YANG MING",
  brandSub: "INDONESIA",
  heroImage: "/images/hero-images.jpg",
  bucket: "registration-documents",
  otpLength: 6, // harus sama dengan "Email OTP Length" di dashboard Supabase
  resendSeconds: 60,
  maxFileMB: 5, // sinkron dengan batas bucket di migrasi SQL
  accept: { "application/pdf": ".pdf", "image/jpeg": ".jpg", "image/png": ".png" },
  pageSize: 10,
  categories: ["Customer", "Vendor / Partner", "Agent", "Other"],
  minPassword: 8,
};
export const STATUS = { pending: "Pending", approved: "Approved", rejected: "Rejected" };
