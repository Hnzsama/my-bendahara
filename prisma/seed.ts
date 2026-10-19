import { PrismaClient } from "@prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import bcrypt from "bcryptjs";
import path from "path";

const dbUrl = process.env.DATABASE_URL || `file:${path.join(process.cwd(), "dev.db")}`;
const adapter = new PrismaBetterSqlite3({ url: dbUrl });
const prisma = new PrismaClient({ adapter });

const classAStudents = [
  "Wulan",
  "Hilda",
  "Nilam",
  "Zaskiya",
  "Dinda",
  "Ashilah",
  "Nizar",
  "Rara",
  "Rei",
  "Fadhil",
  "Dika",
  "Andung/Albar",
  "Rafif",
  "Julio",
  "Nayla",
  "Amir",
  "Baarigh",
  "Lingga",
  "Lukman",
  "Rizky",
  "Zacky",
  "Lazu",
  "Abidah",
  "Ariz",
  "Vita",
  "Akbar",
  "Ilham",
  "Wildan",
  "Wira",
  "Lionel",
  "Daffa",
  "Hilmi",
  "Dhana",
];

const classBStudents = [
  "Bagus",
  "Bintang",
  "Jeje",
  "Avan",
  "Faza",
  "Nyssa",
  "Viandra",
  "Epi",
  "Afri",
  "Irawan",
  "Pasha",
  "Vanhan/Reda",
  "Bella",
  "Icha",
  "Nailla",
  "Airin",
  "Khayla",
  "Farid",
  "Wahyu",
  "Rival",
  "Farhan",
  "Dava",
  "Awa",
  "Oden",
  "Icad",
  "Alfaras",
  "Gerald",
  "Andra",
  "Abby",
];

const classCStudents = [
  "Anto",
  "Riska",
  "Rafi",
  "Arina",
  "Khanan",
  "Asa",
  "Rosell",
  "Riski",
  "Adit",
  "Fatwa",
  "Leily",
  "Aby",
  "Nasril",
  "Apta",
  "Ardhi",
  "Fajar",
  "Faiq",
  "Fina",
  "Nina",
  "Manda",
  "Carissa",
  "Tasya",
  "Defani",
  "Imel",
  "Risma",
  "Zakia",
  "Mikel",
  "Rifky",
  "Fahim",
  "Ina",
];

const classDStudents = [
  "Liani",
  "Akhdan",
  "Dita",
  "Dito",
  "Charis",
  "Rijal",
  "Dika",
  "Dhaffa Rizky",
  "Rasya",
  "Safira",
  "Aya",
  "Afan",
  "Abiyyu",
  "Dapo/Dafa Prima",
  "Belva",
  "Zakki",
  "Cinda",
  "Shelia/Popy",
  "Juva",
  "Akmal/Azhar",
  "Andy",
  "Daus",
  "Bayu",
  "Devkana",
  "Alan",
  "Faiz",
  "Rozaq",
  "Avin",
  "Adia",
  "Panji",
];

const classIStudents = [
  "Amel",
  "Cesa",
  "Afi",
  "Satria/Tegar",
  "Adrian",
  "Flo",
  "Satriyo",
  "Ella",
  "Naren",
  "Alya",
  "Ares",
  "Rifdah",
  "Aisyah",
  "Pileyo",
  "Hilbram",
  "Adam",
  "Soraya",
  "Ikram/Dafa",
  "Elvira",
  "Dilla",
  "Sena",
  "Bowo",
  "Bagus",
  "Rafael",
  "Luqman",
  "Jihad",
];

