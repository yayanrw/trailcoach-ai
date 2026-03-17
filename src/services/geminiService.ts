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
    - Target Race: ${data.targetRaceName} pada ${data.targetRaceDate}
    - Kategori & Spesifikasi Rute: ${data.distanceKm} km, Total Elevation Gain ${data.totalElevationGain} m, Tipe Teknis Skala ${data.technicalScale}/5
    - Profil Fisiologis: Umur ${data.age}, Berat Badan ${data.weightKg} kg, Resting Heart Rate ${data.restingHeartRate} bpm
    - Riwayat Lari: Pengalaman ${data.runningExperienceYears} tahun, Jarak Terjauh ${data.longestDistanceKm} km, Mileage Bulanan ${data.monthlyMileageKm} km
    - Ketersediaan Waktu: ${data.daysPerWeek} hari/minggu, Hari Libur: ${data.offDays.join(', ')}
    - Riwayat Cedera: ${data.injuryHistory}
    - Akses Fasilitas: ${data.facilityAccess}

    # PENTING (Volume Latihan):
    User memiliki mileage bulanan ${data.monthlyMileageKm} km (rata-rata ${Math.round(data.monthlyMileageKm / 4)} km per minggu). 
    JANGAN menurunkan volume latihan secara drastis di minggu-minggu awal jika user sudah terbiasa dengan volume tinggi. 
    Minggu pertama harus dimulai dengan volume yang mendekati atau sedikit di atas rata-rata mingguan saat ini (${Math.round(data.monthlyMileageKm / 4)} km), kecuali jika ada riwayat cedera yang membatasi.

    # Scientific Framework:
    1. Periodisasi (Macro & Mesocycles): Bagi rencana ke dalam fase: Base (Aerobic), Build (Strength/Vertical), Peak (Specific), Tapering, dan Race.
    2. Deload Week: Setiap minggu ke-4 (atau ke-3 jika user berusia >50 thn) harus merupakan minggu pemulihan dengan reduksi volume 30-50%.
    3. Strength Training: Fokus pada latihan eksentrik untuk menahan beban saat turunan (downhill) dan latihan core/stabilitas.
    4. Mobility/Yoga: Jadwalkan rutin pasca-lari untuk meningkatkan jangkauan gerak (ROM) dan aktivasi sistem saraf parasimpatis.

    # Output Requirements:
    - Strategy Summary: Penjelasan mengapa pola ini dipilih berdasarkan profil user dan data fitness tambahan (jika ada).
    - Training Plan Table: Daftar sesi latihan per tanggal MULAI DARI HARI INI (${today}) sampai hari H (${data.targetRaceDate}). 
      PENTING: Anda harus menyertakan entri untuk SETIAP HARI tanpa terkecuali. Jangan melompati bulan atau minggu. Jika ada hari istirahat, tandai sebagai "Rest".
    - Weekly Summary: Total jarak dan total elevasi per minggu.

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
          plan: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                date: { type: Type.STRING },
                day: { type: Type.STRING },
                type: { type: Type.STRING },
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
