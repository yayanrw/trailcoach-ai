import { GoogleGenAI, Type } from "@google/genai";
import { AssessmentData, TrainingPlanResponse } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export async function generateTrainingPlan(data: AssessmentData): Promise<TrainingPlanResponse> {
  const today = new Date().toISOString().split('T')[0];
  
  const contents: any[] = [
    {
      text: `
    # Role
    Anda adalah seorang Pelatih Trail Running Profesional dan Pakar Sports Science dengan spesialisasi dalam Ultra-Endurance. Tugas Anda adalah membuat "Adaptive Trail Running Plan" yang berbasis data medis dan riset olahraga terbaru.

    # User Assessment Data:
    - Hari Ini (Start Date): ${today}
    - Tipe Latihan: ${data.trainingType === 'trail' ? 'Trail Running' : 'Road Running'}
    - Target Race: ${data.targetRaceName} pada ${data.targetRaceDate}
    - Kategori & Spesifikasi Rute: ${data.distanceKm} km, ${data.trainingType === 'trail' ? `Total Elevation Gain ${data.totalElevationGain} meter, Tipe Teknis Skala ${data.technicalScale}/5` : 'Road Course'}
    - Profil Fisiologis: Umur ${data.age}, Berat Badan ${data.weightKg} kg, Resting Heart Rate ${data.restingHeartRate} bpm
    - Riwayat Lari: Pengalaman ${data.runningExperienceYears} tahun, Jarak Terjauh ${data.longestDistanceKm} km, Mileage Bulanan ${data.monthlyMileageKm} km
    - Ketersediaan Waktu: ${data.daysPerWeek} hari/minggu, Hari Libur (WAJIB REST): ${data.offDays.join(', ')}, Pilihan Hari Long Run: ${data.longRunDays.join(', ')}
    - ATURAN LONG RUN: Setiap minggu, pilih SALAH SATU hari dari "Pilihan Hari Long Run" (${data.longRunDays.join(', ')}) untuk menjadi hari sesi lari jarak jauh (Long Run). Anda bisa merotasi hari tersebut jika ada lebih dari satu pilihan, asalkan tetap logis dalam struktur mingguan.
    - Riwayat Cedera: ${data.injuryHistory}
    - Akses Fasilitas: ${data.facilityAccess}

    # PENTING (Volume Latihan & Hari Libur):
    - User memiliki mileage bulanan ${data.monthlyMileageKm} km (rata-rata ${Math.round(data.monthlyMileageKm / 4)} km per minggu). 
    - JANGAN menurunkan volume latihan secara drastis di minggu-minggu awal jika user sudah terbiasa dengan volume tinggi. 
    - Minggu pertama harus dimulai dengan volume yang mendekati atau sedikit di atas rata-rata mingguan saat ini (${Math.round(data.monthlyMileageKm / 4)} km), kecuali jika ada riwayat cedera yang membatasi.
    - WAJIB: Hari-hari yang tercantum dalam "Hari Libur" (${data.offDays.join(', ')}) HARUS selalu ditandai sebagai "Rest" di dalam tabel rencana latihan tanpa pengecualian.

    # Scientific Framework:
    1. Periodisasi (Macro & Mesocycles): Bagi rencana ke dalam fase: Base (Aerobic), Build (${data.trainingType === 'trail' ? 'Strength/Vertical' : 'Speed/Threshold'}), Peak (Specific), Tapering, dan Race.
    2. Deload Week: Setiap minggu ke-4 (atau ke-3 jika user berusia >50 thn) harus merupakan minggu pemulihan dengan reduksi volume 30-50%.
    3. Session Types (HANYA GUNAKAN TIPE INI):
       - 'run': Untuk semua jenis lari (Easy, Intervals, Hills, Long Run).
       - 'strength': Untuk latihan kekuatan otot.
       - 'mobility': Untuk latihan fleksibilitas dan mobilitas.
       - 'rest': Untuk hari istirahat total.
    4. ATURAN SESI PER HARI: ${data.allowMultipleSessionsPerDay 
      ? `PENTING: User MENGIZINKAN lebih dari satu aktivitas per hari. Anda SANGAT DISARANKAN untuk menggabungkan sesi (misal: 'run' di pagi hari dan 'strength' atau 'mobility' di sore hari) setidaknya 1-2 kali seminggu. 
      CONTOH STRUKTUR JSON UNTUK 2 SESI DI HARI YANG SAMA:
      {
        "date": "2026-03-01",
        "day": "Sunday",
        "type": "run",
        ...
      },
      {
        "date": "2026-03-01",
        "day": "Sunday",
        "type": "strength",
        ...
      }` 
      : "Hanya diperbolehkan SATU tipe sesi per hari. JANGAN menggabungkan 'run' dan 'strength' di hari yang sama. Pilih prioritas utama untuk hari tersebut."}
    5. Mobility/Yoga: Bisa dimasukkan sebagai sesi 'mobility' mandiri di hari pemulihan atau hari khusus.

    # Output Requirements:
    - Strategy Summary: Penjelasan mengapa pola ini dipilih berdasarkan profil user, tipe latihan (${data.trainingType}), dan data fitness tambahan (jika ada).
    - Plan Description (WAJIB DETAIL):
       - PENTING: Jika ada 2 aktivitas di hari yang sama (misal: Lari + Strength), JANGAN menggabungkannya dalam satu deskripsi. Anda HARUS membuat dua objek terpisah dalam array 'plan' dengan tanggal yang sama.
       - Jika 'run': Sebutkan struktur latihan (WU, Main Set, CD) dan Zona Intensitas (Z1-Z5).
         Contoh: "TEMPO RUN 1km WU Z2, 5km TEMPO Z4, 1km CD Z2" atau "INTERVAL 1km WU Z2, 8x400m Z5 Rest 2 min, 1km CD Z2" atau "EASY RUN Z2".
       - Jika 'strength': Sebutkan nama gerakan, set, dan repetisi.
         Contoh: "Bulgarian Squat 4x8 with 10kg dumbbell, Plank 3x1min".
       - Jika 'mobility': Sebutkan fokus area atau gerakan spesifik.
    - Session Data (durationMileage):
       - PENTING: JANGAN PERNAH menggabungkan jarak dan durasi dalam satu string.
       - CONTOH SALAH: "5 km (35 min)", "10 km / 60 min", "45 min (Strength)".
       - CONTOH BENAR (Run): "10 km".
       - CONTOH BENAR (Strength/Mobility): "45 min".
       - Jika tipe sesi adalah 'run': HANYA isi dengan jarak dalam km. Contoh: "10 km".
       - Jika tipe sesi adalah 'strength' atau 'mobility': HANYA isi dengan durasi dalam menit. Contoh: "45 min".
       - Jika tipe sesi adalah 'rest': Isi dengan "0".
    - Periodization: Daftar fase latihan (Base, Build, Peak, Taper, Race) dengan rentang tanggalnya.
    - Training Plan Table: Daftar sesi latihan per tanggal MULAI DARI TANGGAL ${data.planStartDate} sampai hari H (${data.targetRaceDate}). 
      PENTING: Anda harus menyertakan entri untuk SETIAP HARI tanpa terkecuali. Jangan melompati bulan atau minggu. Jika ada hari istirahat, tandai sebagai "Rest".
    - Weekly Summary: Total jarak (km) dan total elevasi (meter) per minggu (Minggu dihitung dari Senin sampai Minggu). Contoh: totalDistance: "45 km", totalElevation: "1200".

    Format output harus dalam JSON yang valid sesuai schema.
    `
    }
  ];

  if (data.fitnessImage) {
    const base64Data = data.fitnessImage.split(',')[1];
    const mimeType = data.fitnessImage.split(';')[0].split(':')[1];
    contents.push({
      inlineData: {
        data: base64Data,
        mimeType: mimeType
      }
    });
    contents[0].text += "\n# Data Tambahan:\nAnalisis gambar fitness level yang dilampirkan (Intervals.icu/Strava/dll) untuk menyesuaikan intensitas dan volume latihan agar lebih akurat.";
  }

  const response = await ai.models.generateContent({
    model: "gemini-3.1-pro-preview",
    contents: { parts: contents },
    config: {
      systemInstruction: "Anda adalah pelatih lari profesional. Jika user mengizinkan lebih dari satu aktivitas per hari (allowMultipleSessionsPerDay: true), Anda HARUS secara aktif menggabungkan sesi lari dengan strength atau mobility di hari yang sama untuk efisiensi latihan. Pastikan output JSON Anda menyertakan objek terpisah untuk setiap sesi meskipun tanggalnya sama. PENTING: Untuk 'durationMileage', gunakan HANYA jarak (misal: '5 km') untuk lari, dan HANYA durasi (misal: '45 min') untuk strength/mobility. JANGAN PERNAH menggabungkan keduanya.",
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          strategySummary: { type: Type.STRING },
          periodization: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                name: { type: Type.STRING },
                startDate: { type: Type.STRING },
                endDate: { type: Type.STRING },
                description: { type: Type.STRING },
              },
              required: ["name", "startDate", "endDate", "description"]
            }
          },
          plan: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                date: { type: Type.STRING },
                day: { type: Type.STRING },
                type: { 
                  type: Type.STRING, 
                  description: "Tipe sesi: 'run', 'mobility', 'strength', atau 'rest'." 
                },
                durationMileage: { 
                  type: Type.STRING,
                  description: "Format KETAT: Jika 'run' isi jarak (misal: '5 km'). Jika 'strength'/'mobility' isi durasi (misal: '45 min'). JANGAN GABUNGKAN KEDUANYA."
                },
                elevationGain: { 
                  type: Type.STRING,
                  description: "Total elevation gain dalam METER. Contoh: '500' atau '1200'."
                },
                description: { 
                  type: Type.STRING,
                  description: "Detail rencana sesi (WAJIB DETAIL). Contoh: 'TEMPO RUN 1km WU Z2, 5km TEMPO Z4, 1km CD Z2' atau 'Bulgarian Squat 4x8 with 10kg dumbbell'."
                },
                focus: { type: Type.STRING },
                nutritionHydration: { type: Type.STRING },
              },
              required: ["date", "day", "type", "durationMileage", "elevationGain", "description", "focus", "nutritionHydration"]
            }
          },
          weeklySummaries: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                weekNumber: { type: Type.INTEGER },
                totalDistance: { type: Type.STRING },
                totalElevation: { type: Type.STRING },
              },
              required: ["weekNumber", "totalDistance", "totalElevation"]
            }
          }
        },
        required: ["strategySummary", "plan", "weeklySummaries"]
      }
    }
  });

  if (!response.text) {
    throw new Error("Gagal menghasilkan rencana latihan.");
  }

  return JSON.parse(response.text.trim());
}