async function main() {
  console.log("🌱 Mereset dan seeding data Manajemen Informatika 2025...");

  // 1. Bersihkan Seluruh Data Lama
  await prisma.transaction.deleteMany();
  await prisma.bill.deleteMany();
  await prisma.paymentMethod.deleteMany();
  await prisma.student.deleteMany();
  await prisma.class.deleteMany();
  await prisma.admin.deleteMany();
  console.log("🧹 Data lama berhasil dibersihkan.");

  // 2. Buat Akun Bendahara: Ina & Ramadhan
  const passwordHash = await bcrypt.hash("bendahara123", 10);

  const ina = await prisma.admin.create({
    data: {
      email: "ina@bendahara.mi2025.id",
      username: "ina",
      passwordHash,
      fullName: "Ina (Bendahara 1)",
      role: "SUPER_ADMIN",
      phone: "081234567801",
      isActive: true,
    },
  });

  const ramadhan = await prisma.admin.create({
    data: {
      email: "ramadhan@bendahara.mi2025.id",
      username: "ramadhan",
      passwordHash,
      fullName: "Ramadhan (Bendahara 2)",
      role: "TREASURER",
      phone: "081234567802",
      isActive: true,
    },
  });

  console.log(`✅ Akun Bendahara dibuat:\n   - ${ina.fullName} (${ina.email})\n   - ${ramadhan.fullName} (${ramadhan.email})`);

  // 3. Buat Master Data Kelas (2025A, 2025B, 2025C, 2025D, 2025I)
  const classesData = [
    { name: "2025A", students: classAStudents },
    { name: "2025B", students: classBStudents },
    { name: "2025C", students: classCStudents },
    { name: "2025D", students: classDStudents },
    { name: "2025I", students: classIStudents },
  ];

  let totalStudents = 0;

  for (const item of classesData) {
    const createdClass = await prisma.class.create({
      data: {
        name: item.name,
        academicYear: "2025/2026",
        description: `Manajemen Informatika 2025 - ${item.name}`,
      },
    });

    console.log(`📁 Membuat ${item.name} (${item.students.length} mahasiswa)...`);

    for (let i = 0; i < item.students.length; i++) {
      const studentName = item.students[i];

      await prisma.student.create({
        data: {
          nim: null, // NIM opsional
          name: studentName,
          classId: createdClass.id,
        },
      });
      totalStudents++;
    }
  }

  console.log(`✅ Total ${classesData.length} Kelas dan ${totalStudents} Mahasiswa berhasil dimasukkan!`);

  // 4. Buat Metode Pembayaran Resmi Bendahara
  const methodQris = await prisma.paymentMethod.create({
    data: {
      name: "QRIS Kas Angkatan - Ina",
      type: "QRIS",
      bankName: "QRIS",
      accountNumber: "ID1025458146947",
      accountHolder: "HELAN SULUNG POENYA, EDUKASI",
      picName: "Ina (Bendahara 1)",
      qrisImageUrl: "/uploads/methods/qris-ina.jpeg",
      instructions: "Scan QRIS (a.n. HELAN SULUNG POENYA, EDUKASI) menggunakan Mobile Banking atau E-Wallet (GoPay, OVO, Dana, ShopeePay). Simpan bukti transfer untuk diunggah.",
      isActive: true,
      displayOrder: 1,
    },
  });

  const methodBca = await prisma.paymentMethod.create({
    data: {
      name: "BCA Kas Angkatan - Ramadhan",
      type: "BANK_TRANSFER",
      bankName: "BCA",
      accountNumber: "8735019284",
      accountHolder: "RAMADHAN",
      picName: "Ramadhan (Bendahara 2)",
      instructions: "Transfer melalui BCA / BI-Fast. Simpan bukti transfer untuk diunggah.",
      isActive: true,
      displayOrder: 2,
    },
  });

  console.log(`✅ Metode Pembayaran Bendahara dibuat: ${methodQris.name} & ${methodBca.name}`);

  // 5. Buat Tagihan Kas Rutin MI 2025
  const bill = await prisma.bill.create({
    data: {
      slug: "kas-angkatan-mi-2025",
      title: "Iuran Kas Angkatan MI 2025",
      description: "Iuran kas rutin Manajemen Informatika Angkatan 2025 untuk operasional dan kegiatan angkatan.",
      amount: 7000,
      dueDate: new Date("2026-10-31T23:59:59Z"),
      academicTerm: "Ganjil 2025/2026",
      isActive: true,
    },
  });

  console.log(`✅ Tagihan dibuat: "${bill.title}" (Rp 7.000)`);
  console.log("🎉 Reset & input data selesai dengan sempurna!");
}

main()
  .catch((e) => {
    console.error("❌ Terjadi kesalahan saat seeding:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
