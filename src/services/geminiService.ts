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
    - Kategori & Spesifikasi Rute: ${data.distanceKm} km, ${data.trainingType === 'trail' ? `Total Elevation Gain ${data.totalElevationGain} m, Tipe Teknis Skala ${data.technicalScale}/5` : 'Road Course'}
    - Profil Fisiologis: Umur ${data.age}, Berat Badan ${data.weightKg} kg, Resting Heart Rate ${data.restingHeartRate} bpm
    - Riwayat Lari: Pengalaman ${data.runningExperienceYears} tahun, Jarak Terjauh ${data.longestDistanceKm} km, Mileage Bulanan ${data.monthlyMileageKm} km
    - Ketersediaan Waktu: ${data.daysPerWeek} hari/minggu, Hari Libur (WAJIB REST): ${data.offDays.join(', ')}
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
    4. ATURAN KETAT: Hanya diperbolehkan SATU tipe sesi per hari. JANGAN menggabungkan 'run' dan 'strength' di hari yang sama. Pilih prioritas utama untuk hari tersebut.
    5. Mobility/Yoga: Bisa dimasukkan sebagai sesi 'mobility' mandiri di hari pemulihan atau hari khusus.

    # Output Requirements:
    - Strategy Summary: Penjelasan mengapa pola ini dipilih berdasarkan profil user, tipe latihan (${data.trainingType}), dan data fitness tambahan (jika ada).
    - Periodization: Daftar fase latihan (Base, Build, Peak, Taper, Race) dengan rentang tanggalnya.
    - Training Plan Table: Daftar sesi latihan per tanggal MULAI DARI HARI INI (${today}) sampai hari H (${data.targetRaceDate}). 
      PENTING: Anda harus menyertakan entri untuk SETIAP HARI tanpa terkecuali. Jangan melompati bulan atau minggu. Jika ada hari istirahat, tandai sebagai "Rest".
    - Weekly Summary: Total jarak dan total elevasi per minggu (Minggu dihitung dari Senin sampai Minggu).

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
                  description: "Tipe sesi: 'run', 'mobility', 'strength', atau 'rest'. Hanya satu tipe per hari." 
                },
                durationMileage: { type: Type.STRING },
                elevationGain: { type: Type.STRING },
                description: { type: Type.STRING },
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
